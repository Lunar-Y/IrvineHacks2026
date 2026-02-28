import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function CO2ImpactCard() {
    return (
        <View style={styles.container}>
            {/* Top placeholder */}
            <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
                <View style={{ width: 20, height: 20, backgroundColor: '#2F6B4F', marginRight: 8, borderRadius: 4 }} />
                <Text style={{ color: '#9FAFAA', fontFamily: 'Inter-Medium', fontSize: 14 }}>
                    CO2 Title Placeholder
                </Text>
            </View>

            {/* Value placeholder */}
            <View style={{ height: 32, width: 80, backgroundColor: '#4C8B6B', marginBottom: 16, borderRadius: 4 }} />

            {/* Graph Area Placeholder */}
            <View style={styles.graphPlaceholder} />

            {/* Subtext placeholder */}
            <View style={{ height: 13, width: 120, backgroundColor: '#4C8B6B', marginTop: 16, borderRadius: 4 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Width can be generic or '100%' since parent will handle padding.
        // Spec says 353x180. 393 - 40 = 353. If we use 100% inside 20px padded view, it works naturally.
        width: '100%',
        height: 220, // Increased from 180 to contain all interior vertically stacked blocks
        backgroundColor: '#18201D', // Option 2 Card Surface
        borderRadius: 16, // Corner radius
        padding: 20,
        marginBottom: 32, // Spacing below
    },
    graphPlaceholder: {
        height: 60,
        width: '100%',
        backgroundColor: '#B7D3C0', // Option 2 Soft Sage Fill
    },
});
