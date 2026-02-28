import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { PlantRecommendation } from '../../types/plant';

interface PlantCardProps {
    plant: PlantRecommendation;
    onPress: () => void;
}

export default function PlantCard({ plant, onPress }: PlantCardProps) {
    const isBestMatch = plant.rank === 1;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            className="bg-zinc-900 rounded-3xl p-4 w-72 mr-4 border border-zinc-800 shadow-lg justify-start z-50"
        >
            <View className="flex-row items-center space-x-4">
                {plant.image_urls && plant.image_urls.length > 0 ? (
                    <Image
                        source={{ uri: plant.image_urls[0] }}
                        className="w-20 h-20 rounded-2xl bg-zinc-800"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-20 h-20 rounded-2xl bg-zinc-800 items-center justify-center">
                        <Text className="text-zinc-500 text-xs">No Image</Text>
                    </View>
                )}

                <View className="flex-1 justify-center">
                    {isBestMatch && (
                        <View className="bg-emerald-500/20 self-start px-2 py-0.5 rounded-full mb-1">
                            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Best Match</Text>
                        </View>
                    )}

                    <Text className="text-white text-lg font-bold" numberOfLines={1}>{plant.common_name}</Text>
                    <Text className="text-green-400 text-xs italic mb-2" numberOfLines={1}>{plant.scientific_name}</Text>

                    <View className="flex-row items-center space-x-2">
                        <View className="bg-zinc-800 px-2 py-1 rounded-md">
                            <Text className="text-zinc-300 text-xs capitalize">{plant.care_difficulty} care</Text>
                        </View>
                        <View className="bg-zinc-800 px-2 py-1 rounded-md">
                            <Text className="text-zinc-300 text-xs">{plant.mature_height_meters}m tall</Text>
                        </View>
                    </View>
                </View>
            </View>

            <Text className="text-zinc-400 text-xs mt-3 leading-relaxed" numberOfLines={2}>
                {plant.why_it_fits}
            </Text>
        </TouchableOpacity>
    );
}
