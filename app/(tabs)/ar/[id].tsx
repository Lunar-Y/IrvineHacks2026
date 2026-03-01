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

    // Get the currently selected model from parent
    const archetype = arSceneNavigator?.viroAppProps?.selectedArchetype ?? 'tree';

    addPlacedItem({
      id: Date.now(),
      pos: [...previewPos] as [number, number, number],
      archetype,
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

  const { currentScan, resetScan, clearPlacedPlants, placedPlantCounts } = useScanStore();
  const recommendations = currentScan.recommendations;

  const activePlantIndex = parseInt(id ?? '0', 10);
  const activePlant = recommendations[activePlantIndex];
  const selectedArchetype = activePlant?.model_archetype || 'tree';

  const isFocused = useIsFocused();
  const [mountViro, setMountViro] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [canPlace, setCanPlace] = useState(false);
  // Optional local tracking, but global counts reflect everywhere
  const totalPlacedCount = Object.values(placedPlantCounts).reduce((acc, c) => acc + c, 0);
  const [hint, setHint] = useState<string | null>(null);

  const [showDeck, setShowDeck] = useState(false);

  // Every time the user navigates into AR for a particular plant ID, hide the deck and return to camera controls
  useEffect(() => {
    setShowDeck(false);
  }, [id]);

  const [placeFn, setPlaceFn] = useState<(() => void) | null>(null);

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

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (isFocused) {
      // 300ms delay to ensure previous screens unbind from the camera hardware cleanly
      t = setTimeout(() => setMountViro(true), 300);
    } else {
      setMountViro(false);
      setIsReady(false);
      setCanPlace(false);
    }
    return () => clearTimeout(t);
  }, [isFocused]);

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

      {/* ── Top Bar ── */}
      {!showDeck && (
        <View style={[styles.topBar, { top: Math.max(insets.top, 14) }]} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => setShowDeck(true)}
            style={styles.backButton}
          >
            <FontAwesome name="chevron-left" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>

          {totalPlacedCount > 0 ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{`${totalPlacedCount} placed`}</Text>
            </View>
          ) : <View />}
        </View>
      )}

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
          onRequestRescan={() => {
            resetScan();
            clearPlacedPlants();
            router.navigate('/(tabs)/scan');
          }}
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  scene: { flex: 1 },

  topBar: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(55, 65, 81, 0.85)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12
  },
  buttonText: { color: 'white', fontWeight: '700' },
  statusPill: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  statusText: { color: '#f9fafb', fontWeight: '600', fontSize: 13, textAlign: 'center' },

  centerHud: {
    position: 'absolute', top: '20%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999,
  },
  centerHudText: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontSize: 14 },

  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingTop: 40, // allows gradient overlay if we want one
  },
  placeButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 18,
    borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
    borderWidth: 2, borderColor: '#fff'
  },
  placeButtonDisabled: {
    backgroundColor: '#4b5563',
    borderColor: '#9ca3af',
  },
  placeButtonText: { color: 'white', fontWeight: '800', fontSize: 18 },

  fallbackTitle: { color: '#fca5a5', fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  fallbackBody: { color: '#e5e7eb', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: 'rgba(100, 100, 100, 0.8)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
});
