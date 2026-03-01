import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScanStore } from '@/lib/store/scanStore';
import { usePlantsStore } from '@/lib/store/plantsStore';

export default function PlantDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { recommendations, currentScan } = useScanStore();
    const { savedPlants, addPlant, removePlant } = usePlantsStore();

    const index = parseInt(id ?? '0', 10);
    const plant = recommendations[index];

    const isSaved = useMemo(() => {
        if (!plant) return false;
        return savedPlants.some(p => p.plant_scientific_name === plant.scientific_name);
    }, [savedPlants, plant]);

    if (!plant) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Plant not found.</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>← Go back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const toggleSave = () => {
        if (isSaved) {
            const savedItem = savedPlants.find(p => p.plant_scientific_name === plant.scientific_name);
            if (savedItem) removePlant(savedItem.id);
        } else {
            addPlant({
                id: Math.random().toString(36).substring(7), // Temporary ID generator
                session_id: currentScan.id || 'local',
                plant_common_name: plant.common_name,
                plant_scientific_name: plant.scientific_name,
                environmental_profile: currentScan.assembledProfile,
                recommendation_data: plant,
                saved_at: new Date().toISOString(),
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* Hero image */}
            {plant.image_url ? (
                <Image
                    source={{ 
                        uri: plant.image_url,
                        headers: { 'User-Agent': 'LawnLens/1.0 (https://lawnlens.app; contact@lawnlens.app)' }
                    }}
                    style={styles.heroImage}
                    contentFit="cover"
                    onLoadStart={() => console.log(`[DetailDebug] Starting load: ${plant.common_name} - ${plant.image_url}`)}
                    onLoad={() => console.log(`[DetailDebug] Successfully loaded: ${plant.common_name}`)}
                    onError={(error) => {
                        console.error(`[DetailDebug] Error loading ${plant.common_name}:`, error.error);
                    }}
                />
            ) : (
                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                    <Text style={{ fontSize: 64 }}>🌿</Text>
                </View>
            )}

            {/* Dismiss button overlaid on hero */}
            <View style={styles.handleOverlay}>
                <TouchableOpacity onPress={() => router.back()} style={styles.dismissBtn}>
                    <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                {/* Names */}
                <Text style={styles.commonName}>{plant.common_name}</Text>
                <Text style={styles.scientificName}>{plant.scientific_name}</Text>

                {/* Why it fits */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why it fits your yard</Text>
                    <Text style={styles.bodyText}>{plant.why_it_fits}</Text>
                </View>

                {/* Stats grid */}
                <View style={styles.statsGrid}>
                    <StatBox label="Height" value={`${plant.mature_height_meters}m`} />
                    <StatBox label="Water" value={plant.water_requirement} />
                    <StatBox label="Difficulty" value={plant.care_difficulty ?? 'easy'} />
                    <StatBox label="Pet safe" value={plant.is_toxic_to_pets ? '⚠️ No' : '✅ Yes'} />
                </View>

                {/* Care tip */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Care tip</Text>
                    <View style={styles.careTipBox}>
                        <Text style={styles.bodyText}>💡 {plant.care_tip}</Text>
                    </View>
                </View>

                {/* Action button */}
                <TouchableOpacity 
                    style={[styles.saveButton, isSaved && styles.savedButton]} 
                    onPress={toggleSave}
                >
                    <Text style={[styles.saveButtonText, isSaved && styles.savedButtonText]}>
                        {isSaved ? '✓ Saved to Yard' : 'Save to My Collection'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.statBox}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue} numberOfLines={1}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    heroImage: { width: '100%', height: 260 },
    heroPlaceholder: {
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    handleOverlay: { position: 'absolute', top: 16, right: 16 },
    dismissBtn: {
        backgroundColor: 'rgba(0,0,0,0.45)',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dismissText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    body: { flex: 1 },
    bodyContent: { padding: 24, paddingBottom: 48 },
    commonName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#14532d',
        marginBottom: 4,
    },
    scientificName: {
        fontSize: 15,
        color: '#6b7280',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    bodyText: { fontSize: 15, color: '#374151', lineHeight: 22 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statBox: {
        flex: 1,
        minWidth: '44%',
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    statLabel: {
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: { fontSize: 16, fontWeight: '700', color: '#14532d' },
    careTipBox: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    errorText: { fontSize: 18, color: '#374151', marginBottom: 16 },
    backLink: { color: '#16a34a', fontWeight: '700', fontSize: 16 },
    saveButton: {
        backgroundColor: '#16a34a',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    savedButton: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    savedButtonText: {
        color: '#166534',
    },
});
