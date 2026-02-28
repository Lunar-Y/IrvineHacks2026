import React, { useRef } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useCardsShareImage } from './useCardsShareImage'; // We'll build a hook for the actual share action

// The offscreen render content that goes into the ShareCard
const ImpactContent = ({ metrics, totalPlants }: { metrics: any; totalPlants: number }) => (
    <View style={styles.contentContainer}>
        <Text style={styles.title}>LawnLens</Text>
        <Text style={styles.subtitle}>My yard's ecological impact</Text>

        <View style={styles.statsGrid}>
            <View style={styles.statBox}>
                <Text style={styles.statValue}>{metrics.totalCarbonKg}kg</Text>
                <Text style={styles.statLabel}>CO₂ Sequestered</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statValue}>{metrics.averageWaterSavingsPercent}%</Text>
                <Text style={styles.statLabel}>Water Flow Saved</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statValue}>{metrics.totalPlants}</Text>
                <Text style={styles.statLabel}>New Plants</Text>
            </View>
            <View style={styles.statBox}>
                <Text style={styles.statValue}>{metrics.nativeCount}</Text>
                <Text style={styles.statLabel}>Native Species</Text>
            </View>
        </View>

        <Text style={styles.footer}>Scan your lawn and improve your environment today.</Text>
    </View>
);

export const ImpactShareCard = ({ metrics, totalPlants, innerRef }: { metrics: any; totalPlants: number, innerRef: React.RefObject<any> }) => {
    return (
        <View style={styles.hiddenWrapper}>
            <ViewShot ref={innerRef} options={{ format: 'jpg', quality: 0.9 }}>
                <View style={styles.card}>
                    <ImpactContent metrics={metrics} totalPlants={totalPlants} />
                </View>
            </ViewShot>
        </View>
    );
};

const styles = StyleSheet.create({
    hiddenWrapper: {
        position: 'absolute',
        top: -10000,
        left: -10000,
    },
    card: {
        width: 400,
        height: 400,
        backgroundColor: '#1E293B',
        padding: 30,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#4ADE80',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        color: '#4ADE80',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 18,
        marginBottom: 32,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        flex: 1,
        justifyContent: 'space-between',
        width: '100%',
    },
    statBox: {
        width: '45%',
        backgroundColor: '#0F172A',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    statValue: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 12,
        textAlign: 'center',
    },
    footer: {
        color: '#475569',
        fontSize: 14,
        marginTop: 20,
    }
});
