import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { PlantRecommendation } from '../../types/plant';

interface PlantCardProps {
    plant: PlantRecommendation;
    onPress: (plantId: string) => void;
    onDragStart?: () => void; // Plumbed later for Checkpoint 4
}

export const PlantCard = ({ plant, onPress, onDragStart }: PlantCardProps) => {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => onPress(plant.id)}
            onLongPress={onDragStart}
        >
            <View style={styles.imageContainer}>
                {plant.image_urls && plant.image_urls.length > 0 ? (
                    <Image source={{ uri: plant.image_urls[0] }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderImage} />
                )}
                {plant.rank === 1 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Best Match</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.commonName} numberOfLines={1}>
                    {plant.common_name}
                </Text>
                <Text style={styles.scientificName} numberOfLines={1}>
                    {plant.scientific_name}
                </Text>

                <Text style={styles.fitReason} numberOfLines={2}>
                    {plant.why_it_fits}
                </Text>

                <View style={styles.footer}>
                    <View style={[styles.pill, styles[`difficulty_${plant.care_difficulty}`]]}>
                        <Text style={styles.pillText}>
                            {plant.care_difficulty.charAt(0).toUpperCase() + plant.care_difficulty.slice(1)}
                        </Text>
                    </View>
                    <Text style={styles.sizeText}>
                        {plant.mature_height_meters}m × {plant.mature_width_meters}m
                    </Text>
                </View>
            </View>

            {/* Drag handle */}
            <View style={styles.dragHandleArea}>
                <Text style={styles.dragIcon}>⠿</Text>
                <Text style={styles.dragLabel} numberOfLines={2}>drag to place</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 300,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginRight: 16,
        flexDirection: 'row',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E2E8F0',
    },
    badge: {
        position: 'absolute',
        top: 4,
        left: 4,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    commonName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    scientificName: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    fitReason: {
        fontSize: 12,
        color: '#334155',
        lineHeight: 16,
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 8,
    },
    pill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pillText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    difficulty_easy: { backgroundColor: '#10B981' },
    difficulty_moderate: { backgroundColor: '#F59E0B' },
    difficulty_hard: { backgroundColor: '#EF4444' },
    sizeText: {
        fontSize: 11,
        color: '#64748B',
    },
    dragHandleArea: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#F1F5F9',
        marginLeft: 8,
    },
    dragIcon: {
        fontSize: 20,
        color: '#CBD5E1',
        lineHeight: 20,
    },
    dragLabel: {
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 4,
    },
});
