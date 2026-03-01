import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';

interface ScanningAnimationProps {
  status: 'scanning' | 'analyzing' | 'recommending' | 'complete';
  label?: string;
}

const LABELS: Record<string, string> = {
  scanning: 'Capturing lawn...',
  analyzing: 'Analyzing environment...',
  recommending: 'Finding your plants...',
  complete: 'Analysis Complete! 🌱',
};

export default function ScanningAnimation({ status, label = '' }: ScanningAnimationProps) {
  const getMessage = () => label || LABELS[status] || '';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status !== 'complete' ? (
          <ActivityIndicator size="large" color="#2e7d32" />
        ) : (
          <Text style={styles.check}>✓</Text>
        )}
        <Text style={styles.message}>{getMessage()}</Text>

        {status === 'analyzing' && (
          <Text style={styles.subtext}>Fetching weather, soil, and sun data</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  card: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    elevation: 5,
  },
  message: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  check: {
    fontSize: 40,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});
