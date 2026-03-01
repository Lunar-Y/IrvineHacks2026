import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Colors from '../../constants/Colors';

interface Props {
    co2Kg: string;
    subtext: string;
}

function CO2Icon() {
    return (
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" accessibilityLabel="co2-icon">
            <Path d="M3.5 10.5C3.5 8.4 5.2 6.7 7.3 6.7C8.2 5 9.8 4 11.7 4C14.5 4 16.8 6.3 16.8 9.1C16.8 11.9 14.5 14.2 11.7 14.2H7.8" stroke={Colors.lawnLens.secondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M7.8 15.5V9.8" stroke={Colors.lawnLens.secondary} strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M5.8 11.8L7.8 9.8L9.8 11.8" stroke={Colors.lawnLens.secondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SCurve({ hasData }: { hasData: boolean }) {
    const width = 313;
    const height = 60;

    const path = hasData
        ? 'M 2 56 C 34 56, 66 55, 98 49 C 132 42, 164 28, 198 16 C 230 8, 264 5, 311 5'
        : 'M 2 56 C 70 56, 138 56, 206 52 C 246 49, 280 47, 311 45';

    const dotX = 311;
    const dotY = hasData ? 5 : 44;

    return (
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" testID="co2-s-curve">
            <Path
                d={path}
                stroke={Colors.lawnLens.secondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <Circle cx={dotX} cy={dotY} r={3.5} fill={Colors.lawnLens.secondary} testID="co2-endpoint-dot" />
        </Svg>
    );
}

export function CO2ImpactCard({ co2Kg, subtext }: Props) {
    const hasData = co2Kg !== '--';

    return (
        <View style={styles.container} testID="co2-module">
            <View style={styles.headerRow}>
                <CO2Icon />
                <Text style={styles.title}>CO₂ Sequestered</Text>
            </View>

            <Text style={styles.value}>{co2Kg}</Text>

            <View style={styles.graphArea}>
                <SCurve hasData={hasData} />
            </View>

            <Text style={styles.subtext}>{subtext}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 180,
        backgroundColor: Colors.lawnLens.cardSurface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    title: {
        color: Colors.lawnLens.textPrimary,
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        marginLeft: 8,
    },
    value: {
        color: Colors.lawnLens.textPrimary,
        fontFamily: 'Sora-SemiBold',
        fontSize: 32,
        marginBottom: 8,
    },
    graphArea: {
        height: 60,
        width: '100%',
    },
    subtext: {
        marginTop: 8,
        color: Colors.lawnLens.textMuted,
        fontFamily: 'Inter-Medium',
        fontSize: 12,
    },
});
