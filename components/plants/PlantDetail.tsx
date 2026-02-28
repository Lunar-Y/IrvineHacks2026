import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { PlantRecommendation } from '../../types/plant';

interface PlantDetailProps {
    plant: PlantRecommendation;
    onClose: () => void;
    onDragToPlace: () => void; // Trigger AR gesture guide
}

export const PlantDetail = ({ plant, onClose, onDragToPlace }: PlantDetailProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
                {plant.image_urls && plant.image_urls.length > 0 && (
                    <Image source={{ uri: plant.image_urls[0] }} style={styles.heroImage} />
                )}
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.commonName}>{plant.common_name}</Text>
                <Text style={styles.scientificName}>{plant.scientific_name}</Text>

                <View style={styles.pillsRow}>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>{plant.sunlight_requirement.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>WATER {plant.watering_frequency_days}D</Text>
                    </View>
                    <View style={[styles.pill, styles[`difficulty_${plant.care_difficulty}`]]}>
                        <Text style={styles.pillText}>{plant.care_difficulty.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why it fits your yard</Text>
                    <Text style={styles.paragraph}>{plant.why_it_fits}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mature Size</Text>
                    <Text style={styles.paragraph}>
                        Height: {plant.mature_height_meters}m{'\n'}
                        Width: {plant.mature_width_meters}m
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Environmental Impact</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{plant.environmental_data.carbon_sequestration_kg_per_year}kg</Text>
                            <Text style={styles.statLabel}>CO₂/yr</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{plant.environmental_data.vs_lawn_water_savings_percent}%</Text>
                            <Text style={styles.statLabel}>Water Saved</Text>
                        </View>
                        {plant.environmental_data.native_species && (
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>Native</Text>
                                <Text style={styles.statLabel}>Species</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Added padding to bottom so it doesn't collide with the fixed button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.floatingAction}>
                <TouchableOpacity style={styles.actionButton} onPress={onDragToPlace}>
                    <Text style={styles.actionText}>Drag card to place in yard ↑</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        height: 250,
        backgroundColor: '#E2E8F0',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        color: '#FFF',
        fontSize: 24,
        lineHeight: 28,
    },
    content: {
        padding: 24,
    },
    commonName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    scientificName: {
        fontSize: 16,
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    pillsRow: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 8,
    },
    pill: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    pillText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    difficulty_easy: { backgroundColor: '#D1FAE5' },
    difficulty_moderate: { backgroundColor: '#FEF3C7' },
    difficulty_hard: { backgroundColor: '#FEE2E2' },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    floatingAction: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    actionButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
