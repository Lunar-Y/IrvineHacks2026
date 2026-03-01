import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Button,
  ActivityIndicator,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useScanStore } from '@/lib/store/scanStore';
import { supabase } from '@/lib/api/supabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const SHEET_MIN_HEIGHT = 120;
const DRAG_HANDLE_HEIGHT = 44;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const { currentScan, setScanStatus, setRecommendations } = useScanStore();
  const cameraRef = useRef<CameraView>(null);

  // Draggable "Your Recommendations" sheet: translateY 0 = expanded, positive = pulled down (collapse)
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const sheetPosition = useRef(0);
  const dragStartY = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 4,
      onPanResponderGrant: () => {
        dragStartY.current = sheetPosition.current;
      },
      onPanResponderMove: (_, { dy }) => {
        const next = Math.max(0, Math.min(SHEET_MAX_HEIGHT - DRAG_HANDLE_HEIGHT, dragStartY.current + dy));
        sheetTranslateY.setValue(next);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const next = Math.max(0, Math.min(SHEET_MAX_HEIGHT - DRAG_HANDLE_HEIGHT, dragStartY.current + dy));
        sheetPosition.current = next;
        const collapseThreshold = (SHEET_MAX_HEIGHT - DRAG_HANDLE_HEIGHT) / 2;
        const shouldCollapse = next > collapseThreshold || vy > 0.3;
        const toValue = shouldCollapse ? SHEET_MAX_HEIGHT - DRAG_HANDLE_HEIGHT : 0;
        sheetPosition.current = toValue;
        Animated.spring(sheetTranslateY, {
          toValue,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

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

      // 1. Capture Frame (base64)
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5, // Lower quality for faster upload
      });

      if (!photo?.base64) throw new Error('Failed to capture frame');

      setScanStatus('analyzing');

      // 2. Get Location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 3. Trigger Supabase Edge Functions in parallel
      const [visionResponse, profileResponse] = await Promise.all([
        supabase.functions.invoke('analyze-frame', {
          body: { image: photo.base64 },
        }),
        supabase.functions.invoke('assemble-profile', {
          body: { lat: latitude, lng: longitude },
        })
      ]);

      if (visionResponse.error) throw visionResponse.error;
      if (profileResponse.error) throw profileResponse.error;

      const profile = profileResponse.data;
      const visionRaw = visionResponse.data;
      const vision = typeof visionRaw === 'string' ? (() => {
        try { return JSON.parse(visionRaw); } catch { return {}; }
      })() : visionRaw ?? {};

      const recResponse = await supabase.functions.invoke('get-recommendations', {
        body: {
          profile,
          vision,
          preferences: { purpose: 'general landscaping', maintenance_tolerance: 'medium' },
        },
      });

      if (recResponse.error) throw recResponse.error;
      const recs = Array.isArray(recResponse.data) ? recResponse.data : [];
      setRecommendations(recs);

      setScanStatus('complete');
    } catch (error) {
      console.error('Scan failed:', error);
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
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          LawnLens needs camera access to scan your yard.
        </Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
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
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    setLocationPermission(status === 'granted');
                  } catch (error) {
                    console.error('Error requesting location permissions:', error);
                    setLocationPermission(false); // Set a fallback state
                  }
                }}
              >
                <Text style={styles.locationButtonText}>Enable Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </CameraView>

      {(currentScan.status === 'scanning' || currentScan.status === 'analyzing') && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.overlayText}>
            {currentScan.status === 'scanning' ? 'Capturing Lawn...' : 'Analyzing Environment...'}
          </Text>
        </View>
      )}

      {currentScan.status === 'complete' && currentScan.recommendations.length > 0 && (
        <Animated.View
          style={[
            styles.recommendationsSheet,
            {
              height: SHEET_MAX_HEIGHT,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.sheetHandle} {...panResponder.panHandlers}>
            <View style={styles.sheetHandleBar} />
            <Text style={styles.sheetHandleTitle}>Your Recommendations</Text>
          </View>
          <ScrollView
            style={styles.sheetContent}
            contentContainerStyle={styles.sheetContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {currentScan.recommendations.map((rec, i) => (
              <View key={i} style={styles.recCard}>
                <Text style={styles.recCardTitle}>{rec.common_name}</Text>
                <Text style={styles.recCardScientific}>{rec.scientific_name}</Text>
                {rec.fit_score != null && (
                  <Text style={styles.recCardScore}>Fit: {rec.fit_score}/100</Text>
                )}
                <Text style={styles.recCardWhy} numberOfLines={2}>{rec.why_it_fits}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.scanButton, { marginTop: 16, marginBottom: 24 }]}
              onPress={() => setScanStatus('idle')}
            >
              <Text style={styles.text}>Scan Another Area</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      )}

      {currentScan.status === 'complete' && currentScan.recommendations.length === 0 && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Scan Complete! 🌱</Text>
          <TouchableOpacity
            style={[styles.scanButton, { marginTop: 20 }]}
            onPress={() => setScanStatus('idle')}
          >
            <Text style={styles.text}>Scan Another Area</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
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
    minWidth: '25%',
    maxWidth: 260,
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
  recommendationsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheetHandle: {
    height: DRAG_HANDLE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginBottom: 4,
  },
  sheetHandleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  recCard: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  recCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  recCardScientific: {
    fontSize: 13,
    color: '#444',
    marginTop: 2,
    fontStyle: 'italic',
  },
  recCardScore: {
    fontSize: 12,
    color: '#166534',
    marginTop: 4,
    fontWeight: '600',
  },
  recCardWhy: {
    fontSize: 13,
    color: '#333',
    marginTop: 6,
    lineHeight: 18,
  },
});
