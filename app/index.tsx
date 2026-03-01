import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  Easing,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore } from '../lib/store/profileStore';

const { width } = Dimensions.get('window');

// Aesthetic Constants
const ACCENT_GREEN = '#10b981';
const DEEP_BG = '#0F1412';
const TEXT_MUTED = '#9FAFAA';

/**
 * GreenScape Aesthetic Splash Screen with Fade Transition
 */
export default function SplashScreen() {
  const router = useRouter();
  const progress = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);
  const mainOpacity = useSharedValue(1); // Added for fade-out transition
  
  const [loadingText, setLoadingText] = useState('Initializing GreenScape');
  const hasCompletedOnboarding = useProfileStore((state) => state.hasCompletedOnboarding);
  const [isHydrated, setIsHydrated] = useState(false);

  // Background Particles State
  const particle1 = useSharedValue(0);
  const particle2 = useSharedValue(0);

  useEffect(() => {
    const unsubHydrate = useProfileStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    setIsHydrated(useProfileStore.persist.hasHydrated());
    return () => unsubHydrate();
  }, []);

  useEffect(() => {
    // Start Ambient Animations
    particle1.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
    particle2.value = withRepeat(withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }), -1, true);
    
    // Logo Entrance
    logoScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.5)) });
    logoOpacity.value = withTiming(1, { duration: 800 });

    if (!isHydrated) return;

    // Main Loading Sequence
    const sequence = () => {
      // Step 1: Brain Connection
      progress.value = withTiming(0.4, { duration: 1200 });
      setTimeout(() => setLoadingText('Synchronizing Environmental Data'), 1000);

      // Step 2: AR Engine Warmup
      setTimeout(() => {
        progress.value = withTiming(0.8, { duration: 1500 });
        setLoadingText('Warming GreenScape Engine');
      }, 1200);

      // Step 3: Finalize
      setTimeout(() => {
        setLoadingText('Ready to Grow');
        progress.value = withTiming(1, { duration: 800 }, (finished) => {
          if (finished) {
            // Trigger Fade Out before navigation
            mainOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }, (done) => {
              if (done) {
                runOnJS(navigateNext)();
              }
            });
          }
        });
      }, 2800);
    };

    sequence();
  }, [isHydrated]);

  const navigateNext = () => {
    if (hasCompletedOnboarding) {
      router.replace('/(tabs)/scan');
    } else {
      router.replace('/onboarding');
    }
  };

  // Animated Styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: mainOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const floatStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(particle1.value, [0, 1], [0, -30]) },
      { translateX: interpolate(particle1.value, [0, 1], [0, 20]) }
    ],
    opacity: interpolate(particle1.value, [0, 1], [0.1, 0.4]),
  }));

  const floatStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(particle2.value, [0, 1], [0, 40]) },
      { translateX: interpolate(particle2.value, [0, 1], [0, -15]) }
    ],
    opacity: interpolate(particle2.value, [0, 1], [0.1, 0.3]),
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[DEEP_BG, '#18201D', '#0A0D0C']} style={StyleSheet.absoluteFill} />
      
      {/* Ambient Bio-Luminescent Particles */}
      <Animated.View style={[styles.particle, { top: '20%', left: '15%' }, floatStyle1]} />
      <Animated.View style={[styles.particle, { bottom: '25%', right: '10%', width: 100, height: 100 }, floatStyle2]} />

      <View style={styles.content}>
        {/* Logo with Lens Glow Effect */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <View style={styles.glow} />
          <Image 
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={logoStyle}>
          <Text style={styles.title}></Text>
          <Text style={styles.tagline}></Text>
        </Animated.View>

        {/* Shimmer Loading Bar */}
        <View style={styles.footer}>
          <View style={styles.loaderTrack}>
            <Animated.View style={[styles.loaderFill, progressStyle]}>
              <LinearGradient 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                colors={['transparent', ACCENT_GREEN, '#6ee7b7']} 
                style={StyleSheet.absoluteFill} 
              />
            </Animated.View>
          </View>
          <Text style={styles.statusText}>{loadingText.toUpperCase()}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DEEP_BG,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  particle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: ACCENT_GREEN,
    opacity: 0.1,
  },
  logoWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: ACCENT_GREEN,
    opacity: 0.15,
  },
  logo: {
    width: 110,
    height: 110,
    zIndex: 2,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  loaderTrack: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loaderFill: {
    height: '100%',
    borderRadius: 1,
  },
  statusText: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
