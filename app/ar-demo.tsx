/**
 * ⚠️  FILLER / DEMO FILE — REMOVE FOR FINAL PRODUCT
 *
 * This standalone AR demo exists to prove the placement system works independently.
 * In the final product, this screen should be DELETED and its logic moved into:
 *   - app/(tabs)/scan-ar.tsx  → hosts the ViroARSceneNavigator background
 *   - app/recommendations.tsx → drag-to-place triggers placement via scanStore
 *
 * The model picker, trig placement, and live preview logic here should be
 * refactored into reusable hooks/components under lib/ar/ and components/ar/.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getModelForArchetype, ModelKey } from '@/lib/ar/modelMapping';

/**
 * AR Demo — Angle-based placement with LIVE preview + model selector.
 *
 * Math: d = PHONE_HEIGHT / tan(pitchAngle)
 */

const PHONE_HEIGHT = 1.65; // ~5'5" height perspective
const MIN_DISTANCE = 0.5;
// Allowed to place up to 20 meters away
const MAX_DISTANCE = 20.0;
// With the true pitch, 5 degrees is aiming quite low
const MIN_PITCH_DEG = 5;

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

// ── Model picker options ────────────────────────────────────────────
const MODEL_OPTIONS: { label: string; emoji: string; archetype: string }[] = [
    { label: 'Tree', emoji: '🌳', archetype: 'tree' },
    { label: 'Big Tree', emoji: '🌲', archetype: 'large_tree' },
    { label: 'Shrub', emoji: '🌿', archetype: 'shrub' },
    { label: 'Flower', emoji: '🌸', archetype: 'flower' },
];

// ── Ground-hit trig ─────────────────────────────────────────────────
function computeGroundHit(
    pos: number[],
    forward: number[]
): { position: [number, number, number]; distance: number; valid: boolean } {
    const [fx, fy, fz] = forward;

    // Raw pitch from the camera's forward vector
    const rawPitchRad = Math.asin(Math.max(0, -fy));
    let pitchDeg = rawPitchRad * (180 / Math.PI);

    // If the user points the phone straight horizontally (0 deg) or up,
    // the floor intersection approaches infinity, causing tracking drift.
    // Clamp to a lowest allowable angle to force it to hit the floor.
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

// ── AR Scene ────────────────────────────────────────────────────────
interface PlacedItem {
    id: number;
    pos: [number, number, number];
    source: any;
    scale: [number, number, number];
}

const TreeScene = ({ arSceneNavigator }: { arSceneNavigator?: any }) => {
    const sceneRef = useRef<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
    const [previewPos, setPreviewPos] = useState<[number, number, number] | null>(null);
    const [previewValid, setPreviewValid] = useState(false);

    const _onTrackingUpdated = (state: any) => {
        setIsTracking(state === ViroConstants.TRACKING_NORMAL);
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
        const model = getModelForArchetype(archetype);

        setPlacedItems(prev => [...prev, {
            id: Date.now(),
            pos: [...previewPos] as [number, number, number],
            source: model.source,
            scale: model.scale,
        }]);
        arSceneNavigator?.viroAppProps?.onPlaced?.();
    };

    useEffect(() => {
        arSceneNavigator?.viroAppProps?.setPlaceFn?.(() => handlePlace);
    }, [isTracking, previewPos, previewValid]);

    // Get current preview model from parent
    const previewArchetype = arSceneNavigator?.viroAppProps?.selectedArchetype ?? 'tree';
    const previewModel = getModelForArchetype(previewArchetype);

    return (
        <ViroARScene
            ref={sceneRef}
            onTrackingUpdated={_onTrackingUpdated}
            onCameraTransformUpdate={_onCameraTransformUpdate}
        >
            <ViroAmbientLight color="#ffffff" intensity={200} />
            <ViroDirectionalLight color="#ffffff" direction={[0, -1, -0.2]} intensity={800} />

            {/* LIVE PREVIEW — ghost of currently selected model */}
            {previewValid && previewPos && (
                <ViroNode position={previewPos} opacity={0.5}>
                    <Viro3DObject
                        source={previewModel.source}
                        scale={previewModel.scale}
                        type="GLB"
                    />
                </ViroNode>
            )}

            {/* PLACED ITEMS — each remembers its own model */}
            {placedItems.map(item => (
                <ViroNode key={item.id} position={item.pos}>
                    <Viro3DObject
                        source={item.source}
                        scale={item.scale}
                        type="GLB"
                    />
                </ViroNode>
            ))}
        </ViroARScene>
    );
};

// ── Main Screen ─────────────────────────────────────────────────────
export default function ARDemoScreen() {
    const [showAR, setShowAR] = useState(false);
    const [placeFn, setPlaceFn] = useState<(() => void) | null>(null);
    const [hint, setHint] = useState<string | null>(null);
    const [treeCount, setTreeCount] = useState(0);
    const [selectedArchetype, setSelectedArchetype] = useState('tree');
    const router = useRouter();

    const showAimTooHigh = () => {
        setHint('📐 Aim lower to target the ground');
        setTimeout(() => setHint(null), 2000);
    };

    const onPlaced = () => {
        setTreeCount(c => c + 1);
        setHint('🌱 Placed!');
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
                        selectedArchetype,
                    }}
                />

                {/* Hint banner */}
                {hint && (
                    <View style={styles.hintBanner} pointerEvents="none">
                        <Text style={styles.hintText}>{hint}</Text>
                    </View>
                )}

                {/* Count */}
                {treeCount > 0 && (
                    <View style={styles.countBadge} pointerEvents="none">
                        <Text style={styles.countText}>{treeCount} placed</Text>
                    </View>
                )}

                {/* Model Picker */}
                <View style={styles.pickerRow}>
                    {MODEL_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.archetype}
                            style={[
                                styles.pickerItem,
                                selectedArchetype === opt.archetype && styles.pickerItemActive,
                            ]}
                            onPress={() => setSelectedArchetype(opt.archetype)}
                        >
                            <Text style={styles.pickerEmoji}>{opt.emoji}</Text>
                            <Text style={[
                                styles.pickerLabel,
                                selectedArchetype === opt.archetype && styles.pickerLabelActive,
                            ]}>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Place + Exit */}
                <View style={styles.overlayControls}>
                    <TouchableOpacity
                        style={styles.placeButton}
                        onPress={() => placeFn?.()}
                    >
                        <Text style={styles.placeButtonText}>🌱 Place Here</Text>
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
                <Text style={styles.title}>AR Plant Placement</Text>
                <Text style={styles.description}>
                    Point at the ground, pick a plant type, and tap to place it.{"\n"}
                    The angle of your phone determines distance!
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
        backgroundColor: '#10b981', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 16,
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
    // ── Model Picker ────────────────────────────────────────────────
    pickerRow: {
        position: 'absolute',
        top: 50,
        left: 10,
        right: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    pickerItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    pickerItemActive: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.25)',
    },
    pickerEmoji: { fontSize: 24 },
    pickerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 2 },
    pickerLabelActive: { color: '#fff' },
    // ── Controls ────────────────────────────────────────────────────
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
