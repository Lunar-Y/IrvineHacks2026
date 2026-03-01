import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  clamp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import PlantCard, {
  LiftCancelPayload,
  LiftEndPayload,
  LiftMovePayload,
  LiftStartPayload,
} from '@/components/plants/PlantCard';
import { buildDummyDeck, RecommendationDeckItem } from '@/lib/recommendations/deckBuilder';
import { useScanStore } from '@/lib/store/scanStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_REGION_RATIO = 0.48;
const TAB_BAR_VISUAL_HEIGHT = 49;
const PANEL_TO_TAB_GAP = 0;
const CARD_WIDTH_RATIO = 0.66;
const CARD_SEPARATOR = 14;
const PANEL_DRAG_HANDLE_HEIGHT = 72;

interface ActiveDragState {
  cardId: string;
  plant: RecommendationDeckItem;
  startRect: { x: number; y: number; width: number; height: number };
  touchOffsetX: number;
  touchOffsetY: number;
  isDragging: boolean;
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentScan } = useScanStore();
  const recommendations = currentScan.recommendations;
  const [deckItems, setDeckItems] = useState<RecommendationDeckItem[]>(() => buildDummyDeck(5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [isLiftActive, setIsLiftActive] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ x: number; y: number } | null>(null);
  const flatListRef = useRef<FlatList<RecommendationDeckItem>>(null);
  const activeDragRef = useRef<ActiveDragState | null>(null);

  const dragTranslateX = useSharedValue(0);
  const dragTranslateY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);

  useEffect(() => {
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
  const panelBottom = insets.bottom + TAB_BAR_VISUAL_HEIGHT + PANEL_TO_TAB_GAP;
  const panelHeight = SCREEN_HEIGHT - panelTop - panelBottom;
  const maxPanelDrag = Math.max(0, panelHeight - PANEL_DRAG_HANDLE_HEIGHT);
  const cardWidth = Math.min(330, SCREEN_WIDTH * CARD_WIDTH_RATIO);
  const horizontalInset = (SCREEN_WIDTH - cardWidth) / 2;
  const snapInterval = cardWidth + CARD_SEPARATOR;

  const panelTranslateY = useSharedValue(0);
  const panelDragStart = useSharedValue(0);
  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelTranslateY.value }],
  }));

  const panelPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          panelDragStart.value = panelTranslateY.value;
        })
        .onUpdate((e) => {
          panelTranslateY.value = clamp(panelDragStart.value + e.translationY, 0, maxPanelDrag);
        })
        .onEnd((e) => {
          const current = panelTranslateY.value;
          const threshold = maxPanelDrag * 0.5;
          const shouldCollapse = current > threshold || e.velocityY > 150;
          const toValue = shouldCollapse ? maxPanelDrag : 0;
          panelTranslateY.value = withTiming(toValue, {
            duration: 280,
            easing: Easing.out(Easing.cubic),
          });
        }),
    [maxPanelDrag, panelDragStart, panelTranslateY]
  );

  const dragOverlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragTranslateX.value }, { translateY: dragTranslateY.value }, { scale: dragScale.value }],
    opacity: dragOpacity.value,
    zIndex: 9999,
    elevation: 9999,
  }));

  const clearDragState = useCallback(() => {
    activeDragRef.current = null;
    setActiveDrag(null);
    setIsLiftActive(false);
    setDropTarget(null);
    dragTranslateX.value = 0;
    dragTranslateY.value = 0;
    dragScale.value = 1;
    dragOpacity.value = 1;
  }, [dragOpacity, dragScale, dragTranslateX, dragTranslateY]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (activeDragRef.current || isLiftActive) return;
      const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
      const boundedIndex = Math.max(0, Math.min(index, Math.max(deckItems.length - 1, 0)));
      setCurrentIndex(boundedIndex);
    },
    [deckItems.length, isLiftActive, snapInterval]
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

  const handleLiftStart = useCallback(
    (payload: LiftStartPayload) => {
      const nextDrag: ActiveDragState = {
        cardId: payload.cardId,
        plant: payload.plant,
        startRect: payload.originRect,
        touchOffsetX: payload.touchX - payload.originRect.x,
        touchOffsetY: payload.touchY - payload.originRect.y,
        isDragging: true,
      };

      activeDragRef.current = nextDrag;
      setActiveDrag(nextDrag);
      setDropTarget(null);
      dragTranslateX.value = 0;
      dragTranslateY.value = 0;
      dragScale.value = 1;
      dragOpacity.value = 1;
    },
    [dragOpacity, dragScale, dragTranslateX, dragTranslateY]
  );

  const handleLiftMove = useCallback(
    (payload: LiftMovePayload) => {
      const drag = activeDragRef.current;
      if (!drag || drag.cardId !== payload.cardId) return;

      const nextX = payload.x - drag.startRect.x - drag.touchOffsetX;
      const nextY = payload.y - drag.startRect.y - drag.touchOffsetY;
      dragTranslateX.value = nextX;
      dragTranslateY.value = nextY;

      const liftedAmount = clamp(-nextY, 0, 260);
      dragScale.value = interpolate(liftedAmount, [0, 260], [1, 1.03]);
      dragOpacity.value = interpolate(liftedAmount, [0, 260], [1, 0.95]);
    },
    [dragOpacity, dragScale, dragTranslateX, dragTranslateY]
  );

  const handleLiftEnd = useCallback(
    (payload: LiftEndPayload) => {
      const drag = activeDragRef.current;
      if (!drag || drag.cardId !== payload.cardId) return;

      const isValidDrop = payload.y < panelTop;

      if (isValidDrop) {
        setDropTarget({ x: payload.x, y: payload.y });

        const targetTranslateX = payload.x - drag.startRect.x - drag.startRect.width / 2;
        const targetTranslateY = payload.y - drag.startRect.y - drag.startRect.height / 2;

        dragTranslateX.value = withTiming(targetTranslateX, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        });
        dragTranslateY.value = withTiming(targetTranslateY, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        });
        dragScale.value = withTiming(0.08, { duration: 220, easing: Easing.out(Easing.cubic) });
        dragOpacity.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(clearDragState)();
        });
        return;
      }

      dragTranslateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      dragTranslateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      dragScale.value = withSpring(1, { damping: 18, stiffness: 220 });
      dragOpacity.value = withSpring(1, { damping: 18, stiffness: 220 }, (finished) => {
        if (finished) runOnJS(clearDragState)();
      });
    },
    [clearDragState, dragOpacity, dragScale, dragTranslateX, dragTranslateY, panelTop]
  );

  const handleLiftCancel = useCallback(
    (_payload: LiftCancelPayload) => {
      clearDragState();
    },
    [clearDragState]
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.cameraTapRegion, { height: panelTop }]}
        activeOpacity={1}
        onPress={() => router.back()}>
        <View style={styles.dismissHint}>
          <Text style={styles.dismissText}>Tap to return to camera</Text>
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.panel, { top: panelTop, bottom: panelBottom }, panelAnimatedStyle]}>
        <GestureDetector gesture={panelPanGesture}>
          <View style={styles.panelDragHandle}>
            <View style={styles.handleBar}>
              <View style={styles.handle} />
            </View>

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

        <Text style={styles.hintText}>Swipe left/right • Drag up to place</Text>

        <FlatList
          ref={flatListRef}
          data={deckItems}
          keyExtractor={(item) => item.id}
          horizontal
          scrollEnabled={!isLiftActive && !activeDrag}
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
            const isActiveCard = index === currentIndex;
            const isGhosted = activeDrag?.cardId === item.id;
            return (
              <View style={{ width: cardWidth, opacity: isGhosted ? 0.25 : 1 }}>
                <PlantCard
                  plant={item}
                  enableLiftGesture={isActiveCard}
                  onLiftStart={handleLiftStart}
                  onLiftMove={handleLiftMove}
                  onLiftEnd={handleLiftEnd}
                  onLiftCancel={handleLiftCancel}
                  onLiftStateChange={setIsLiftActive}
                  onPress={() => {
                    const matchingIndex = recommendations.findIndex(
                      (plant) =>
                        plant.common_name === item.common_name &&
                        plant.scientific_name === item.scientific_name
                    );
                    router.push(`/plant/${matchingIndex >= 0 ? matchingIndex : 0}`);
                  }}
                />
              </View>
            );
          }}
        />

        <Text style={styles.countText}>Showing {Math.max(deckItems.length, 5)} recommendations</Text>
      </Animated.View>

      {activeDrag ? (
        <View pointerEvents="none" style={styles.dragOverlay}>
          <Animated.View
            style={[
              styles.dragCardContainer,
              {
                left: activeDrag.startRect.x,
                top: activeDrag.startRect.y,
                width: activeDrag.startRect.width,
              },
              dragOverlayStyle,
            ]}>
            <PlantCard plant={activeDrag.plant} enableLiftGesture={false} onPress={() => {}} />
          </Animated.View>

          {dropTarget ? (
            <View style={[styles.dropMarker, { left: dropTarget.x - 3, top: dropTarget.y - 3 }]} />
          ) : null}
        </View>
      ) : null}
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
  dragOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  dragCardContainer: {
    position: 'absolute',
  },
  dropMarker: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.7)',
  },
});
