import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { buildDummyDeck } from '@/lib/recommendations/deckBuilder';
import { PlantRecommendation, useScanStore } from '@/lib/store/scanStore';

function stripDeckMetadata(plants: ReturnType<typeof buildDummyDeck>): PlantRecommendation[] {
  return plants.map(({ id, source, rank, ...plant }) => plant);
}

export default function ScanARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const { recommendations, setRecommendations } = useScanStore();

  useEffect(() => {
    if (recommendations.length > 0) return;
    const seededDeck = buildDummyDeck(6);
    setRecommendations(stripDeckMetadata(seededDeck));
  }, [recommendations.length, setRecommendations]);

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#9ca3af" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, styles.permissionBackground]}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionText}>Allow camera access to preview placement in your environment.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" />

      <View style={styles.topHint} pointerEvents="none">
        <Text style={styles.topHintText}>Open recommendations and drag cards upward into AR</Text>
      </View>

      <View style={styles.bottomPanel}>
        <TouchableOpacity style={styles.openButton} onPress={() => router.push('/recommendations')}>
          <Text style={styles.openButtonText}>Open Recommendations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.openButton, { marginTop: 12, backgroundColor: '#10b981', borderColor: '#10b981' }]}
          onPress={() => router.push('/ar-demo')}
        >
          <Text style={styles.openButtonText}>Go to AR (Tree Demo)</Text>
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
  },
  camera: {
    flex: 1,
  },
  permissionBackground: {
    backgroundColor: '#111827',
  },
  permissionCard: {
    width: '86%',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  permissionText: {
    color: '#e5e7eb',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 14,
  },
  permissionButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  topHint: {
    position: 'absolute',
    top: 14,
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
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
  },
  openButton: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  openButtonText: {
    color: '#ecfdf5',
    fontSize: 13,
    fontWeight: '700',
  },
});
