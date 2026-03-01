import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * AR Demo — Angle-based placement with LIVE preview tree.
 *
 * The preview tree follows where you aim in real-time.
 * Tap "Place Tree" to lock it in place.
 *
 * Math: d = PHONE_HEIGHT / tan(pitchAngle)
 */

const PHONE_HEIGHT = 1.52;    // ~5 feet
const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 8.0;
const MIN_PITCH_DEG = 10;

// ── Dynamic Viro import ─────────────────────────────────────────────
let viro: any = null;
try {
    viro = require('@reactvision/react-viro');
} catch (e) {
    console.warn('Viro modules not found.');
}

const {
    ViroARSceneNavigator,
    ViroARScene,
    ViroAmbientLight,
    ViroDirectionalLight,
    Viro3DObject,
    ViroNode,
    ViroTrackingStateConstants: ViroConstants,
} = viro || {};

// ─────────────────────────────────────────────────────────────────────
// Helper: compute ground-hit position from camera orientation
// ─────────────────────────────────────────────────────────────────────
function computeGroundHit(
    pos: number[],
    forward: number[]
): { position: [number, number, number]; distance: number; valid: boolean } {
    const [fx, fy, fz] = forward;
    const pitchRad = Math.asin(Math.max(0, -fy));
    const pitchDeg = pitchRad * (180 / Math.PI);

    if (pitchDeg < MIN_PITCH_DEG) {
        return { position: [0, 0, 0], distance: 0, valid: false };
    }

    let d = PHONE_HEIGHT / Math.tan(pitchRad);
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
// INTERNAL AR SCENE — live preview + placed trees
// ─────────────────────────────────────────────────────────────────────
interface PlacedTree {
    id: number;
    pos: [number, number, number];
}

const TreeScene = ({ arSceneNavigator }: { arSceneNavigator?: any }) => {
    const sceneRef = useRef<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [placedTrees, setPlacedTrees] = useState<PlacedTree[]>([]);

    // Live preview position — updates every frame
    const [previewPos, setPreviewPos] = useState<[number, number, number] | null>(null);
    const [previewValid, setPreviewValid] = useState(false);

    const _onTrackingUpdated = (state: any) => {
        setIsTracking(state === ViroConstants.TRACKING_NORMAL);
    };

    // Called ~60fps with camera transform
    const _onCameraTransformUpdate = useCallback((cameraTransform: any) => {
        if (!isTracking) return;
        const pos = cameraTransform.position;
        const forward = cameraTransform.forward;
        const hit = computeGroundHit(pos, forward);

        if (hit.valid) {
            setPreviewPos(hit.position as [number, number, number]);
            setPreviewValid(true);
        } else {
            setPreviewValid(false);
        }
    }, [isTracking]);

    // Place tree at current preview position
    const handlePlace = () => {
        if (!previewValid || !previewPos) {
            arSceneNavigator?.viroAppProps?.onAimTooHigh?.();
            return;
        }
        setPlacedTrees(prev => [...prev, { id: Date.now(), pos: [...previewPos] as [number, number, number] }]);
        arSceneNavigator?.viroAppProps?.onPlaced?.();
    };

    // Expose place function to parent
    useEffect(() => {
        arSceneNavigator?.viroAppProps?.setPlaceFn?.(() => handlePlace);
    }, [isTracking, previewPos, previewValid]);

    return (
        <ViroARScene
            ref={sceneRef}
            onTrackingUpdated={_onTrackingUpdated}
            onCameraTransformUpdate={_onCameraTransformUpdate}
        >
            <ViroAmbientLight color="#ffffff" intensity={200} />
            <ViroDirectionalLight color="#ffffff" direction={[0, -1, -0.2]} intensity={800} />

            {/* LIVE PREVIEW TREE — semi-transparent, follows your aim */}
            {previewValid && previewPos && (
                <ViroNode position={previewPos} opacity={0.5}>
                    <Viro3DObject
                        source={require('../assets/models/maple_tree.glb')}
                        scale={[0.06, 0.06, 0.06]}
                        type="GLB"
                    />
                </ViroNode>
            )}

            {/* PLACED TREES — fully opaque, locked in position */}
            {placedTrees.map(tree => (
                <ViroNode key={tree.id} position={tree.pos}>
                    <Viro3DObject
                        source={require('../assets/models/maple_tree.glb')}
                        scale={[0.06, 0.06, 0.06]}
                        type="GLB"
                    />
                </ViroNode>
            ))}
        </ViroARScene>
    );
};

// ─────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────
export default function ARDemoScreen() {
    const [showAR, setShowAR] = useState(false);
    const [placeFn, setPlaceFn] = useState<(() => void) | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [treeCount, setTreeCount] = useState(0);
    const router = useRouter();

    const showAimTooHigh = () => {
        setHint('📐 Aim lower to target the ground');
        setTimeout(() => setHint(null), 2000);
    };

    const onPlaced = () => {
        setTreeCount(c => c + 1);
        setHint('🌳 Placed!');
        setTimeout(() => setHint(null), 1500);
    };

    if (showAR && ViroARSceneNavigator) {
        return (
            <View style={styles.container}>
                <ViroARSceneNavigator
                    autofocus={true}
                    initialScene={{ scene: TreeScene }}
                    style={styles.arView}
                    viroAppProps={{
                        setPlaceFn,
                        onAimTooHigh: showAimTooHigh,
                        onPlaced,
                    }}
                />

                {/* Hint banner */}
                {hint && (
                    <View style={styles.hintBanner} pointerEvents="none">
                        <Text style={styles.hintText}>{hint}</Text>
                    </View>
                )}

                {/* Tree count */}
                {treeCount > 0 && (
                    <View style={styles.countBadge} pointerEvents="none">
                        <Text style={styles.countText}>{treeCount} tree{treeCount > 1 ? 's' : ''} placed</Text>
                    </View>
                )}

                {/* Controls */}
                <View style={styles.overlayControls}>
                    <TouchableOpacity
                        style={styles.placeButton}
                        onPress={() => placeFn?.()}
                    >
                        <Text style={styles.placeButtonText}>🌱 Place Tree Here</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={() => { setShowAR(false); setTreeCount(0); }}
                    >
                        <Text style={styles.exitText}>✕ Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.content}>
                <Text style={styles.title}>Interactive Placement</Text>
                <Text style={styles.description}>
                    Point your phone at the ground.{"\n"}
                    A ghost tree will appear where it will be placed.{"\n"}
                    Tap the button to lock it in!
                </Text>

                <TouchableOpacity
                    style={styles.goButton}
                    onPress={() => setShowAR(true)}
                >
                    <Text style={styles.goText}>Start Placement</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backText}>Back to Scan</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    arView: { flex: 1 },
    title: { fontSize: 28, fontWeight: '800', color: '#064e3b', textAlign: 'center', marginBottom: 20 },
    description: { fontSize: 16, color: '#334155', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
    goButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 40, paddingVertical: 18, borderRadius: 16,
        shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, marginBottom: 20,
    },
    goText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    backButton: { paddingVertical: 12 },
    backText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
    hintBanner: { position: 'absolute', top: 80, left: 20, right: 20, alignItems: 'center' },
    hintText: {
        backgroundColor: 'rgba(16, 185, 129, 0.85)', color: '#fff',
        fontWeight: '700', fontSize: 15, paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 999, overflow: 'hidden',
    },
    countBadge: { position: 'absolute', top: 50, right: 20 },
    countText: {
        backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff',
        fontWeight: '600', fontSize: 13, paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 999, overflow: 'hidden',
    },
    overlayControls: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    placeButton: {
        backgroundColor: '#10b981', paddingHorizontal: 30, paddingVertical: 15,
        borderRadius: 999, borderWidth: 3, borderColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }, marginBottom: 20,
    },
    placeButtonText: { color: '#fff', fontWeight: '800', fontSize: 18 },
    exitButton: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
    exitText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
