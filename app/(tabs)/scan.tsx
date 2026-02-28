import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useScanStore } from '@/lib/store/scanStore';
import { supabase } from '@/lib/api/supabase';

// New Components
import LawnDetectionOverlay from '@/components/camera/LawnDetectionOverlay';
import ScanningAnimation from '@/components/camera/ScanningAnimation';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isLawnDetected, setIsLawnDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [surfaceType, setSurfaceType] = useState<'Vegetation' | 'Substrate' | 'Hardscape' | 'Unknown'>('Unknown');
  const { currentScan, setScanStatus } = useScanStore();
  const cameraRef = useRef<CameraView>(null);

  // On web, after the user grants camera permission for the first time,
  // automatically refresh the page ONCE so that the camera stream can be
  // initialized correctly. We persist a flag in localStorage so this does
  // not keep happening on every subsequent load.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!permission?.granted) return;
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

    const FLAG_KEY = 'lawnlens_camera_refresh_done';
    const alreadyDone = window.localStorage.getItem(FLAG_KEY);
    if (alreadyDone) return;

    window.localStorage.setItem(FLAG_KEY, 'true');
    window.location.reload();
  }, [permission?.granted]);

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setScanStatus('scanning');
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      if (!photo?.base64) throw new Error('Failed to capture frame');

      setScanStatus('analyzing');
      const location = await Location.getCurrentPositionAsync({});

      const [visionResponse, profileResponse] = await Promise.all([
        supabase.functions.invoke('analyze-frame', { body: { image: photo.base64 } }),
        supabase.functions.invoke('assemble-profile', { body: { lat: location.coords.latitude, lng: location.coords.longitude } })
      ]);

      if (visionResponse.error) throw new Error(`Vision API: ${visionResponse.error.message}`);
      if (profileResponse.error) throw new Error(`Profile API: ${profileResponse.error.message}`);

      // Parse AI Vision Result
      let visionData;
      try {
        visionData = typeof visionResponse.data === 'string'
          ? JSON.parse(visionResponse.data)
          : visionResponse.data;
      } catch (e) {
        throw new Error('Vision API: Invalid JSON response');
      }

      const coverage = visionData.soil_analysis?.coverage_percent || 0;
      const aiConfidence = visionData.confidence || 0.85;
      const isValidLawn = visionData.is_lawn === true || coverage > 40;

      setConfidence(aiConfidence);
      setSurfaceType(visionData.soil_analysis?.type === 'loamy' ? 'Substrate' : 'Vegetation');
      setIsLawnDetected(isValidLawn);
      setScanStatus('complete');
    } catch (error: any) {
      console.error('Scan failed:', error);
      useScanStore.getState().setScanImage(error.message || 'Unknown API Error');
      setScanStatus('error');
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="gray" />
      </View>
    );
  }

  // If camera permission is denied, explain why we need it and
  // give the user a way to re-trigger the permission prompt.
  if (!permission.granted || !locationPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>LawnLens needs permissions to scan your yard.</Text>
        <Button onPress={requestPermission} title="Grant Permissions" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          {/* Green guide ring to help users aim at their lawn */}
          <View style={styles.guideRing} />
        </CameraView>

        <LawnDetectionOverlay
          isLawnDetected={isLawnDetected}
          confidence={confidence}
          surfaceType={surfaceType}
        />

        {currentScan.status === 'idle' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScan}
              disabled={
                currentScan.status === 'scanning' ||
                currentScan.status === 'analyzing'
              }
            >
              <Text style={styles.text}>Scan Lawn</Text>
            </TouchableOpacity>

            {locationPermission === false && (
              <View style={styles.locationPrompt}>
                <Text style={styles.locationText}>
                  Enable location so we can tailor recommendations to your area.
                </Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={async () => {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    setLocationPermission(status === 'granted');
                  }}
                >
                  <Text style={styles.locationButtonText}>Enable Location</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {(currentScan.status === 'scanning' || currentScan.status === 'analyzing') && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ScanningAnimation status={currentScan.status as any} />
        </View>
      )}

      {currentScan.status === 'error' && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>Scan Failed</Text>
          <Text style={styles.errorSubtext}>{currentScan.imageUri}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setScanStatus('idle')}>
            <Text style={styles.resetText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentScan.status === 'complete' && (
        <View style={styles.completeOverlay}>
          <View style={styles.successCard}>
            {isLawnDetected ? (
              <>
                <Text style={styles.successTitle}>Lawn Detected! 🌱</Text>
                <Text style={styles.successSubtext}>
                  We found a perfect spot for your new garden.
                </Text>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // In a real app, this would navigate to the recommendations screen
                    console.log("Navigating to Recommendations...");
                  }}
                >
                  <Text style={styles.actionText}>View Recommendations</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.notLawnTitle}>No Lawn Detected 🛑</Text>
                <Text style={styles.successSubtext}>
                  This area doesn't look like a plantable space.
                </Text>
              </>
            )}

            <TouchableOpacity
              onPress={() => {
                setScanStatus('idle');
                setIsLawnDetected(false);
                setConfidence(0);
              }}
              style={isLawnDetected ? { marginTop: 10 } : styles.actionButton}
            >
              <Text style={isLawnDetected ? styles.secondaryText : styles.actionText}>
                {isLawnDetected ? "Scan Another Area" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  guideRing: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'rgba(34,197,94,0.9)', // tailwind green-500-ish
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',

  },
  scanButton: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '50%',
    maxWidth: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 18,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#4CAF50',
    elevation: 5,
  },
  text: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    marginTop: 10,
  },
  locationPrompt: {
    marginTop: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  locationText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  locationButtonText: {
    color: 'black',
    fontWeight: '600',
  },
  errorEmoji: { fontSize: 50, marginBottom: 10 },
  errorText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  errorSubtext: { color: '#ccc', textAlign: 'center', marginTop: 10 },
  retryButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 100,
  },
  successCard: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1b5e20' },
  notLawnTitle: { fontSize: 24, fontWeight: 'bold', color: '#d32f2f' },
  successSubtext: { fontSize: 16, color: '#666', marginTop: 5, marginBottom: 20 },
  actionButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
  },
  actionText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  secondaryText: { color: '#666', fontWeight: 'bold', fontSize: 14 },
  resetText: { color: 'white', fontWeight: 'bold' },
  permissionText: { padding: 20, textAlign: 'center', fontSize: 18, marginBottom: 20 },
});
