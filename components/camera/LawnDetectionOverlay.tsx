import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface LawnDetectionOverlayProps {
  isLawnDetected: boolean;
  confidence: number;
  surfaceType: 'Vegetation' | 'Substrate' | 'Hardscape' | 'Unknown';
}

export default function LawnDetectionOverlay({ isLawnDetected, confidence, surfaceType }: LawnDetectionOverlayProps) {
  // In a production app, this would use the segmentation mask from ML Kit
  // For the prototype, we show a "Focus Ring" that turns green when the lawn is detected
  return (
    <View style={styles.container}>
      <View style={[
        styles.focusRing, 
        { borderColor: isLawnDetected ? '#4CAF50' : 'rgba(255,255,255,0.5)' }
      ]}>
        {!isLawnDetected && (
          <Text style={styles.hint}>Point at your lawn or soil area</Text>
        )}
      </View>
      
      {isLawnDetected && (
        <View style={styles.confidenceBadge}>
          <Text style={styles.typeText}>
            {surfaceType === 'Vegetation' ? 'Lawn (Vegetation)' : 'Lawn (Substrate)'}
          </Text>
          <Text style={styles.confidenceText}>
            Healthy Area Detected: {Math.round(confidence * 100)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRing: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderRadius: 140,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  typeText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
  }
});
