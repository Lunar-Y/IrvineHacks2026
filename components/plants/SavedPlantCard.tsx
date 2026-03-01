import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function SavedPlantCard() {
    return (
        <View style={styles.card}>
            {/* Image Skeleton */}
            <View style={styles.imagePlaceholder}>
                <Feather name="anchor" size={24} color="#FFFFFF33" style={styles.watermark} />
            </View>

            {/* Body */}
            <View style={styles.body}>
                {/* Name Skeletons */}
                <View style={styles.namePlaceholder} />
                <View style={styles.scientificPlaceholder} />

                {/* Tags Row */}
                <View style={styles.tagsRow}>
                    <View style={[styles.pill, styles.pillPrimary]} />
                    <View style={[styles.pill, styles.pillSecondary]} />
                </View>

                {/* Bottom Meta Bar Skeleton */}
                <View style={styles.bottomMetaPlaceholder} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        // Card width is roughly 167px depending on screen sizes, 
        // handled by flex layout in grid, but setting minHeight here.
        flex: 1,
        height: 210,
        backgroundColor: '#18201D',
        borderRadius: 16,
        overflow: 'hidden',
        padding: 16,
        // explicitly no borders or shadows per UI spec
    },
    imagePlaceholder: {
        width: '100%',
        height: 96,
        backgroundColor: '#FFFFFF1A', // Skeleton base
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12, // Spacing: Image -> name
    },
    watermark: {
        opacity: 0.2,
    },
    body: {
        flex: 1,
    },
    namePlaceholder: {
        height: 14,
        width: '70%',
        backgroundColor: '#FFFFFF1A',
        borderRadius: 7,
        marginBottom: 8, // Spacing: Name -> scientific
    },
    scientificPlaceholder: {
        height: 12,
        width: '55%',
        backgroundColor: '#FFFFFF1A',
        borderRadius: 6,
        marginBottom: 12, // Spacing: Scientific -> pills
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8, // Assuming 8px gap between pills for tightness
        marginBottom: 12, // Spacing: Pills -> bottom meta
    },
    pill: {
        height: 22,
        width: 48, // approximate placeholder width
        borderRadius: 11,
    },
    pillPrimary: {
        backgroundColor: '#2F6B4F', // Primary / Forest Green
    },
    pillSecondary: {
        backgroundColor: '#4C8B6B', // Secondary / Moss
    },
    bottomMetaPlaceholder: {
        height: 10,
        width: '40%',
        backgroundColor: '#FFFFFF1A',
        borderRadius: 5,
        marginTop: 'auto', // push to bottom if there's extra space
    }
});
