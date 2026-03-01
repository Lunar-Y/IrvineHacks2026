import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface ScanningAnimationProps {
  status: 'scanning' | 'analyzing' | 'recommending';
  label?: string;
}

const LABELS: Record<string, string> = {
  scanning: 'Capturing lawn...',
  analyzing: 'Analyzing environment...',
  recommending: 'Finding your plants...',
};

export default function ScanningAnimation({ status, label = '' }: ScanningAnimationProps) {
  const text = label || LABELS[status] || 'Please wait...';

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
});
