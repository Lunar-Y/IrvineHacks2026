import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
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

  const liftGesture = useMemo(() => {
    const longPressGesture = Gesture.LongPress()
      .runOnJS(true)
      .enabled(enableLiftGesture)
      .minDuration(50)
      .maxDistance(48)
      .onStart((event) => {
        longPressActive.current = true;
        liftCallbacks.onStart({ absoluteX: event.absoluteX, absoluteY: event.absoluteY });
      })
      .onFinalize(() => {
        if (!isLiftActive.current) longPressActive.current = false;
      });

    const dragAfterHoldGesture = Gesture.Pan()
      .runOnJS(true)
      .enabled(enableLiftGesture)
      .activeOffsetY([-8, 8])
      .failOffsetX([-30, 30])
      .onUpdate((event) => {
        if (!isLiftActive.current) return;
        liftCallbacks.onUpdate({ absoluteX: event.absoluteX, absoluteY: event.absoluteY });
      })
      .onEnd((event) => {
        if (!isLiftActive.current) return;
        liftCallbacks.onEnd({
          absoluteX: event.absoluteX,
          absoluteY: event.absoluteY,
          velocityY: event.velocityY,
        });
        longPressActive.current = false;
      })
      .onFinalize(() => {
        if (isLiftActive.current) liftCallbacks.onFinalize();
        longPressActive.current = false;
      });

    return Gesture.Simultaneous(longPressGesture, dragAfterHoldGesture);
  }, [enableLiftGesture, liftCallbacks]);

  const waterDisplay =
    plant.water_requirement === 'high'
      ? 'Water: High'
      : plant.water_requirement === 'medium'
        ? 'Water: Medium'
        : 'Water: Low';

  const difficultyDisplay = `Difficulty: ${plant.care_difficulty.charAt(0).toUpperCase() + plant.care_difficulty.slice(1)}`;

  return (
    <GestureDetector gesture={liftGesture}>
      <View ref={containerRef}>
        <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.cardPressTarget}>
          <View style={styles.card}>
            <View style={styles.hero}>
              {plant.image_url ? (
                <Image 
                  source={{ 
                    uri: plant.image_url,
                    headers: { 'User-Agent': 'LawnLens/1.0 (https://lawnlens.app; contact@lawnlens.app)' }
                  }} 
                  style={styles.heroImage} 
                  contentFit="cover" 
                  onLoadStart={() => console.log(`[ImageDebug] Starting load for: ${plant.common_name} - ${plant.image_url}`)}
                  onLoad={() => console.log(`[ImageDebug] Successfully loaded: ${plant.common_name}`)}
                  onError={(error) => {
                    console.error(`[ImageDebug] Error loading ${plant.common_name}:`, error.error);
                  }}
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
                <Text style={styles.tag}>{difficultyDisplay}</Text>
                <Text style={styles.tag}>{waterDisplay}</Text>
                <Text style={styles.tag}>Height: {plant.mature_height_meters}m</Text>
                <Text style={plant.is_toxic_to_pets ? styles.warningTag : styles.successTag}>
                  {plant.is_toxic_to_pets ? 'Not Pet Safe' : 'Pet Safe'}
                </Text>
                <Text style={plant.is_toxic_to_humans ? styles.warningTag : styles.successTag}>
                  {plant.is_toxic_to_humans ? 'Not Child Safe' : 'Child Safe'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardPressTarget: {
  },
  card: {
    height: 340, // Standardized to largest required height
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
    height: 140, // Increased from 118 for better visual impact
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
    gap: 6,
    marginTop: 10,
  },
  tag: {
    fontSize: 11,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500',
  },
  successTag: {
    fontSize: 11,
    color: '#166534',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
  warningTag: {
    fontSize: 11,
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
  },
});
