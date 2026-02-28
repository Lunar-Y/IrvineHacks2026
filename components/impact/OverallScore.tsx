import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function OverallScore() {
    return (
        <View style={styles.container}>
            <View style={styles.gaugeContainer}>
                <Svg width="240" height="240" viewBox="0 0 240 240">
                    <Path
                        d="M 23.0052 176 A 112 112 0 1 1 216.9948 176"
                        stroke="#18201D"
                        strokeWidth="18.4"
                        strokeLinecap="round"
                        fill="none"
                    />
                </Svg>
                <View style={styles.textContainer}>
                    <Text style={styles.scoreText}>--</Text>
                    <Text style={styles.labelText}>Score Placeholder</Text>
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
        // Move slightly up since the bottom is empty arc space
        transform: [{ translateY: -10 }],
    },
    scoreText: {
        fontFamily: 'Sora-Bold',
        fontSize: 52,
        color: '#F5F7F6', // Option 2 Primary Typography
        marginBottom: 4,
    },
    labelText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#9FAFAA', // Option 2 Muted Typography
    }
});
