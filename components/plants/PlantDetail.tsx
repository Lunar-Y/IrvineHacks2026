import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { PlantRecommendation } from '../../types/plant';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface PlantDetailProps {
    plant: PlantRecommendation;
    visible: boolean;
    onClose: () => void;
}

export default function PlantDetail({ plant, visible, onClose }: PlantDetailProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'care'>('overview');

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View className="flex-1 bg-zinc-950">
                <View className="absolute top-4 right-4 z-[999]">
                    <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-black/50 rounded-full items-center justify-center backdrop-blur-md">
                        <FontAwesome name="close" size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <ScrollView className="flex-1">
                    {/* Hero Image */}
                    <View className="w-full h-64 bg-zinc-900 relative">
                        {plant.image_urls && plant.image_urls.length > 0 ? (
                            <Image source={{ uri: plant.image_urls[0] }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="flex-1 items-center justify-center">
                                <Text className="text-zinc-500">No Image Available</Text>
                            </View>
                        )}
                        <View className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <Text className="text-white text-3xl font-bold mb-1">{plant.common_name}</Text>
                            <Text className="text-green-400 text-lg italic">{plant.scientific_name}</Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View className="flex-row border-b border-zinc-800 px-6 pt-4">
                        <TouchableOpacity
                            className={`mr-6 pb-2 border-b-2 ${activeTab === 'overview' ? 'border-green-500' : 'border-transparent'}`}
                            onPress={() => setActiveTab('overview')}
                        >
                            <Text className={`text-base font-semibold ${activeTab === 'overview' ? 'text-green-500' : 'text-zinc-400'}`}>Overview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`pb-2 border-b-2 ${activeTab === 'care' ? 'border-green-500' : 'border-transparent'}`}
                            onPress={() => setActiveTab('care')}
                        >
                            <Text className={`text-base font-semibold ${activeTab === 'care' ? 'text-green-500' : 'text-zinc-400'}`}>Care</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View className="p-6">
                        {activeTab === 'overview' ? (
                            <View className="space-y-6">
                                <View>
                                    <Text className="text-white text-lg font-bold mb-2">Why it fits your yard</Text>
                                    <Text className="text-zinc-300 text-base leading-relaxed">{plant.why_it_fits}</Text>
                                </View>

                                {/* Key Stats Row */}
                                <View className="flex-row flex-wrap mt-4">
                                    <View className="w-1/2 mb-4 pr-2">
                                        <View className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                            <FontAwesome name="sun-o" size={16} color="#4ade80" className="mb-2" />
                                            <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Sunlight</Text>
                                            <Text className="text-white font-semibold capitalize">{plant.sunlight_requirement.replace('_', ' ')}</Text>
                                        </View>
                                    </View>
                                    <View className="w-1/2 mb-4 pl-2">
                                        <View className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                            <FontAwesome name="tint" size={16} color="#3b82f6" className="mb-2" />
                                            <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Water</Text>
                                            <Text className="text-white font-semibold">Every {plant.watering_frequency_days} Days</Text>
                                        </View>
                                    </View>
                                    <View className="w-1/2 pr-2">
                                        <View className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                            <FontAwesome name="leaf" size={16} color="#a855f7" className="mb-2" />
                                            <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Size</Text>
                                            <Text className="text-white font-semibold">{plant.mature_height_meters}m x {plant.mature_width_meters}m</Text>
                                        </View>
                                    </View>
                                    <View className="w-1/2 pl-2">
                                        <View className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                            <FontAwesome name="tachometer" size={16} color="#f59e0b" className="mb-2" />
                                            <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Difficulty</Text>
                                            <Text className="text-white font-semibold capitalize">{plant.care_difficulty}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Companions & Incompatible mock */}
                                <View className="mt-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                                    <Text className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Companions</Text>
                                    <Text className="text-white">Other native drought-tolerant species</Text>
                                </View>

                                {/* Badges */}
                                <View className="flex-row space-x-3 mt-2">
                                    <View className="bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                        <Text className="text-emerald-400 text-sm font-medium">🌸 High Pollinator Support</Text>
                                    </View>
                                    <View className="bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                                        <Text className="text-blue-400 text-sm font-medium">💧 Drops Water Usage</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View className="space-y-6">
                                <Text className="text-white text-lg font-bold mb-4">Maintenance Overview</Text>

                                <View className="bg-zinc-900 rounded-xl p-4 mb-4 border border-zinc-800">
                                    <View className="flex-row items-center mb-2">
                                        <FontAwesome name="tint" size={20} color="#3b82f6" className="mr-3" />
                                        <Text className="text-white font-semibold text-base">Watering Routine</Text>
                                    </View>
                                    <Text className="text-zinc-300">Requires deep watering every {plant.watering_frequency_days} days to establish strong root systems. Reduce during winter.</Text>
                                </View>

                                <View className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
                                    <View className="flex-row items-center mb-2">
                                        <FontAwesome name="sun-o" size={20} color="#f59e0b" className="mr-3" />
                                        <Text className="text-white font-semibold text-base">Sunlight Needs</Text>
                                    </View>
                                    <Text className="text-zinc-300 capitalize">{plant.sunlight_requirement.replace('_', ' ')}. Best placed in locations that receive direct sunlight most of the day.</Text>
                                </View>

                                <Text className="text-white text-lg font-bold mb-3">This Week's Tasks</Text>
                                <View className="bg-zinc-900 border-l-4 border-l-blue-500 p-4 rounded-r-xl rounded-l-sm mb-3">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className="text-white font-bold">Water deeply</Text>
                                        <Text className="text-zinc-500 text-sm">Tomorrow</Text>
                                    </View>
                                    <Text className="text-zinc-400 text-sm">Hold hose at base for 3-5 minutes</Text>
                                </View>

                                <View className="bg-zinc-900 border-l-4 border-l-orange-500 p-4 rounded-r-xl rounded-l-sm mb-3">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className="text-white font-bold">Check soil moisture</Text>
                                        <Text className="text-zinc-500 text-sm">Thursday</Text>
                                    </View>
                                    <Text className="text-zinc-400 text-sm">Ensure soil is completely dry before watering again</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
