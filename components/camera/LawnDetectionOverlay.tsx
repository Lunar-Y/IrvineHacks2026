import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LawnDetectionOverlayProps {
  isLawnDetected: boolean;
  confidence: number;
  surfaceType: 'Vegetation' | 'Substrate' | 'Hardscape' | 'Unknown';
}

export default function LawnDetectionOverlay({
  isLawnDetected,
  confidence,
  surfaceType,
}: LawnDetectionOverlayProps) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.pill}>
        <Text style={styles.text}>
          {isLawnDetected ? '✓ Lawn' : '—'} • {Math.round(confidence * 100)}% • {surfaceType}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
