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
  const { recommendations, currentScan, arPlacePlant } = useScanStore();
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
    const rawZone = (profile as Record<string, unknown>).hardiness_zone;
    if (typeof rawZone === 'number' || typeof rawZone === 'string') return `Zone ${rawZone}`;
    return 'Zone 9b';
  }, [currentScan.assembledProfile]);

  const panelTop = SCREEN_HEIGHT * TOP_REGION_RATIO;
  const panelBottom = insets.bottom + TAB_BAR_VISUAL_HEIGHT + PANEL_TO_TAB_GAP;
  const cardWidth = Math.min(330, SCREEN_WIDTH * CARD_WIDTH_RATIO);
  const horizontalInset = (SCREEN_WIDTH - cardWidth) / 2;
  const snapInterval = cardWidth + CARD_SEPARATOR;

  const dragOverlayStyle = useAnimatedStyle(() => {
    if (!activeDragRef.current) return { opacity: 0 };
    return {
      transform: [
        { translateX: activeDragRef.current.startRect.x + dragTranslateX.value },
        { translateY: activeDragRef.current.startRect.y + dragTranslateY.value },
        { scale: dragScale.value }
      ],
      opacity: dragOpacity.value,
    };
  });

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

  const handleLiftStart = useCallback((payload: LiftStartPayload) => {
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
    dragTranslateX.value = 0;
    dragTranslateY.value = 0;
    dragScale.value = 1.1;
  }, [dragScale, dragTranslateX, dragTranslateY]);

  const handleLiftMove = useCallback((payload: LiftMovePayload) => {
    const drag = activeDragRef.current;
    if (!drag) return;
    // We get absolute coords from the gesture, so we subtract start pos
    dragTranslateX.value = payload.x - drag.startRect.x - drag.touchOffsetX;
    dragTranslateY.value = payload.y - drag.startRect.y - drag.touchOffsetY;

    const liftedAmount = clamp(-dragTranslateY.value, 0, 300);
    dragScale.value = interpolate(liftedAmount, [0, 300], [1.1, 1.2]);
    dragOpacity.value = interpolate(liftedAmount, [0, 300], [1, 0.9]);
  }, [dragOpacity, dragScale, dragTranslateX, dragTranslateY]);

  const handleLiftEnd = useCallback((payload: LiftEndPayload) => {
    const drag = activeDragRef.current;
    if (!drag) return;

    const isValidDrop = (payload.y < panelTop + 80) || payload.velocityY < -500;

    if (isValidDrop) {
      setDropTarget({ x: payload.x, y: payload.y });
      const matchingIndex = deckItems.findIndex(item => item.id === drag.cardId);
      const plantIndex = matchingIndex >= 0 ? matchingIndex : 0;

      // Animate "into" the AR
      dragScale.value = withTiming(0.01, { duration: 300 });
      dragOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(clearDragState)();
          if (arPlacePlant) {
            runOnJS(arPlacePlant)(plantIndex, drag.plant.common_name);
          }
        }
      });
      return;
    }

    // Snap back
    dragTranslateX.value = withSpring(0);
    dragTranslateY.value = withSpring(0);
    dragScale.value = withSpring(1);
    dragOpacity.value = withSpring(1, {}, (finished) => {
      if (finished) runOnJS(clearDragState)();
    });
  }, [clearDragState, deckItems, dragOpacity, dragScale, dragTranslateX, dragTranslateY, panelTop, arPlacePlant]);

  const handleLiftCancel = useCallback(() => clearDragState(), [clearDragState]);

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

      <View style={[styles.panel, { top: panelTop, bottom: panelBottom }]}>
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

        <Text style={styles.hintText}>Swipe left/right • Drag up to place</Text>

        <FlatList
          ref={flatListRef}
          data={deckItems}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={snapInterval}
          getItemLayout={(_, index) => ({
            length: snapInterval,
            offset: snapInterval * index,
            index,
          })}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
            const boundedIndex = Math.max(0, Math.min(index, Math.max(deckItems.length - 1, 0)));
            setCurrentIndex(boundedIndex);
          }}
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
                      (p) => p.common_name === item.common_name && p.scientific_name === item.scientific_name
                    );
                    router.push(`/plant/${matchingIndex >= 0 ? matchingIndex : 0}`);
                  }}
                />
              </View>
            );
          }}
        />
        <Text style={styles.countText}>Showing {deckItems.length} recommendations</Text>
      </View>

      {activeDrag && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.dragCardContainer, { width: activeDrag.startRect.width }, dragOverlayStyle]}>
            <PlantCard plant={activeDrag.plant} enableLiftGesture={false} onPress={() => { }} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
  dragCardContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
