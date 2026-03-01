import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Colors from '../../constants/Colors';

interface Props {
    score?: number;
    hasData: boolean;
    placeholder?: string;
}

export function OverallScore({ score, hasData, placeholder = '--' }: Props) {
    const displayScore = hasData && Number.isFinite(score)
        ? Math.max(0, Math.min(100, Math.round(score as number)))
        : placeholder;

    return (
        <View style={styles.container} testID="overall-score-module">
            <View style={styles.gaugeContainer}>
                <Svg width="240" height="240" viewBox="0 0 240 240" accessibilityLabel="overall-score-gauge">
                    <Path
                        d="M 23.0052 176 A 112 112 0 1 1 216.9948 176"
                        stroke={Colors.lawnLens.secondary}
                        strokeWidth="16"
                        strokeLinecap="round"
                        fill="none"
                    />
                </Svg>
                <View style={styles.textContainer}>
                    <Text style={styles.scoreText}>{displayScore}</Text>
                    <Text style={styles.labelText}>Overall Impact Score</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    gaugeContainer: {
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
        transform: [{ translateY: -10 }],
    },
    scoreText: {
        fontFamily: 'Sora-Bold',
        fontSize: 52,
        color: Colors.lawnLens.textPrimary,
        marginBottom: 4,
    },
    labelText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.lawnLens.textMuted,
    },
});
