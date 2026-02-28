import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Modal, SafeAreaView, Text } from 'react-native';
import { PlantCard } from '../../components/plants/PlantCard';
import { PlantDetail } from '../../components/plants/PlantDetail';
import { usePlantsStore } from '../../store/plantsStore';

export default function ScanScreen() {
  const { recommendations } = usePlantsStore();

  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const handleDragToPlace = () => {
    console.log(`Transitioning to AR to place ${selectedPlantId}`);
    setSelectedPlantId(null);
    // TODO: Navigation to AR mode mapped in Checkpoint 4
  };

  const selectedPlant = recommendations.find(p => p.id === selectedPlantId);

  return (
    <SafeAreaView style={styles.container}>
      {/* 
        This View acts as a placeholder for the live camera feed 
        built by Part 2/3.
      */}
      <View style={styles.dummyCameraFeed}>
        <Text style={styles.cameraText}>Live Camera Feed Placeholder</Text>
      </View>

      {/* Bottom Sheet overlay for Recommendations */}
      <View style={styles.bottomSheet}>
        <View style={styles.header}>
          <Text style={styles.title}>6 plants for your yard</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>Zone 7b</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>Partial Shade</Text></View>
          </View>
        </View>

        <View style={styles.flatListWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={recommendations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <PlantCard
                plant={item}
                onPress={setSelectedPlantId}
                onDragStart={() => console.log('Gesture Drag triggered')}
              />
            )}
          />
        </View>
      </View>

      {/* Modals placed at root level */}
      <Modal
        visible={!!selectedPlantId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPlantId(null)}
      >
        {selectedPlant && (
          <View style={styles.modalOverlay}>
            <PlantDetail
              plant={selectedPlant}
              onClose={() => setSelectedPlantId(null)}
              onDragToPlace={handleDragToPlace}
            />
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  dummyCameraFeed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: {
    color: '#64748B',
    fontSize: 18,
    fontFamily: 'monospace',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  flatListWrapper: {
    minHeight: 120, // To ensure cards don't collapse if empty
  },
  listContent: {
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  }
});
