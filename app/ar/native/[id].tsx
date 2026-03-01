import React, { useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScanStore, PlantRecommendation } from '@/lib/store/scanStore';
import PlantCard from '@/components/plants/PlantCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let viro: any = null;
try { viro = require('@reactvision/react-viro'); } catch { }

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────
// IN-ROOM AR SCENE
// ─────────────────────────────────────────────────────────────────────
function PlantScene({ arSceneNavigator }: { arSceneNavigator?: any }) {
  if (!viro) return null;
  const {
    ViroARScene,
    ViroAmbientLight,
    ViroDirectionalLight,
    ViroBox,
    ViroNode,
    ViroCamera,
    ViroTrackingStateConstants: ViroConstants,
    ViroText,
    Viro3DObject
  } = viro;

  const sceneRef = useRef<any>(null);
  const [plants, setPlants] = useState<Array<{
    id: number;
    plantIndex: number;
    pos: [number, number, number];
    asset?: any;
  }>>([]);

  const [isTracking, setIsTracking] = useState(false);
  const hasPreview = isTracking;

  const onTrackingUpdated = (state: number) => {
    const tracking = state === ViroConstants.TRACKING_NORMAL;
    setIsTracking(tracking);
    if (arSceneNavigator?.viroAppProps?._onTrackingReady) {
      arSceneNavigator.viroAppProps._onTrackingReady(tracking);
    }
  };

  const placePlant = async (plantIndex: number, plantModelAsset?: any) => {
    if (!sceneRef.current || !isTracking) return;
    try {
      const orientation = await sceneRef.current.getCameraOrientationAsync();
      const pos = orientation.position;
      const forward = orientation.forward;

      const dropPos: [number, number, number] = [
        pos[0] + forward[0] * 1.5,
        pos[1] + forward[1] * 1.5 - 0.5, // Drop slightly lower for models
        pos[2] + forward[2] * 1.5,
      ];
      setPlants((prev) => [...prev, { id: Date.now(), plantIndex, pos: dropPos, asset: plantModelAsset }]);
    } catch (err) {
      console.warn('Could not project placement:', err);
    }
  };

  if (arSceneNavigator?.viroAppProps?._registerPlaceFn) {
    arSceneNavigator.viroAppProps._registerPlaceFn(placePlant);
  }

  return (
    <ViroARScene ref={sceneRef} onTrackingUpdated={onTrackingUpdated}>
      {/* Base ambient light so textures are visible */}
      <ViroAmbientLight color="#ffffff" intensity={300} />

      {/* Directional light to cast some shadows and highlight 3D geometry */}
      <ViroDirectionalLight color="#ffffff" direction={[0, -1, -0.2]} intensity={800} />

      {/* Camera-locked preview ring */}
      <ViroCamera position={[0, 0, 0]} active={true}>
        {hasPreview && (
          <ViroNode position={[0, -0.2, -1.3]}>
            <ViroBox scale={[0.1, 0.01, 0.1]} opacity={0.3} />
          </ViroNode>
        )}
      </ViroCamera>

      {/* Deployed plants in World Space */}
      {plants.map((p) => (
        <ViroNode key={p.id} position={p.pos}>
          {p.asset ? (
            <Viro3DObject
              source={p.asset}
              position={[0, 0, 0]}
              scale={[1, 1, 1]} // Assuming the imported .glb is reasonable scale, we can tune this
              type="GLB"
              onError={(e: any) => console.log('3D Object Load Error:', e)}
            />
          ) : (
            /* Fallback generic box if no model asset exists for this recommendation */
            <ViroBox scale={[0.2, 0.2, 0.2]} />
          )}

          <ViroText
            text={`Plant #${p.plantIndex}`}
            position={[0, 0.5, 0]}
            scale={[0.1, 0.1, 0.1]}
            style={styles.arText}
          />
        </ViroNode>
      ))}
    </ViroARScene>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SCREEN WRAPPER WITH DRAG AND DROP
// ─────────────────────────────────────────────────────────────────────
export default function ARNativeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { recommendations } = useScanStore();
  const insets = useSafeAreaInsets();

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

  // React State
  const [plantCount, setPlantCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activePlantIndex, setActivePlantIndex] = useState(() => {
    const parsed = Number.parseInt(id ?? '0', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });

  // Communication refs
  const placeFnRef = useRef<((idx: number, asset?: any) => void) | null>(null);

  // ── Drag & Drop State ──
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPlantIdx, setDraggedPlantIdx] = useState<number | null>(null);

  // ── PanResponder for picking cards off the deck ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger drag if moving UP off the deck
        return gestureState.dy < -10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
        setIsDragging(true);
        // We capture the currently active card in the carousel
        setDraggedPlantIdx(activePlantIndex);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false } // Viro doesn't play well with native animated overlays
      ),
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();

        // If dragged high enough up the screen (-150px), count as a DROP in AR
        if (gestureState.dy < -150 && isReady && placeFnRef.current) {
          const activePlant = recommendations[activePlantIndex];
          placeFnRef.current(activePlantIndex, activePlant?.model_asset);
          setPlantCount((c) => c + 1);
        }

        // Snap the card back down to the deck
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 6,
        }).start();

        setTimeout(() => setDraggedPlantIdx(null), 300);
      },
    })
  ).current;

  const handleTapPlace = () => {
    if (placeFnRef.current && isReady) {
      const activePlant = recommendations[activePlantIndex];
      placeFnRef.current(activePlantIndex, activePlant?.model_asset);
      setPlantCount((c) => c + 1);
    }
  };

  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: PlantScene }}
        viroAppProps={{
          _registerPlaceFn: (fn: any) => { placeFnRef.current = fn; },
          _onTrackingReady: setIsReady,
        }}
        style={styles.scene}
      />

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { top: Math.max(insets.top, 14) }]} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.buttonText}>← Exit</Text>
        </TouchableOpacity>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {!isReady ? "Look around slowly..." : `${plantCount} placed`}
          </Text>
        </View>
      </View>

      {/* ── Instruction HUD ── */}
      {isReady && !isDragging && (
        <View style={styles.centerHud} pointerEvents="none">
          <Text style={styles.centerHudText}>Drag a plant here</Text>
        </View>
      )}

      {/* ── Active Drag Clone Overlay ── */}
      {isDragging && draggedPlantIdx !== null && (
        <Animated.View
          style={[
            styles.dragOverlay,
            {
              transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: 0.85 }],
              opacity: 0.9,
            }
          ]}
          pointerEvents="none"
        >
          <PlantCard
            plant={recommendations[draggedPlantIdx]}
            onPress={() => { }}
            enableLiftGesture={false}
          />
        </Animated.View>
      )}

      {/* ── Bottom Deck UI ── */}
      <View style={[styles.deckContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deckScrollContent}
          snapToInterval={200 + 16}
          decelerationRate="fast"
          onScroll={(e) => {
            // Update active plant based on scroll position
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / 216);
            if (index >= 0 && index < recommendations.length && index !== activePlantIndex) {
              setActivePlantIndex(index);
            }
          }}
          scrollEventThrottle={16}
        >
          {recommendations.map((plant, idx) => {
            const isActive = idx === activePlantIndex;
            return (
              <View key={idx} style={styles.cardWrapper}>
                <View style={[styles.cardScaler, isActive && styles.activeCardScaler,
                // Hide the real card in the deck if it's currently being dragged
                (isDragging && draggedPlantIdx === idx) && { opacity: 0.2 }
                ]}>
                  {/* The actual element the user touches to begin the drag */}
                  <View {...(isActive ? panResponder.panHandlers : {})}>
                    <PlantCard
                      plant={plant}
                      onPress={() => setActivePlantIndex(idx)}
                      enableLiftGesture={false}
                    />
                  </View>

                  {isActive && isReady && !isDragging && (
                    <TouchableOpacity
                      onPress={handleTapPlace}
                      style={styles.placeButton}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.placeButtonText}>Tap or Drag ↑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  scene: { flex: 1 },
  arText: { fontSize: 18, color: '#ffffff', textAlign: 'center' },

  topBar: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { backgroundColor: 'rgba(55, 65, 81, 0.85)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  statusPill: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  statusText: { color: '#f9fafb', fontWeight: '600', fontSize: 13, textAlign: 'center' },

  centerHud: {
    position: 'absolute', top: '40%', alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999,
  },
  centerHudText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 14 },

  dragOverlay: {
    position: 'absolute',
    bottom: 60, // Start position matches the deck height roughly
    alignSelf: 'center',
    width: 200,
    zIndex: 999,
  },

  deckContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', paddingTop: 20,
  },
  deckScrollContent: { paddingHorizontal: Dimensions.get('window').width / 2 - 100, gap: 16 },

  cardWrapper: { width: 200 },
  cardScaler: { opacity: 0.6, transform: [{ scale: 0.88 }], transition: 'all 0.2s' },
  activeCardScaler: { opacity: 1, transform: [{ scale: 1 }] },

  placeButton: {
    position: 'absolute', bottom: -15, alignSelf: 'center',
    backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  placeButtonText: { color: 'white', fontWeight: '800', fontSize: 14 },

  fallbackTitle: { color: '#fca5a5', fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  fallbackBody: { color: '#e5e7eb', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: 'rgba(100, 100, 100, 0.8)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: 'white', fontWeight: '700' },
});
