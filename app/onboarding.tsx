import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useProfileStore } from '../lib/store/profileStore';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function Onboarding() {
    const [step, setStep] = useState(0);
    const router = useRouter();
    const completeOnboarding = useProfileStore((state) => state.completeOnboarding);

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    const handleFinish = () => {
        completeOnboarding();
        router.replace('/(tabs)');
    };

    const nextStep = () => {
        setStep(s => s + 1);
    };

    const steps = [
        {
            title: 'Welcome to GreenScape',
            description: 'Discover the perfect plants for your unique environment in seconds.',
            icon: 'leaf-outline' as const,
            action: nextStep,
            actionText: 'Get Started',
            skipAction: handleFinish,
        },
        {
            title: 'Where do you grow?',
            description: 'We need your location to understand your local climate, hardiness zone, and typical weather patterns. This ensures our recommendations are highly accurate for your area.',
            icon: 'location-outline' as const,
            action: async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                // If denied, they can still proceed, we just won't have precise location
                // We could also enforce it, but let's be graceful.
                nextStep();
            },
            actionText: 'Allow Location',
            skipAction: nextStep,
        },
        {
            title: 'Analyze your space',
            description: 'To recommend plants that thrive, we need to see your yard. We use your camera to analyze soil, sun exposure, and existing plants.',
            icon: 'camera-outline' as const,
            action: async () => {
                if (!cameraPermission?.granted) {
                    const res = await requestCameraPermission();
                    if (res.granted) {
                        handleFinish();
                    } else {
                        // Can still finish but camera won't work later on Scan tab until allowed in settings
                        handleFinish();
                    }
                } else {
                    handleFinish();
                }
            },
            actionText: 'Allow Camera',
            skipAction: handleFinish,
        }
    ];

    const currentStep = steps[step];

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View
                key={step}
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(400)}
                style={styles.content}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={currentStep.icon} size={80} color="#10b981" />
                </View>

                <View style={styles.textContainer}>
                    <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.title}>
                        {currentStep.title}
                    </Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.description}>
                        {currentStep.description}
                    </Animated.Text>
                </View>

                <View style={styles.footerContainer}>
                    <TouchableOpacity style={styles.mainButton} onPress={currentStep.action}>
                        <Text style={styles.mainButtonText}>{currentStep.actionText}</Text>
                    </TouchableOpacity>

                    {currentStep.skipAction && (
                        <TouchableOpacity style={styles.skipButton} onPress={currentStep.skipAction}>
                            <Text style={styles.skipButtonText}>
                                {step === 0 ? 'Skip Intro' : 'Not Now'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 48,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 64,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4b5563',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    footerContainer: {
        width: '100%',
        position: 'absolute',
        bottom: 48,
        paddingHorizontal: 24,
    },
    mainButton: {
        backgroundColor: '#10b981',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    mainButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '500',
    },
});
