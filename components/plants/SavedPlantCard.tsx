import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface SavedPlantCardProps {
  commonName: string;
  scientificName: string;
  waterRequirement?: 'low' | 'medium' | 'high';
  matureHeightMeters?: number;
  isToxicToPets?: boolean;
  imageUrl?: string;
  placedCount: number;
}

function formatWaterTag(waterRequirement?: 'low' | 'medium' | 'high'): string | null {
  if (!waterRequirement) return null;
  if (waterRequirement === 'high') return 'Water: High';
  if (waterRequirement === 'medium') return 'Water: Medium';
  return 'Water: Low';
}

export default function SavedPlantCard({
  commonName,
  scientificName,
  waterRequirement,
  matureHeightMeters,
  isToxicToPets,
  imageUrl,
  placedCount,
}: SavedPlantCardProps) {
  const waterTag = formatWaterTag(waterRequirement);

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={styles.placeholderEmoji}>🌿</Text>
          </View>
        )}
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>x{placedCount}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.commonName} numberOfLines={1}>
          {commonName}
        </Text>
        <Text style={styles.scientificName} numberOfLines={1}>
          {scientificName}
        </Text>

        <View style={styles.tagsRow}>
          {waterTag ? <Text style={styles.tag}>{waterTag}</Text> : null}
          {typeof matureHeightMeters === 'number' ? (
            <Text style={styles.tag}>Height: {matureHeightMeters}m</Text>
          ) : null}
          {isToxicToPets ? <Text style={styles.warningTag}>Not pet-safe</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 232,
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
    fontSize: 36,
  },
  countBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 83, 45, 0.88)',
  },
  countBadgeText: {
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
