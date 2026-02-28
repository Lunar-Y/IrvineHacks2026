import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useScanStore, PlantRecommendation } from '@/lib/store/scanStore';
import { buildDummyDeck } from '@/lib/recommendations/deckBuilder';

const STATUS_LABELS: Record<string, string> = {
  scanning: 'Capturing lawn...',
  analyzing: 'Analyzing environment...',
  recommending: 'Finding your plants...',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function stripDeckMetadata(plants: ReturnType<typeof buildDummyDeck>): PlantRecommendation[] {
  return plants.map(({ id, source, rank, ...plant }) => plant);
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const { currentScan, setScanStatus, setAssembledProfile, setRecommendations } = useScanStore();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setScanStatus('scanning');

      // 1. Capture Frame (base64)
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      if (!photo?.base64) throw new Error('Failed to capture frame');

      setScanStatus('analyzing');
      await delay(350);

      let coordinates = { lat: 33.6846, lng: -117.8265 };
      try {
        const location = await Location.getCurrentPositionAsync({});
        coordinates = { lat: location.coords.latitude, lng: location.coords.longitude };
      } catch (locationError) {
        console.warn('Location unavailable during dummy scan flow. Using Irvine fallback coordinates.', locationError);
      }

      /**
       * CURRENT DUMMY BEHAVIOR:
       * - The scan flow intentionally bypasses all network recommendation calls.
       * - We still keep realistic scan stages (`scanning -> analyzing -> recommending`)
       *   so motion/UI timing reflects the final production experience.
       *
       * FUTURE API WIRING STEPS:
       * FUTURE_INTEGRATION: Re-enable parallel calls to:
       * FUTURE_INTEGRATION:   1) supabase.functions.invoke('analyze-frame')
       * FUTURE_INTEGRATION:   2) supabase.functions.invoke('assemble-profile')
       * FUTURE_INTEGRATION: Merge those payloads into `assembledProfile` before requesting
       * FUTURE_INTEGRATION: `get-recommendations`.
       *
       * VALIDATION/BACKFILL EXPECTATIONS:
       * FUTURE_INTEGRATION: Validate API response shape before storing recommendations.
       * FUTURE_INTEGRATION: If API returns < 5 valid cards, backfill from fixtures.
       *
       * FAILURE HANDLING AND ANALYTICS HOOKS TO ADD LATER:
       * FUTURE_INTEGRATION: Emit metrics for API latency, malformed payload drops,
       * FUTURE_INTEGRATION: fallback usage, and end-to-end scan completion rates.
       */
      const assembledProfile = {
        coordinates,
        hardiness_zone: '9b',
        estimated_sun_exposure: 'full_sun',
        estimated_microclimate: 'Warm south-facing yard with partial wind shielding.',
        soil: { soil_texture: 'loamy', drainage: 'well' },
        source: 'dummy_scan_profile',
      };
      setAssembledProfile(assembledProfile);

      setScanStatus('recommending');
      await delay(450);
      const dummyDeck = buildDummyDeck(5);
      const plants = stripDeckMetadata(dummyDeck);

      setRecommendations(plants);
      setScanStatus('complete');

      router.push('/recommendations');
    } catch (error) {
      console.error('Scan failed:', error);
      setScanStatus('error');
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted || !locationPermission) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          LawnLens needs camera and location permissions to scan your yard.
        </Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
        <View style={{ height: 20 }} />
        <Button
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
          }}
          title="Grant Location Permission"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScan}
            disabled={
              currentScan.status === 'scanning' ||
              currentScan.status === 'analyzing' ||
              currentScan.status === 'recommending'
            }
          >
            <Text style={styles.text}>Scan Lawn</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {(['scanning', 'analyzing', 'recommending'] as const).includes(currentScan.status as any) && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.overlayText}>
            {STATUS_LABELS[currentScan.status] ?? 'Processing...'}
          </Text>
        </View>
      )}

      {currentScan.status === 'error' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Something went wrong. Try again.</Text>
          <TouchableOpacity
            style={[styles.scanButton, { marginTop: 20 }]}
            onPress={() => setScanStatus('idle')}
          >
            <Text style={styles.text}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  scanButton: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    marginTop: 10,
  }
});
