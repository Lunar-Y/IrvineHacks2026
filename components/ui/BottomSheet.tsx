import React, { useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    PanResponder,
    TouchableWithoutFeedback,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
    /** How tall the sheet is, measured from the bottom of the screen */
    snapHeight: number;
    visible: boolean;
    onDismiss: () => void;
    children: React.ReactNode;
}

/**
 * A simple animated bottom sheet built on Animated + PanResponder.
 * Slides up from the bottom when `visible` is true, slides back down on dismiss.
 * Drag the sheet downward to dismiss it.
 */
export default function BottomSheet({
    snapHeight,
    visible,
    onDismiss,
    children,
}: BottomSheetProps) {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: SCREEN_HEIGHT - snapHeight,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 200,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0.35,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: SCREEN_HEIGHT,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 200,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dy) > 10 && gestureState.dy > 0,
            onPanResponderMove: (_, gestureState) => {
                const newY = SCREEN_HEIGHT - snapHeight + gestureState.dy;
                if (newY > SCREEN_HEIGHT - snapHeight) {
                    translateY.setValue(newY);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    onDismiss();
                } else {
                    // Snap back
                    Animated.spring(translateY, {
                        toValue: SCREEN_HEIGHT - snapHeight,
                        useNativeDriver: true,
                        damping: 20,
                        stiffness: 200,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Dim backdrop — tap to dismiss */}
            <TouchableWithoutFeedback onPress={onDismiss}>
                <Animated.View
                    style={[
                        styles.backdrop,
                        { opacity: backdropOpacity },
                    ]}
                />
            </TouchableWithoutFeedback>

            {/* Sheet panel */}
            <Animated.View
                style={[
                    styles.sheet,
                    { height: snapHeight, transform: [{ translateY }] },
                ]}
            >
                {/* Drag handle */}
                <View {...panResponder.panHandlers} style={styles.handleArea}>
                    <View style={styles.handle} />
                </View>

                {/* Content */}
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 20,
    },
    handleArea: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#d1d5db',
    },
});
