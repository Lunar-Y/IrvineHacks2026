import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useScanStore, PlantRecommendation } from '@/lib/store/scanStore';
import { supabase } from '@/lib/api/supabase';
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

// New Components
import LawnDetectionOverlay from '@/components/camera/LawnDetectionOverlay';
import ScanningAnimation from '@/components/camera/ScanningAnimation';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isLawnDetected, setIsLawnDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [surfaceType, setSurfaceType] = useState<'Vegetation' | 'Substrate' | 'Hardscape' | 'Unknown'>('Unknown');
  const { currentScan, setScanStatus, setAssembledProfile, setRecommendations } = useScanStore();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

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

      // Fallback logic from Jay branch: if valid lawn, generate dummy deck for UI flow testing
      if (isValidLawn) {
        setScanStatus('recommending');
        await delay(450);
        const dummyDeck = buildDummyDeck(5);
        const plants = stripDeckMetadata(dummyDeck);
        setRecommendations(plants);

        // Simulate assembled profile
        setAssembledProfile({
          coordinates: { lat: location.coords.latitude, lng: location.coords.longitude },
          hardiness_zone: '9b',
          estimated_sun_exposure: 'full_sun',
          estimated_microclimate: 'Warm south-facing yard with partial wind shielding.',
          soil: { soil_texture: 'loamy', drainage: 'well' },
          source: 'dummy_scan_profile',
        });

        // Do not automatically navigate; the user must press the "View Recommendations" button from the success overlay.
      }
      setScanStatus('complete');
    } catch (error: any) {
      console.error('Scan failed:', error);
      useScanStore.getState().setScanImage(error.message || 'Unknown API Error');
      setScanStatus('error');
    }
  };

  // 1. Handle the loading state first to prevent "null" errors
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // 2. Consolidate logic into a single sequential requester
  const handleRequestPermissions = async () => {
    const cameraResult = await requestPermission();
    if (cameraResult.granted) {
      const locationResult = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationResult.status === 'granted');
    }
  };

  // 3. Use optional chaining (?.) to safely check granted status
  if (permission.granted !== true || locationPermission !== true) {
    return (
      <View style={[styles.container, { backgroundColor: '#0F1412', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <View style={{ backgroundColor: '#18201D', padding: 24, borderRadius: 16, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
          <Text style={styles.errorEmoji}>🌱</Text>
          <Text style={[styles.successTitle, { color: '#F5F7F6', fontSize: 18, fontFamily: 'Inter', fontWeight: '600', marginBottom: 8 }]}>Permissions Required</Text>
          <Text style={[styles.successSubtext, { color: '#9FAFAA', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', marginBottom: 24 }]}>
            LawnLens needs camera and location access to accurately identify the best plants for your yard's unique environment.
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2F6B4F', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center' }]}
            onPress={handleRequestPermissions}
          >
            <Text style={[styles.actionText, { color: '#F5F7F6', fontSize: 16, fontFamily: 'Inter', fontWeight: '600' }]}>
              {!permission.granted ? "Enable Camera & Location" : "Enable Location"}
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 24, width: '100%', paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#F5F7F6', fontSize: 14, fontFamily: 'Inter' }}>Camera Access</Text>
              <Text style={{ color: permission.granted ? '#2F6B4F' : '#B24A3A', fontWeight: '600' }}>
                {permission.granted ? 'Granted' : 'Required'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#F5F7F6', fontSize: 14, fontFamily: 'Inter' }}>Location Services</Text>
              <Text style={{ color: locationPermission === true ? '#2F6B4F' : '#B24A3A', fontWeight: '600' }}>
                {locationPermission === true ? 'Granted' : 'Required'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // If camera permission is denied or location is not explicitly granted
  // (We don't want to block entirely on location, but let's prompt them)
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: '#0F1412' }]}>
        <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#18201D', borderRadius: 16, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
          <Text style={{ textAlign: 'center', marginBottom: 24, color: '#F5F7F6', fontSize: 16, fontFamily: 'Inter', fontWeight: '500' }}>
            LawnLens requires camera access to scan your yard and recommend suitable plants.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2F6B4F', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999, width: '100%', alignItems: 'center' }}
            onPress={requestPermission}
          >
            <Text style={{ color: '#F5F7F6', fontWeight: '600', fontSize: 16, fontFamily: 'Inter' }}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        {/* AR-style Viewfinder Brackets */}
        {(currentScan.status !== 'complete' && currentScan.status !== 'error') && (
          <View style={styles.viewfinderContainer} pointerEvents="none">
            <View style={styles.viewfinderBox}>
              <View style={[styles.bracket, styles.bracketTopLeft, { borderColor: isLawnDetected ? '#2F6B4F' : 'rgba(255, 255, 255, 0.5)' }]} />
              <View style={[styles.bracket, styles.bracketTopRight, { borderColor: isLawnDetected ? '#2F6B4F' : 'rgba(255, 255, 255, 0.5)' }]} />
              <View style={[styles.bracket, styles.bracketBottomLeft, { borderColor: isLawnDetected ? '#2F6B4F' : 'rgba(255, 255, 255, 0.5)' }]} />
              <View style={[styles.bracket, styles.bracketBottomRight, { borderColor: isLawnDetected ? '#2F6B4F' : 'rgba(255, 255, 255, 0.5)' }]} />
            </View>
          </View>
        )}

        {/* Gradient Mask for Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(15, 20, 18, 0.8)', '#0F1412']}
          locations={[0, 0.5, 1]}
          style={styles.gradientMask}
          pointerEvents="none"
        />

        {(currentScan.status !== 'complete' && currentScan.status !== 'error') && (
          <LawnDetectionOverlay
            isLawnDetected={isLawnDetected}
            confidence={confidence}
            surfaceType={surfaceType}
          />
        )}

        {currentScan.status === 'idle' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScan}
              disabled={
                currentScan.status !== 'idle'
              }
            >
              <Text style={styles.text}>Scan Lawn</Text>
            </TouchableOpacity>

            {!locationPermission && (
              <View style={styles.locationPrompt}>
                <Text style={styles.locationText}>
                  Enable location so we can tailor recommendations to your area.
                </Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={async () => {
                    const locationResult = await Location.requestForegroundPermissionsAsync();
                    setLocationPermission(locationResult.status === 'granted');
                  }}
                >
                  <Text style={styles.locationButtonText}>Enable Location</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Status Text positioned inside the gradient above the button */}
      {(currentScan.status !== 'idle' && currentScan.status !== 'error' && currentScan.status !== 'complete') && (
        <View style={styles.statusTextContainer} pointerEvents="none">
          <ActivityIndicator size="small" color="#F5F7F6" style={{ marginRight: 8 }} />
          <Text style={styles.statusText}>{STATUS_LABELS[currentScan.status as keyof typeof STATUS_LABELS]}</Text>
        </View>
      )}

      {currentScan.status === 'error' && (
        <View style={styles.errorOverlay}>
          <View style={{ backgroundColor: '#18201D', padding: 32, borderRadius: 16, width: '85%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12 }}>
            <Text style={[styles.errorEmoji, { marginBottom: 16 }]}>⚠️</Text>
            <Text style={[styles.errorText, { color: '#B24A3A', fontSize: 20, fontFamily: 'Inter', fontWeight: '600', marginBottom: 8 }]}>Scan Failed</Text>
            <Text style={[styles.errorSubtext, { color: '#9FAFAA', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', marginBottom: 24 }]}>
              {currentScan.imageUri || "Unable to analyze the environment. Please try again."}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: '#2F6B4F', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' }]}
              onPress={() => setScanStatus('idle')}
            >
              <Text style={[styles.resetText, { color: '#F5F7F6', fontSize: 16, fontFamily: 'Inter', fontWeight: '600' }]}>Scan Another Area</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentScan.status === 'complete' && (
        <View style={styles.completeOverlay}>
          <View style={[styles.successCard, { backgroundColor: '#18201D', padding: 32, borderRadius: 16, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 12 }]}>
            {isLawnDetected ? (
              <>
                <Text style={[styles.successTitle, { color: '#F5F7F6', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold' }]}>Lawn Detected! 🌱</Text>
                <Text style={[styles.successSubtext, { color: '#9FAFAA', fontSize: 14, fontFamily: 'Inter', marginTop: 8, marginBottom: 24, textAlign: 'center' }]}>
                  We found a perfect spot for your new garden.
                </Text>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2F6B4F', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 12 }]}
                  onPress={() => {
                    router.push('/recommendations');
                  }}
                >
                  <Text style={[styles.actionText, { color: '#F5F7F6', fontSize: 16, fontFamily: 'Inter', fontWeight: '600' }]}>View Recommendations</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.notLawnTitle, { color: '#B24A3A', fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold' }]}>No Lawn Detected 🛑</Text>
                <Text style={[styles.successSubtext, { color: '#9FAFAA', fontSize: 14, fontFamily: 'Inter', marginTop: 8, marginBottom: 24, textAlign: 'center' }]}>
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
              style={[{ borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
              isLawnDetected ? { backgroundColor: 'transparent' } : { backgroundColor: '#18201D', borderWidth: 2, borderColor: '#9FAFAA' }]}
            >
              <Text style={[{ fontSize: 16, fontFamily: 'Inter', fontWeight: '600' },
              isLawnDetected ? { color: '#9FAFAA' } : { color: '#F5F7F6' }]}>
                Scan Another Area
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
  viewfinderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60, // Shift up slightly to balance with the bottom gradient
  },
  viewfinderBox: {
    width: '70%',
    aspectRatio: 1,
    position: 'relative',
  },
  bracket: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 16,
  },
  gradientMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%', // Covers the bottom 40% of the screen
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  scanButton: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#2F6B4F',
    paddingVertical: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#F5F7F6'
  },
  statusTextContainer: {
    position: 'absolute',
    bottom: 120, // Positioned comfortably above the button container
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  statusText: {
    color: '#F5F7F6',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 20, 18, 0.6)', // 0F1412 base with opacity instead of pure black
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  overlayText: {
    color: '#F5F7F6',
    fontSize: 20,
    marginTop: 10,
  },
  locationPrompt: {
    marginTop: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  locationText: {
    color: '#F5F7F6',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#18201D',
  },
  locationButtonText: {
    color: '#B7D3C0',
    fontFamily: 'Inter',
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
    backgroundColor: 'rgba(15, 20, 18, 0.6)',
    justifyContent: 'center', // Changed from flex-end
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  successCard: {
    alignItems: 'center',
  },
  successTitle: {}, // Styles moved inline
  notLawnTitle: {}, // Styles moved inline
  successSubtext: {}, // Styles moved inline
  actionButton: {}, // Styles moved inline
  actionText: {}, // Styles moved inline
  secondaryText: {}, // Styles moved inline
  resetText: { color: 'white', fontWeight: 'bold' },
  permissionText: { padding: 20, textAlign: 'center', fontSize: 18, marginBottom: 20 },
});
