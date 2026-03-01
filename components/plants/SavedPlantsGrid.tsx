import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import SavedPlantCard from './SavedPlantCard';
import { useScanStore } from '@/lib/store/scanStore';
import { groupPlacedPlantsByRecommendation } from '@/lib/utils/myPlants';

export default function SavedPlantsGrid() {
  const { placedItems, currentScan } = useScanStore();
  const recommendations = Array.isArray(currentScan.recommendations) ? currentScan.recommendations : [];
  const groupedPlants = groupPlacedPlantsByRecommendation(placedItems, recommendations);

  const EmptyHeader = () => (
    <View style={styles.emptyBanner}>
      <Text style={styles.emptyText}>Place plants from your recommendations to see them here.</Text>
    </View>
  );

  return (
    <FlatList
      data={groupedPlants}
      numColumns={2}
      keyExtractor={(item) => item.speciesKey}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={groupedPlants.length > 1 ? styles.columnWrapper : undefined}
      ListHeaderComponent={groupedPlants.length === 0 ? EmptyHeader : null}
      renderItem={({ item }) => {
        const plant = item.plant;
        return (
          <View style={styles.cardWrap}>
            <SavedPlantCard
              commonName={plant.common_name?.trim() || 'Unknown plant'}
              scientificName={plant.scientific_name?.trim() || 'Unknown species'}
              waterRequirement={plant.water_requirement}
              matureHeightMeters={plant.mature_height_meters}
              isToxicToPets={plant.is_toxic_to_pets}
              imageUrl={plant.image_url}
              placedCount={item.placedCount}
            />
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={null}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  columnWrapper: {
    gap: 16,
  },
  cardWrap: {
    width: '48%',
  },
  emptyBanner: {
    height: 64,
    backgroundColor: '#18201D',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#9FAFAA',
    textAlign: 'center',
  },
});
