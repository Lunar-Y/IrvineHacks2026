import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
    title: string;
}

export function SquareMetricCard({ title }: Props) {
    return (
        <View style={styles.container}>
            {/* Top Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 'auto' }}>
                {/* Icon Placeholder */}
                <View style={{ width: 20, height: 20, backgroundColor: '#2F6B4F', marginRight: 8, borderRadius: 4 }} />
                <Text style={{ color: '#F5F7F6', fontFamily: 'Inter-SemiBold', fontSize: 14 }}>
                    {title}
                </Text>
            </View>

            {/* Middle Section: Large Metric */}
            <View style={{ height: 28, width: 60, backgroundColor: '#4C8B6B', marginBottom: 8, borderRadius: 4 }} />

            {/* Bottom Section: Descriptor */}
            <View style={{ height: 12, width: 100, backgroundColor: '#4C8B6B', borderRadius: 4 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 168,
        height: 168,
        backgroundColor: '#18201D', // Option 2: Card Surface
        borderRadius: 16,
        padding: 16,
        justifyContent: 'flex-start', // Top -> Bottom flow
    },
});
