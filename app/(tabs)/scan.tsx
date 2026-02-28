import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { usePlantsStore } from '../../store/plantsStore';
import PlantCard from '../../components/plants/PlantCard';
import PlantDetail from '../../components/plants/PlantDetail';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PlantRecommendation } from '../../types/plant';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const BOTTOM_SHEET_HEIGHT = 400; // Large bottom sheet

export default function ScanScreen() {
    const recommendations = usePlantsStore(state => state.recommendations);

    const [selectedPlant, setSelectedPlant] = useState<PlantRecommendation | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Animation for the bottom sheet sliding up on mount
    const slideAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

    useEffect(() => {
        // Wait briefly after mount before sliding up for effect
        const timer = setTimeout(() => {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8
            }).start();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handlePlantPress = (plant: PlantRecommendation) => {
        setSelectedPlant(plant);
        setIsDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailOpen(false);
        // Note: The Exact scroll position on the FlatList is automatically preserved
        // because the FlatList does not unmount when the React Native Modal displays over it.
    };

    return (
        <View style={{ flex: 1, height: SCREEN_HEIGHT, backgroundColor: 'black' }}>
            {/* Dummy Background Image representing live camera */}
            <Image
                source={{ uri: 'https://picsum.photos/seed/yard/800/800' }}
                style={[StyleSheet.absoluteFillObject, { width: undefined, height: undefined, flex: 1, backgroundColor: '#064e3b' }]}
                resizeMode="cover"
            />
            {/* Safe Area or overlays over camera would go here */}
            <View className="absolute top-16 left-0 right-0 items-center pointer-events-none">
                <View className="bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                    <Text className="text-white font-medium">Point at your yard surface...</Text>
                </View>
            </View>

            {/* Detail Modal Overlay */}
            {selectedPlant && (
                <PlantDetail
                    plant={selectedPlant}
                    visible={isDetailOpen}
                    onClose={handleCloseDetail}
                />
            )}

            {/* Recommendations Bottom Sheet Overlay */}
            <Animated.View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: BOTTOM_SHEET_HEIGHT,
                    transform: [{ translateY: slideAnim }]
                }}
                className="bg-zinc-950/95 rounded-t-3xl pt-2 pb-8 border-t border-zinc-800 shadow-xl backdrop-blur-xl"
            >
                {/* Grabber indicator */}
                <View className="w-12 h-1.5 bg-zinc-700 rounded-full self-center mb-4 mt-1" />

                {/* Header */}
                <View className="px-6 mb-4 flex-row justify-between items-end">
                    <View>
                        <Text className="text-white text-2xl font-bold">{recommendations.length} plants</Text>
                        <Text className="text-zinc-400 text-sm mt-1">for your yard conditions</Text>
                    </View>
                    <View className="flex-row items-center bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                        <FontAwesome name="sun-o" size={14} color="#f59e0b" className="mr-2" />
                        <Text className="text-zinc-300 text-xs font-semibold">Zone 10b</Text>
                    </View>
                </View>

                {/* Horizontal Card List */}
                {/* Horizontal FlatList preserves scroll position naturally when hidden/covered */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
                    data={recommendations}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PlantCard plant={item} onPress={() => handlePlantPress(item)} />
                    )}
                    snapToInterval={288 + 16} // w-72 (288px) + mr-4 (16px)
                    decelerationRate="fast"
                    className="flex-1"
                />
            </Animated.View>
        </View>
    );
}
