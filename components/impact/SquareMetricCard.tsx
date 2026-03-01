import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Svg, { Path } from 'react-native-svg';
import Colors from '../../constants/Colors';

interface Props {
    title: string;
    value: string;
    descriptor: string;
    icon: 'water' | 'native' | 'heat' | 'nitrogen';
    testID?: string;
}

function MetricIcon({ icon }: { icon: Props['icon'] }) {
    const stroke = Colors.lawnLens.secondary;
    const strokeWidth = 1.8;
    const iconSize = 24;

    if (icon === 'water') {
        return (
            <Svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" accessibilityLabel="water-icon">
                <Path d="M10 3.2C10 3.2 5.8 8 5.8 11C5.8 13.4 7.7 15.3 10 15.3C12.3 15.3 14.2 13.4 14.2 11C14.2 8 10 3.2 10 3.2Z" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M3 16.2H17" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
                <Path d="M7 16.2C7.3 14.8 8.4 13.8 9.8 13.6" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
            </Svg>
        );
    }

    if (icon === 'native') {
        return (
            <Feather name="feather" size={iconSize} color={Colors.lawnLens.secondary} accessibilityLabel="native-icon" />
        );
    }

    if (icon === 'heat') {
        return (
            <Feather name="thermometer" size={iconSize} color={Colors.lawnLens.secondary} accessibilityLabel="heat-icon" />
        );
    }

    return (
        <Feather name="git-merge" size={iconSize} color={Colors.lawnLens.secondary} accessibilityLabel="nitrogen-icon" />
    );
}

export function SquareMetricCard({ title, value, descriptor, icon, testID }: Props) {
    return (
        <View style={styles.container} testID={testID}>
            <View style={styles.topSection}>
                <MetricIcon icon={icon} />
                <Text style={styles.title}>{title}</Text>
            </View>

            <Text style={styles.metric}>{value}</Text>

            <Text style={styles.descriptor}>{descriptor}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 168,
        height: 168,
        backgroundColor: Colors.lawnLens.cardSurface,
        borderRadius: 16,
        padding: 16,
    },
    topSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 28,
    },
    title: {
        color: Colors.lawnLens.textPrimary,
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        flex: 1,
    },
    metric: {
        color: Colors.lawnLens.textPrimary,
        fontFamily: 'Sora-SemiBold',
        fontSize: 28,
        marginBottom: 10,
    },
    descriptor: {
        color: Colors.lawnLens.textMuted,
        fontFamily: 'Inter-Medium',
        fontSize: 12,
    },
});
