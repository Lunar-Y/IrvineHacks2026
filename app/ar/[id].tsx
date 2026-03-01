import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { useScanStore } from '@/lib/store/scanStore';

export default function ARViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { currentScan } = useScanStore();
  const recommendations = currentScan.recommendations;
  const [permission, requestPermission] = useCameraPermissions();

  const parsedId = Number.parseInt(id ?? '0', 10);
  const safeIndex = Number.isFinite(parsedId) && parsedId >= 0 ? parsedId : 0;
  const selectedPlant = recommendations[safeIndex];
  const isExpoGo = Constants.appOwnership === 'expo';

  const label = selectedPlant
    ? `Placeholder: ${selectedPlant.common_name}`
    : `Placeholder payload #${safeIndex}`;

  useEffect(() => {
    if (isExpoGo) return; // Expo Go can't run native Viro modules
    router.replace(`/ar/native/${safeIndex}`);
  }, [isExpoGo, router, safeIndex]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#9ca3af" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.fallbackTitle}>Camera Permission Needed</Text>
        <Text style={styles.fallbackBody}>Allow camera access to continue the AR placeholder flow.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.scene} facing="back" />

      <View style={styles.topHint} pointerEvents="none">
        <Text style={styles.topHintText}>AR fallback active. Native 3D route unavailable in current runtime.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.cardBody}>Drag-drop succeeded. This is a safe placeholder view while Viro runtime is unavailable.</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scene: {
    flex: 1,
  },
  topHint: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 34 : 14,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  topHintText: {
    color: '#f9fafb',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 96,
    backgroundColor: 'rgba(17, 24, 39, 0.86)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
  },
  fallbackTitle: {
    color: '#fca5a5',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  fallbackBody: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
});
