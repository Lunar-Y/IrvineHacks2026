import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useScanStore } from '@/lib/store/scanStore';
import { supabase } from '@/lib/api/supabase';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const { currentScan, setScanStatus } = useScanStore();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

  const handleScan = async () => {
    if (!cameraRef.current) return;

    try {
      setScanStatus('scanning');
      
      // 1. Capture Frame (base64)
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5, // Lower quality for faster upload
      });

      if (!photo?.base64) throw new Error('Failed to capture frame');

      setScanStatus('analyzing');

      // 2. Get Location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 3. Trigger Supabase Edge Functions in parallel
      const [visionResponse, profileResponse] = await Promise.all([
        supabase.functions.invoke('analyze-frame', {
          body: { image: photo.base64 },
        }),
        supabase.functions.invoke('assemble-profile', {
          body: { lat: latitude, lng: longitude },
        })
      ]);

      if (visionResponse.error) throw visionResponse.error;
      if (profileResponse.error) throw profileResponse.error;

      console.log('Vision Analysis:', visionResponse.data);
      console.log('Environmental Profile:', profileResponse.data);

      setScanStatus('complete');
      // In a real app, you would navigate to the Recommendations screen here
    } catch (error) {
      console.error('Scan failed:', error);
      setScanStatus('error');
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted || !locationPermission) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          LawnLens needs camera and location permissions to scan your yard.
        </Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
        <View style={{ height: 20 }} />
        <Button 
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
          }} 
          title="Grant Location Permission" 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing="back"
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleScan}
            disabled={currentScan.status === 'scanning' || currentScan.status === 'analyzing'}
          >
            <Text style={styles.text}>Scan Lawn</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      
      {(currentScan.status === 'scanning' || currentScan.status === 'analyzing') && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.overlayText}>
            {currentScan.status === 'scanning' ? 'Capturing Lawn...' : 'Analyzing Environment...'}
          </Text>
        </View>
      )}

      {currentScan.status === 'complete' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Scan Complete! 🌱</Text>
          <TouchableOpacity 
             style={[styles.scanButton, { marginTop: 20 }]}
             onPress={() => setScanStatus('idle')}
          >
            <Text style={styles.text}>Scan Another Area</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  scanButton: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    marginTop: 10,
  }
});
