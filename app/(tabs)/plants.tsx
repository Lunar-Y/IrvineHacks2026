import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import SavedPlantsGrid from '@/components/plants/SavedPlantsGrid';

export default function PlantsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>

        {/* Top App Bar */}
        <View style={styles.appBar}>
          <Text style={styles.headerTitle}>Saved Plants</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="menu" size={24} color="#9FAFAA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="filter" size={24} color="#9FAFAA" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Row */}
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#9FAFAA" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved plants"
            placeholderTextColor="#9FAFAA"
            editable={false} // Readonly for visual test state
          />
        </View>

        {/* Grid and States */}
        <View style={styles.gridContainer}>
          <SavedPlantsGrid />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1412', // Page root background
  },
  container: {
    flex: 1,
    paddingHorizontal: 20, // Canvas Padding
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // Top app bar spacing to next section
    // Background matches safe area inherently
  },
  headerTitle: {
    fontFamily: 'Sora',
    fontWeight: '600', // SemiBold
    fontSize: 28,
    color: '#F5F7F6',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    height: 44,
    backgroundColor: '#18201D',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16, // Search row bottom spacing
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500', // Medium
    fontSize: 14,
    color: '#F5F7F6',
  },
  gridContainer: {
    flex: 1,
    paddingBottom: 100, // Safe Area + Tab Bar Space
  },
});
