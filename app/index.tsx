import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore } from '../lib/store/profileStore';

const { width } = Dimensions.get('window');
const LOADING_BAR_WIDTH = width * 0.7;

export default function SplashScreen() {
  const router = useRouter();
  const progress = useSharedValue(0);
  const [loadingText, setLoadingText] = useState('Initializing LawnLens...');
  const hasCompletedOnboarding = useProfileStore((state) => state.hasCompletedOnboarding);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubHydrate = useProfileStore.persist.onFinishHydration(() => setIsHydrated(true));
    setIsHydrated(useProfileStore.persist.hasHydrated());
    return () => unsubHydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Loading sequence
    const sequence = async () => {
      // Phase 1
      progress.value = withTiming(0.3, { duration: 800, easing: Easing.out(Easing.quad) });
      
      setTimeout(() => setLoadingText('Connecting to gardening brain...'), 800);
      
      // Phase 2
      setTimeout(() => {
        progress.value = withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.quad) });
      }, 900);

      setTimeout(() => setLoadingText('Preparing AR experience...'), 2000);

      // Phase 3
      setTimeout(() => {
        progress.value = withTiming(1, { duration: 800, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) {
            runOnJS(onLoadingComplete)();
          }
        });
      }, 2200);
    };

    sequence();
  }, [isHydrated]);

  const onLoadingComplete = () => {
    if (hasCompletedOnboarding) {
      router.replace('/(tabs)/scan');
    } else {
      router.replace('/onboarding');
    }
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: progress.value * LOADING_BAR_WIDTH,
    };
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F1412', '#18201D']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>LawnLens</Text>
        <Text style={styles.subtitle}>AI-Powered Plant Design</Text>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingBarBackground}>
            <Animated.View style={[styles.loadingBarFill, progressStyle]} />
          </View>
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      </View>

      <Text style={styles.footer}>© 2026 LawnLens Team</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1412',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 35,
    backgroundColor: 'rgba(47, 107, 79, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5F7F6',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9FAFAA',
    marginBottom: 60,
  },
  loadingContainer: {
    alignItems: 'center',
    width: LOADING_BAR_WIDTH,
  },
  loadingBarBackground: {
    width: LOADING_BAR_WIDTH,
    height: 6,
    backgroundColor: 'rgba(159, 170, 170, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loadingBarFill: {
    height: '100%',
    backgroundColor: '#2F6B4F',
    borderRadius: 3,
  },
  loadingText: {
    color: '#9FAFAA',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(159, 170, 170, 0.4)',
    fontSize: 12,
    fontWeight: '500',
  },
});
