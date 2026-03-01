import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useScanStore } from '@/lib/store/scanStore';

export default function PlantDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { currentScan } = useScanStore();
    const recommendations = currentScan.recommendations;

    const index = parseInt(id ?? '0', 10);
    const plant = recommendations[index];

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

    return (
        <View style={styles.container}>
            {/* Hero image */}
            {plant.image_url ? (
                <Image
                    source={{ uri: plant.image_url }}
                    style={styles.heroImage}
                    resizeMode="cover"
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

            <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: Math.max(insets.bottom, 24) + 100 }]}>
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
            </ScrollView>

            {/* Floating AR CTA inside safe area */}
            <View style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => {
                        router.dismissAll();
                        setTimeout(() => router.navigate(`/(tabs)/ar/${index}`), 50);
                    }}
                    activeOpacity={0.85}
                >
                    <FontAwesome name="cube" size={20} color="#F5F7F6" />
                    <Text style={styles.ctaButtonText}>Place Plant in AR</Text>
                </TouchableOpacity>
            </View>
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
    ctaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 20,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2F6B4F',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 10,
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
