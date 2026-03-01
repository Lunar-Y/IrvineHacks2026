import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import PlantCard from '@/components/plants/PlantCard';
import { buildDummyDeck, RecommendationDeckItem } from '@/lib/recommendations/deckBuilder';
import {
  PANEL_ANIMATION_DURATION_MS,
  PANEL_COLLAPSE_VELOCITY,
  PanelState,
} from '@/lib/ui/recommendationsPanel';
import { useScanStore } from '@/lib/store/scanStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_REGION_RATIO = 0.48;
const PANEL_TO_TAB_GAP = 0;
const CARD_WIDTH_RATIO = 0.66;
const CARD_SEPARATOR = 14;
const PANEL_DRAG_HANDLE_HEIGHT = 72;
const MINIMIZED_VISIBLE_STRIP_HEIGHT = 56;
const MINIMIZED_EXTRA_LIFT_PX = 15;
const TAB_BAR_HEIGHT_IOS = 64;
const TAB_BAR_HEIGHT_ANDROID = 64;
const TAB_BAR_BOTTOM_OFFSET_IOS = 30;
const TAB_BAR_BOTTOM_OFFSET_ANDROID = 20;

interface RecommendationsOverlayProps {
  onRequestRescan?: () => void;
  onPlantPress?: (plantIndex: number) => void;
  hideScanAnotherButton?: boolean;
  reserveTabBarSpace?: boolean;
}

function normalizePlantKey(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function getPlantMatchKey(plant: { common_name?: string; scientific_name?: string }): string {
  return `${normalizePlantKey(plant.common_name)}::${normalizePlantKey(plant.scientific_name)}`;
}

export default function RecommendationsOverlay({
  onRequestRescan,
  onPlantPress,
  hideScanAnotherButton = false,
  reserveTabBarSpace = true,
}: RecommendationsOverlayProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentScan, resetScan } = useScanStore();
  const [deckItems, setDeckItems] = useState<RecommendationDeckItem[]>(() => buildDummyDeck(5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [panelState, setPanelState] = useState<PanelState>('expanded');
  const [isPanelAnimating, setIsPanelAnimating] = useState(false);
  const [isReturningToScan, setIsReturningToScan] = useState(false);
  const flatListRef = useRef<FlatList<RecommendationDeckItem>>(null);
  const recommendations = useMemo(
    () => (Array.isArray(currentScan.recommendations) ? currentScan.recommendations : []),
    [currentScan.recommendations]
  );
  const recommendationIndexByKey = useMemo(() => {
    const indexByKey = new Map<string, number>();
    recommendations.forEach((plant, index) => {
      const key = getPlantMatchKey(plant);
      if (!indexByKey.has(key)) indexByKey.set(key, index);
    });
    return indexByKey;
  }, [recommendations]);

  useEffect(() => {
    /**
     * CURRENT DUMMY BEHAVIOR:
     * - This screen consumes dummy-backed normalized recommendations.
     *
     * FUTURE API WIRING STEPS:
     * FUTURE_INTEGRATION: Swap this with validated backend payload mapping.
     *
     * VALIDATION/BACKFILL EXPECTATIONS:
     * FUTURE_INTEGRATION: Keep min-count and de-dupe in the normalization layer.
     *
     * FAILURE HANDLING AND ANALYTICS HOOKS TO ADD LATER:
     * FUTURE_INTEGRATION: Track deck impressions and detail-open CTR.
     */
    setDeckItems(buildDummyDeck(5, recommendations));
    setCurrentIndex(0);
  }, [recommendations]);

  const zoneLabel = useMemo(() => {
    const profile = currentScan.assembledProfile;
    if (!profile || typeof profile !== 'object') return 'Zone 9b';
    const rawZone = profile.hardiness_zone;
    if (typeof rawZone === 'number' || typeof rawZone === 'string') return `Zone ${rawZone}`;
    return 'Zone 9b';
  }, [currentScan.assembledProfile]);

  const panelTop = SCREEN_HEIGHT * TOP_REGION_RATIO;
  const panelBottom = PANEL_TO_TAB_GAP;
  const tabBarHeight = Platform.OS === 'ios' ? TAB_BAR_HEIGHT_IOS : TAB_BAR_HEIGHT_ANDROID;
  const tabBarOffset = Platform.OS === 'ios' ? TAB_BAR_BOTTOM_OFFSET_IOS : TAB_BAR_BOTTOM_OFFSET_ANDROID;
  const tabBarClearance = reserveTabBarSpace ? tabBarHeight + tabBarOffset : 0;
  const panelHeight = SCREEN_HEIGHT - panelTop - panelBottom;
  // Minimized state leaves a stable tappable strip above the nav bar footprint.
  const minimizedTranslateY = Math.max(
    0,
    panelHeight - (MINIMIZED_VISIBLE_STRIP_HEIGHT + tabBarClearance + MINIMIZED_EXTRA_LIFT_PX)
  );
  const cardWidth = Math.min(330, SCREEN_WIDTH * CARD_WIDTH_RATIO);
  const horizontalInset = (SCREEN_WIDTH - cardWidth) / 2;
  const snapInterval = cardWidth + CARD_SEPARATOR;

  const panelTranslateY = useSharedValue(0);
  const panelDragStart = useSharedValue(0);
  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
  }));

  useEffect(() => {
    panelTranslateY.value = panelState === 'expanded' ? 0 : minimizedTranslateY;
  }, [minimizedTranslateY, panelState, panelTranslateY]);

  const setPanelStateOnJS = useCallback((state: PanelState) => {
    setPanelState(state);
  }, []);

  const setIsPanelAnimatingOnJS = useCallback((value: boolean) => {
    setIsPanelAnimating(value);
  }, []);

  const animatePanelTo = useCallback(
    (nextState: PanelState) => {
      if (isPanelAnimating) return;
      const toValue = nextState === 'expanded' ? 0 : minimizedTranslateY;

      setIsPanelAnimating(true);
      panelTranslateY.value = withTiming(
        toValue,
        {
          duration: PANEL_ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setPanelStateOnJS)(nextState);
          }
          runOnJS(setIsPanelAnimatingOnJS)(false);
        }
      );
    },
    [isPanelAnimating, minimizedTranslateY, panelTranslateY, setIsPanelAnimatingOnJS, setPanelStateOnJS]
  );

  const minimizePanel = useCallback(() => {
    if (panelState === 'minimized' || isPanelAnimating) return;
    animatePanelTo('minimized');
  }, [animatePanelTo, isPanelAnimating, panelState]);

  const expandPanel = useCallback(() => {
    if (panelState === 'expanded' || isPanelAnimating) return;
    animatePanelTo('expanded');
  }, [animatePanelTo, isPanelAnimating, panelState]);

  const handleScanAnotherArea = useCallback(() => {
    if (isPanelAnimating || isReturningToScan) return;
    setIsReturningToScan(true);
    resetScan();
    if (onRequestRescan) {
      onRequestRescan();
      return;
    }
    router.dismiss();
    setTimeout(() => {
      router.replace('/(tabs)/scan');
    }, 0);
  }, [isPanelAnimating, isReturningToScan, onRequestRescan, resetScan, router]);

  const panelPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          panelDragStart.value = panelTranslateY.value;
          runOnJS(setIsPanelAnimatingOnJS)(true);
        })
        .onUpdate((e) => {
          panelTranslateY.value = clamp(panelDragStart.value + e.translationY, 0, minimizedTranslateY);
        })
        .onEnd((e) => {
          const current = panelTranslateY.value;
          const threshold = minimizedTranslateY * 0.5;
          const shouldCollapse = current > threshold || e.velocityY > PANEL_COLLAPSE_VELOCITY;
          const nextState: PanelState = shouldCollapse ? 'minimized' : 'expanded';
          const toValue = nextState === 'expanded' ? 0 : minimizedTranslateY;
          panelTranslateY.value = withTiming(toValue, {
            duration: PANEL_ANIMATION_DURATION_MS,
            easing: Easing.out(Easing.cubic),
          }, (finished) => {
            if (finished) {
              runOnJS(setPanelStateOnJS)(nextState);
            }
            runOnJS(setIsPanelAnimatingOnJS)(false);
          });
        }),
    [minimizedTranslateY, panelDragStart, panelTranslateY, setIsPanelAnimatingOnJS, setPanelStateOnJS]
  );

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
      const boundedIndex = Math.max(0, Math.min(index, Math.max(deckItems.length - 1, 0)));
      setCurrentIndex(boundedIndex);
    },
    [deckItems.length, snapInterval]
  );

  const handleScrollToIndexFailed = useCallback(
    ({ index }: { index: number }) => {
      flatListRef.current?.scrollToOffset({
        offset: Math.max(0, index * snapInterval),
        animated: true,
      });
    },
    [snapInterval]
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      {!hideScanAnotherButton ? (
        <TouchableOpacity
          accessibilityLabel="Reset scan"
          accessibilityHint="Returns to scan lawn screen"
          hitSlop={10}
          style={[styles.scanAgainButton, { top: insets.top + 14 }]}
          disabled={isPanelAnimating || isReturningToScan}
          onPress={handleScanAnotherArea}
        >
          <FontAwesome name="undo" size={16} color="#F5F7F6" />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        accessibilityLabel="Minimize recommendations"
        style={[styles.cameraTapRegion, { height: panelTop }]}
        activeOpacity={1}
        onPress={minimizePanel}>
        {panelState === 'expanded' ? (
          <View style={styles.dismissHint}>
            <Text style={styles.dismissText}>Tap to minimize</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Animated.View
        pointerEvents={panelState === 'minimized' ? 'box-none' : 'auto'}
        style={[styles.panel, { top: panelTop, bottom: panelBottom }, panelAnimatedStyle]}
      >
        <GestureDetector gesture={panelPanGesture}>
          <View style={styles.panelDragHandle}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Expand recommendations"
              accessibilityHint="Opens the recommendations panel"
              hitSlop={10}
              onPress={expandPanel}
              activeOpacity={0.85}
              style={styles.expandHandleButton}
            >
              <View style={styles.handleBar}>
                <View style={styles.handle} />
              </View>
            </TouchableOpacity>

            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={1}>
                Your Recommendations
              </Text>
              <View style={styles.zonePill}>
                <Text style={styles.zonePillText}>🗺 {zoneLabel}</Text>
              </View>
            </View>
          </View>
        </GestureDetector>

        <View pointerEvents={panelState === 'minimized' ? 'none' : 'auto'}>
          <Text style={styles.hintText}>Swipe left/right • Tap a card for details • Tap above to minimize</Text>
        </View>

        <View pointerEvents={panelState === 'minimized' ? 'none' : 'auto'}>
          <FlatList
            ref={flatListRef}
            data={deckItems}
            keyExtractor={(item) => item.id}
            horizontal
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={snapInterval}
            getItemLayout={(_, index) => ({
              length: snapInterval,
              offset: snapInterval * index,
              index,
            })}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            contentContainerStyle={{ paddingHorizontal: horizontalInset, paddingBottom: 10 }}
            ItemSeparatorComponent={() => <View style={{ width: CARD_SEPARATOR }} />}
            renderItem={({ item, index }) => {
              return (
                <View style={{ width: cardWidth }}>
                  <PlantCard
                    plant={item}
                    enableLiftGesture={false}
                    onPress={() => {
                      if (recommendations.length === 0) return;
                      const matchingIndex = recommendationIndexByKey.get(getPlantMatchKey(item));
                      if (matchingIndex === undefined) return;

                      if (onPlantPress) {
                        onPlantPress(matchingIndex);
                      } else {
                        router.push(`/plant/${matchingIndex}`);
                      }
                    }}
                  />
                </View>
              );
            }}
          />
        </View>

        <View pointerEvents={panelState === 'minimized' ? 'none' : 'auto'}>
          <Text style={styles.countText}>Showing {Math.max(deckItems.length, 5)} recommendations</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraTapRegion: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
    zIndex: 20,
  },
  scanAgainButton: {
    position: 'absolute',
    right: 20,
    zIndex: 30,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6B4F',
  },
  dismissHint: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  dismissText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '600',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#f8faf8',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
    overflow: 'visible',
  },
  panelDragHandle: {
    paddingBottom: 4,
  },
  expandHandleButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#14532d',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    flexShrink: 1,
    paddingRight: 8,
  },
  zonePill: {
    backgroundColor: '#ecfdf3',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  zonePillText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 12,
  },
  hintText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  countText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 10,
  },
});
