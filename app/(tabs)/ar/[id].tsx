import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useScanStore } from '@/lib/store/scanStore';
import { getModelForArchetype } from '@/lib/ar/modelMapping';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import RecommendationsOverlay from '@/components/recommendations/RecommendationsOverlay';

let viro: any = null;
try { viro = require('@reactvision/react-viro'); } catch { }

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Physical & Math Constants ───────────────────────────────────────
const PHONE_HEIGHT = 1.65; // ~5'5" view height
const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 20.0;
const MIN_PITCH_DEG = 5;

// ── Ground-hit trig Math ────────────────────────────────────────────
function computeGroundHit(
  pos: number[],
  forward: number[]
): { position: [number, number, number]; distance: number; valid: boolean } {
  const [fx, fy, fz] = forward;

  const rawPitchRad = Math.asin(Math.max(0, -fy));
  let pitchDeg = rawPitchRad * (180 / Math.PI);

  if (pitchDeg < MIN_PITCH_DEG) {
    return { position: [0, 0, 0], distance: 0, valid: false };
  }

  const adjustedPitchRad = pitchDeg * (Math.PI / 180);
  let d = PHONE_HEIGHT / Math.tan(adjustedPitchRad);
  d = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, d));

  const horizLen = Math.sqrt(fx * fx + fz * fz);
  const dirX = horizLen > 0.001 ? fx / horizLen : 0;
  const dirZ = horizLen > 0.001 ? fz / horizLen : -1;

  return {
    position: [
      pos[0] + dirX * d,
      pos[1] - PHONE_HEIGHT,
      pos[2] + dirZ * d,
    ],
    distance: d,
    valid: true,
  };
}

// ─────────────────────────────────────────────────────────────────────
// IN-ROOM AR SCENE
// ─────────────────────────────────────────────────────────────────────
function SinglePlantScene({ arSceneNavigator }: { arSceneNavigator?: any }) {
  if (!viro) return null;
  const {
    ViroARScene,
    ViroAmbientLight,
    ViroDirectionalLight,
    ViroNode,
    Viro3DObject,
    ViroTrackingStateConstants: ViroConstants,
  } = viro;

  const sceneRef = useRef<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const { placedItems, addPlacedItem } = useScanStore();
  const [previewPos, setPreviewPos] = useState<[number, number, number] | null>(null);
  const [previewValid, setPreviewValid] = useState(false);

  const _onTrackingUpdated = (state: any) => {
    const tracking = state === ViroConstants.TRACKING_NORMAL;
    setIsTracking(tracking);
    if (arSceneNavigator?.viroAppProps?._onTrackingReady) {
      arSceneNavigator.viroAppProps._onTrackingReady(tracking);
    }
  };

  const _onCameraTransformUpdate = useCallback((cameraTransform: any) => {
    if (!isTracking) return;
    const hit = computeGroundHit(cameraTransform.position, cameraTransform.forward);
    if (hit.valid) {
      setPreviewPos(hit.position as [number, number, number]);
      setPreviewValid(true);
    } else {
      setPreviewValid(false);
    }
  }, [isTracking]);

  const handlePlace = () => {
    if (!previewValid || !previewPos) {
      arSceneNavigator?.viroAppProps?.onAimTooHigh?.();
      return;
    }

    const archetype = arSceneNavigator?.viroAppProps?.selectedArchetype ?? 'tree';
    const scanState = useScanStore.getState();
    const activeIndex = scanState.activeRecommendationIndex;
    const activeRecommendation = scanState.getActiveRecommendation();
    if (activeRecommendation === null || activeIndex === null) {
      arSceneNavigator?.viroAppProps?.onSelectionMissing?.();
      return;
    }

    addPlacedItem({
      id: Date.now(),
      pos: [...previewPos] as [number, number, number],
      archetype,
      plantIndex: activeIndex,
      speciesScientificName: activeRecommendation.scientific_name,
      speciesCommonName: activeRecommendation.common_name,
      imageUrl: activeRecommendation.image_url,
      waterRequirement: activeRecommendation.water_requirement,
      matureHeightMeters: activeRecommendation.mature_height_meters,
      isToxicToPets: activeRecommendation.is_toxic_to_pets,
    });
    arSceneNavigator?.viroAppProps?.onPlaced?.();
  };

  useEffect(() => {
    arSceneNavigator?.viroAppProps?.setPlaceFn?.(() => handlePlace);
    if (arSceneNavigator?.viroAppProps?.onPreviewValid) {
      arSceneNavigator.viroAppProps.onPreviewValid(previewValid && previewPos !== null);
    }
  }, [isTracking, previewPos, previewValid, arSceneNavigator?.viroAppProps?.selectedArchetype]);

  // Get current preview model from parent
  const previewArchetype = arSceneNavigator?.viroAppProps?.selectedArchetype ?? 'tree';
  const previewModel = getModelForArchetype(previewArchetype);

  return (
    <ViroARScene
      ref={sceneRef}
      onTrackingUpdated={_onTrackingUpdated}
      onCameraTransformUpdate={_onCameraTransformUpdate}
    >
      <ViroAmbientLight color="#ffffff" intensity={300} />
      <ViroDirectionalLight color="#ffffff" direction={[0, -1, -0.2]} intensity={800} />

      {/* LIVE PREVIEW — ghost of currently selected model */}
      {(previewValid && previewPos && !arSceneNavigator?.viroAppProps?.showDeck) && (
        <ViroNode position={previewPos} opacity={0.5}>
          <Viro3DObject
            source={previewModel.source}
            scale={previewModel.scale}
            type="GLB"
          />
        </ViroNode>
      )}

      {/* PLACED ITEMS */}
      {placedItems.map(item => {
        const itemModel = getModelForArchetype(item.archetype);
        return (
          <ViroNode key={item.id} position={item.pos}>
            <Viro3DObject
              source={itemModel.source}
              position={[0, 0, 0]}
              scale={itemModel.scale}
              type="GLB"
              onError={(e: any) => console.log('3D Object Load Error:', e)}
            />
          </ViroNode>
        );
      })}
    </ViroARScene>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SCREEN WRAPPER
// ─────────────────────────────────────────────────────────────────────
export default function ARNativeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();

  const {
    currentScan,
    resetScan,
    clearPlacedPlants,
    placedPlantCounts,
    setActiveRecommendationIndex,
  } = useScanStore();
  const recommendations = Array.isArray(currentScan.recommendations) ? currentScan.recommendations : [];
  const parsedId = Number.parseInt(id ?? '', 10);
  const initialPlantIndex =
    Number.isInteger(parsedId) && parsedId >= 0 && parsedId < recommendations.length ? parsedId : 0;

  // Track the active plant in local state so swapping plants never causes navigation
  const [activePlantIndex, setActivePlantIndex] = useState(initialPlantIndex);
  const activePlant = recommendations[activePlantIndex];
  const selectedArchetype = activePlant?.model_archetype || 'tree';

  const isFocused = useIsFocused();
  const [mountViro, setMountViro] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [canPlace, setCanPlace] = useState(false);
  const totalPlacedCount = Object.values(placedPlantCounts).reduce((acc, c) => acc + c, 0);
  const [hint, setHint] = useState<string | null>(null);

  const [showDeck, setShowDeck] = useState(false);

  const [placeFn, setPlaceFn] = useState<(() => void) | null>(null);

  const handleScanAnotherArea = useCallback(() => {
    resetScan();
    clearPlacedPlants();
    router.navigate('/(tabs)/scan');
  }, [clearPlacedPlants, resetScan, router]);

  if (!viro) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.fallbackTitle}>AR Unavailable</Text>
        <Text style={styles.fallbackBody}>Viro AR modules not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { ViroARSceneNavigator } = viro;

  const showAimTooHigh = () => {
    setHint('📐 Aim lower to target the ground');
    setTimeout(() => setHint(null), 2000);
  };

  const onPlaced = () => {
    setHint('🌱 Placed!');
    setTimeout(() => setHint(null), 1500);
  };
  const onSelectionMissing = () => {
    setHint('Select a plant first');
    setTimeout(() => setHint(null), 1500);
  };

  // Mount Viro ONCE when the screen first becomes focused. Never unmount it—
  // tearing down the scene resets spatial tracking and causes coordinate drift.
  useEffect(() => {
    if (!isFocused || mountViro) return; // already mounted, or not focused yet
    const t = setTimeout(() => setMountViro(true), 300);
    return () => clearTimeout(t);
  }, [isFocused]);

  useEffect(() => {
    setActiveRecommendationIndex(initialPlantIndex);
  }, [initialPlantIndex, setActiveRecommendationIndex]);

  return (
    <View style={styles.container}>
      {mountViro ? (
        <ViroARSceneNavigator
          autofocus
          initialScene={{ scene: SinglePlantScene }}
          viroAppProps={{
            setPlaceFn,
            onAimTooHigh: showAimTooHigh,
            onPlaced,
            onSelectionMissing,
            selectedArchetype,
            showDeck,
            _onTrackingReady: setIsReady,
            onPreviewValid: setCanPlace,
          }}
          style={styles.scene}
        />
      ) : (
        <View style={styles.scene} />
      )}

      <TouchableOpacity
        accessibilityLabel="Reset scan"
        accessibilityHint="Returns to scan lawn screen"
        hitSlop={10}
        onPress={handleScanAnotherArea}
        style={[styles.scanAnotherFixedButton, { top: Math.max(insets.top, 14) }]}
      >
        <FontAwesome name="undo" size={16} color="#F5F7F6" />
      </TouchableOpacity>

      {/* ── Top Bar ── */}
      {!showDeck && (
        <View style={[styles.topBar, { top: Math.max(insets.top, 14) }]} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => setShowDeck(true)}
            style={styles.backButton}
          >
            <FontAwesome name="chevron-left" size={14} color="#F5F7F6" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showDeck && totalPlacedCount > 0 ? (
        <View style={[styles.statusPillFloating, { top: Math.max(insets.top, 14) }]} pointerEvents="none">
          <Text style={styles.statusText}>{`${totalPlacedCount} placed`}</Text>
        </View>
      ) : null}

      {/* ── Hint HUD ── */}
      {!showDeck && (
        <View style={styles.centerHud} pointerEvents="none">
          {hint ? (
            <Text style={styles.centerHudText}>{hint}</Text>
          ) : (
            isReady && <Text style={styles.centerHudText}>Point at the ground to place</Text>
          )}
        </View>
      )}

      {/* ── Bottom Controls ── */}
      {!showDeck && (
        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) }]} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.placeButton, (!isReady || !canPlace) && styles.placeButtonDisabled]}
            onPress={() => placeFn?.()}
            disabled={!isReady || !canPlace}
          >
            <FontAwesome name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.placeButtonText}>Place Here</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Recommendations Overlay (When sliding back up) ── */}
      {showDeck && (
        <RecommendationsOverlay
          onRequestRescan={handleScanAnotherArea}
          hideScanAnotherButton
          reserveTabBarSpace={false}
          onPlantPress={(idx) => {
            setActivePlantIndex(idx);
            setActiveRecommendationIndex(idx);
            setShowDeck(false);
          }}
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1412' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  scene: { flex: 1 },

  scanAnotherFixedButton: {
    position: 'absolute',
    right: 20,
    zIndex: 50,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F6B4F',
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18201D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  buttonText: { color: '#F5F7F6', fontWeight: '600', fontSize: 14 },
  statusPillFloating: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#18201D',
  },
  statusText: { color: '#F5F7F6', fontWeight: '600', fontSize: 12, textAlign: 'center' },

  centerHud: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    backgroundColor: '#18201D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  centerHudText: { color: '#F5F7F6', fontWeight: '600', fontSize: 14 },

  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingTop: 32,
  },
  placeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F6B4F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  placeButtonDisabled: {
    backgroundColor: '#18201D',
  },
  placeButtonText: { color: '#F5F7F6', fontWeight: '600', fontSize: 14 },

  fallbackTitle: { color: '#fca5a5', fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  fallbackBody: { color: '#e5e7eb', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: 'rgba(100, 100, 100, 0.8)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
});
