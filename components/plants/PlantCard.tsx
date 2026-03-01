import React, { useMemo, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { RecommendationDeckItem } from '@/lib/recommendations/deckBuilder';

export interface LiftStartPayload {
  cardId: string;
  plant: RecommendationDeckItem;
  originRect: { x: number; y: number; width: number; height: number };
  touchX: number;
  touchY: number;
}

export interface LiftMovePayload {
  cardId: string;
  x: number;
  y: number;
}

export interface LiftEndPayload {
  cardId: string;
  x: number;
  y: number;
  velocityY: number;
}

export interface LiftCancelPayload {
  cardId: string;
}

interface PlantCardProps {
  plant: RecommendationDeckItem;
  onPress: () => void;
  enableLiftGesture?: boolean;
  onLiftStart?: (payload: LiftStartPayload) => void;
  onLiftMove?: (payload: LiftMovePayload) => void;
  onLiftEnd?: (payload: LiftEndPayload) => void;
  onLiftCancel?: (payload: LiftCancelPayload) => void;
  onLiftStateChange?: (active: boolean) => void;
}

export default function PlantCard({
  plant,
  onPress,
  enableLiftGesture = true,
  onLiftStart,
  onLiftMove,
  onLiftEnd,
  onLiftCancel,
  onLiftStateChange,
}: PlantCardProps) {
  const containerRef = useRef<View>(null);
  const isLiftActive = useRef(false);
  const longPressActive = useRef(false);

  const liftCallbacks = useMemo(
    () => ({
      onStart: (event: { absoluteX: number; absoluteY: number }) => {
        isLiftActive.current = true;
        onLiftStateChange?.(true);
        containerRef.current?.measureInWindow((x, y, width, height) => {
          onLiftStart?.({
            cardId: plant.id,
            plant,
            originRect: { x, y, width, height },
            touchX: event.absoluteX,
            touchY: event.absoluteY,
          });
        });
      },
      onUpdate: (event: { absoluteX: number; absoluteY: number }) => {
        if (!isLiftActive.current) return;
        onLiftMove?.({
          cardId: plant.id,
          x: event.absoluteX,
          y: event.absoluteY,
        });
      },
      onEnd: (event: { absoluteX: number; absoluteY: number; velocityY: number }) => {
        if (!isLiftActive.current) return;
        onLiftEnd?.({
          cardId: plant.id,
          x: event.absoluteX,
          y: event.absoluteY,
          velocityY: event.velocityY,
        });
        isLiftActive.current = false;
        onLiftStateChange?.(false);
      },
      onFinalize: () => {
        if (isLiftActive.current) {
          isLiftActive.current = false;
          onLiftCancel?.({ cardId: plant.id });
          onLiftStateChange?.(false);
        }
      },
    }),
    [onLiftCancel, onLiftEnd, onLiftMove, onLiftStart, onLiftStateChange, plant]
  );

  const lastRect = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const liftGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .enabled(enableLiftGesture)
      .activeOffsetY([-5, 5])
      .failOffsetX([-15, 15])
      .shouldCancelWhenOutside(false)
      .onBegin(() => {
        containerRef.current?.measureInWindow((x, y, width, height) => {
          lastRect.current = { x, y, width, height };
        });
      })
      .onStart((event) => {
        if (!lastRect.current) return;
        isLiftActive.current = true;
        onLiftStateChange?.(true);
        onLiftStart?.({
          cardId: plant.id,
          plant,
          originRect: lastRect.current,
          touchX: event.absoluteX,
          touchY: event.absoluteY,
        });
      })
      .onUpdate((event) => {
        if (!isLiftActive.current) return;
        onLiftMove?.({
          cardId: plant.id,
          x: event.absoluteX,
          y: event.absoluteY,
        });
      })
      .onEnd((event) => {
        if (!isLiftActive.current) return;
        onLiftEnd?.({
          cardId: plant.id,
          x: event.absoluteX,
          y: event.absoluteY,
          velocityY: event.velocityY,
        });
      })
      .onFinalize(() => {
        if (isLiftActive.current) {
          isLiftActive.current = false;
          onLiftCancel?.({ cardId: plant.id });
          onLiftStateChange?.(false);
        }
      });

    const tap = Gesture.Tap()
      .runOnJS(true)
      .onEnd(() => {
        if (!isLiftActive.current) onPress();
      });

    return Gesture.Exclusive(pan, tap);
  }, [enableLiftGesture, onLiftCancel, onLiftEnd, onLiftMove, onLiftStart, onLiftStateChange, onPress, plant]);

  const waterDisplay =
    plant.water_requirement === 'high'
      ? 'Water: High'
      : plant.water_requirement === 'medium'
        ? 'Water: Medium'
        : 'Water: Low';

  return (
    <GestureDetector gesture={liftGesture}>
      <View ref={containerRef} style={styles.card}>
        <View style={styles.hero}>
          {plant.image_url ? (
            <Image 
              source={{ 
                uri: plant.image_url,
                headers: { 'User-Agent': 'GreenScape/1.0 (https://greenscape.app)' }
              }} 
              style={styles.heroImage} 
              resizeMode="cover" 
              onError={() => console.warn(`[Failsafe] Card image failed: ${plant.common_name}`)}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.placeholderEmoji}>🌵</Text>
            </View>
          )}
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>#{plant.rank}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.commonName} numberOfLines={1}>
            {plant.common_name}
          </Text>
          <Text style={styles.scientificName} numberOfLines={1}>
            {plant.scientific_name}
          </Text>

          <View style={styles.tagsRow}>
            <Text style={styles.tag}>{waterDisplay}</Text>
            <Text style={styles.tag}>Height: {plant.mature_height_meters}m</Text>
            {plant.is_toxic_to_pets ? <Text style={styles.warningTag}>Not pet-safe</Text> : null}
          </View>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardPressTarget: {
  },
  card: {
    height: 232,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#8b5a2b',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },
  hero: {
    height: 118,
    backgroundColor: '#dcfce7',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  rankBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 83, 45, 0.88)',
  },
  rankBadgeText: {
    color: '#f0fdf4',
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  commonName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14532d',
  },
  scientificName: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  warningTag: {
    fontSize: 12,
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
});
