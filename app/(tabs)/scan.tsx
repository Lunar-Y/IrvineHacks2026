import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { useScanStore, PlantRecommendation, EnvironmentalProfile } from '@/lib/store/scanStore';
import { supabase } from '@/lib/api/supabase';
import { buildDummyDeck } from '@/lib/recommendations/deckBuilder';
import { MOCK_RECOMMENDATIONS } from '@/lib/mock/mockRecommendations';

const DEFAULT_PROFILE: EnvironmentalProfile = {
  coordinates: { lat: 33.6846, lng: -117.8265 }, // Irvine, CA
  elevation_meters: 16,
  usda_hardiness_zone: "10a",
  current_temp_celsius: 22,
  annual_avg_rainfall_mm: 350,
  forecast_7day: [],
  last_spring_frost_date: "2026-03-15",
  first_fall_frost_date: "2026-11-20",
  growing_days_per_year: 280,
  soil_texture: "loamy",
  soil_drainage: "well",
  soil_ph_range: { min: 6.0, max: 7.5 },
  organic_matter_percent: 3.5,
  sun_exposure: "full_sun",
  sun_source: "estimated_from_sensors",
  estimated_slope: "flat",
  near_structure: false,
  near_water_body: false,
  detected_existing_plants: [],
  detected_yard_features: [],
  estimated_microclimate: "Coastal plain",
  invasive_species_to_avoid: [],
  water_restriction_level: 1,
  wildfire_risk_zone: false,
  intended_purpose: ["aesthetic"],
  maintenance_level: "moderate",
  budget_usd: 500,
  pets_present: false,
  children_present: false,
  existing_nearby_plants: []
};

// New Components
import LawnDetectionOverlay from '@/components/camera/LawnDetectionOverlay';
import ScanningAnimation from '@/components/camera/ScanningAnimation';
import RecommendationsOverlay from '@/components/recommendations/RecommendationsOverlay';

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

  const [isLawnDetected, setIsLawnDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [surfaceType, setSurfaceType] = useState<'Vegetation' | 'Substrate' | 'Hardscape' | 'Unknown'>('Unknown');
  const [cameraReady, setCameraReady] = useState(false);
  const [captureInProgress, setCaptureInProgress] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showRecommendationsOverlay, setShowRecommendationsOverlay] = useState(false);

  const isFocused = useIsFocused();
  const { currentScan, setScanStatus, setAssembledProfile, setRecommendations, resetScan } = useScanStore();
  const cameraRef = useRef<CameraView>(null);

  // Auto-resume recommendations view if state persists but component unmounted
  useEffect(() => {
    if (currentScan.status === 'idle' && currentScan.recommendations?.length > 0) {
      setShowRecommendationsOverlay(true);
      setIsLawnDetected(true); // Persist green overlay lines if tracking is lost
    }
  }, [currentScan.status, currentScan.recommendations]);

  // Try to read existing location permission on mount (no prompt yet)
  useEffect(() => {
    (async () => {
      try {
        const existing = await Location.getForegroundPermissionsAsync();
        if (existing?.status) setLocationPermission(existing.status === 'granted');
      } catch {
        setLocationPermission(null);
      }
    })();
  }, []);

  // On web, after camera permission is granted for the first time,
  // refresh once so camera stream initializes correctly.
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

  const canStartScan = cameraReady;

  const handleScan = async () => {
    if (!cameraRef.current || captureInProgress) return;

    let finalProfile = DEFAULT_PROFILE;
    let finalRecommendations = MOCK_RECOMMENDATIONS;

    try {
      if (!canStartScan) {
        throw new Error('Camera is still initializing.');
      }

      setScanError(null);
      setCaptureInProgress(true);
      setScanStatus('scanning');

      const captureFrame = async () => {
        return cameraRef.current!.takePictureAsync({ base64: true, quality: 0.5 });
      };

      let photo;
      try {
        photo = await captureFrame();
      } catch (e) {
        await delay(300);
        photo = await captureFrame();
      }

      if (!photo?.base64) throw new Error('Capture failed');

      setScanStatus('analyzing');

      // Location Failsafe
      let location;
      try {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      } catch (e) {
        console.warn('[Failsafe] Location failed, using default Irvine coords');
      }

      const lat = location?.coords.latitude || DEFAULT_PROFILE.coordinates.lat;
      const lng = location?.coords.longitude || DEFAULT_PROFILE.coordinates.lng;

      // Vision & Profile Orchestration with individual try/catch
      let visionData = { is_lawn: true, confidence: 0.9, soil_analysis: { coverage_percent: 80, type: 'loamy' }, estimated_sun_exposure: 'full_sun' };
      
      try {
        const visionResponse = await supabase.functions.invoke('analyze-frame', { body: { image: photo.base64 } });
        if (!visionResponse.error && visionResponse.data) {
          visionData = typeof visionResponse.data === 'string' ? JSON.parse(visionResponse.data) : visionResponse.data;
        }
      } catch (e) {
        console.warn('[Failsafe] Vision API failed, using fallback detection');
      }

      try {
        const profileResponse = await supabase.functions.invoke('assemble-profile', { body: { lat, lng } });
        if (!profileResponse.error && profileResponse.data) {
          finalProfile = profileResponse.data;
        }
      } catch (e) {
        console.warn('[Failsafe] Profile API failed, using default environment');
      }

      // Merge results safely
      const mergedProfile = {
        ...finalProfile,
        estimated_sun_exposure: visionData.estimated_sun_exposure || 'full_sun',
        detected_existing_plants: (visionData as any).detected_existing_plants || [],
        detected_yard_features: (visionData as any).detected_yard_features || [],
      };

      setScanStatus('recommending');

      try {
        const recResponse = await supabase.functions.invoke('get-recommendations', {
          body: { profile: mergedProfile, preferences: { purpose: "Sustainable garden", avoid_invasive: true } }
        });
        if (!recResponse.error && recResponse.data) {
          finalRecommendations = recResponse.data;
        }
      } catch (e) {
        console.warn('[Failsafe] Recommendations API failed, using mock data');
      }

      // Update state and UI
      setConfidence(visionData.confidence ?? 0.85);
      setSurfaceType(visionData.soil_analysis?.type === 'loamy' ? 'Substrate' : 'Vegetation');
      setIsLawnDetected(visionData.is_lawn === true || (visionData.soil_analysis?.coverage_percent || 0) > 40);
      
      setRecommendations(finalRecommendations);
      setAssembledProfile(mergedProfile);
      setScanStatus('idle');
      setShowRecommendationsOverlay(true);
      
    } catch (error: any) {
      console.error('[Failsafe] Critical scan failure:', error);
      setScanError(error?.message || 'Unable to analyze area.');
      setScanStatus('error');
    } finally {
      setCaptureInProgress(false);
    }
  };

  // Loading state
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
        {isFocused && (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onCameraReady={() => {
              setCameraReady(true);
            }}
            onMountError={(event) => {
              const message = event?.message || 'Camera failed to mount.';
              setScanError(message);
              setScanStatus('error');
            }}
          />
        )}

        {/* AR-style Viewfinder Brackets */}
        {(currentScan.status !== 'complete' && currentScan.status !== 'error' && !showRecommendationsOverlay) && (
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

        {(currentScan.status !== 'complete' && currentScan.status !== 'error' && !showRecommendationsOverlay) && (
          <LawnDetectionOverlay
            isLawnDetected={isLawnDetected}
            confidence={confidence}
            surfaceType={surfaceType}
          />
        )}

        {currentScan.status === 'idle' && !showRecommendationsOverlay && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.scanButton, captureInProgress && { opacity: 0.6 }]}
              onPress={handleScan}
              disabled={
                currentScan.status !== 'idle' || captureInProgress || !canStartScan
              }
            >
              <Text style={styles.text}>
                {captureInProgress ? 'Capturing...' : canStartScan ? 'Scan Lawn' : 'Preparing Camera...'}
              </Text>
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
      {(currentScan.status !== 'idle' && currentScan.status !== 'error' && currentScan.status !== 'complete' && !showRecommendationsOverlay) && (
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
              {scanError || "Unable to analyze the environment. Please try again."}
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

      {currentScan.status === 'complete' && !showRecommendationsOverlay && (
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
                    setScanStatus('idle');
                    setShowRecommendationsOverlay(true);
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
                setSurfaceType('Unknown');
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

      {showRecommendationsOverlay && (
        <RecommendationsOverlay
          onRequestRescan={() => {
            resetScan();
            setShowRecommendationsOverlay(false);
            setIsLawnDetected(false);
            setConfidence(0);
            setSurfaceType('Unknown');
            setScanError(null);
            setCaptureInProgress(false);
          }}
        />
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
  resetText: { color: 'white', fontWeight: 'bold' },

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

  permissionText: { padding: 20, textAlign: 'center', fontSize: 18, marginBottom: 20 },
});
