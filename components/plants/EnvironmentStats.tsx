import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useImpactStore } from '../../store/impactStore';
import { ImpactShareCard } from './ImpactShareCard';
import { useCardsShareImage } from './useCardsShareImage';

export const EnvironmentStats = () => {
  const { metrics, totalPlants } = useImpactStore();
  const { shareRef, captureAndShare } = useCardsShareImage();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Yard's Impact</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.statGroup}>
            <Text style={styles.value}>{metrics.totalCarbonKg} kg</Text>
            <Text style={styles.label}>CO₂ Sequestered</Text>
          </View>
          <View style={styles.statGroup}>
            <Text style={styles.value}>{metrics.averageWaterSavingsPercent}%</Text>
            <Text style={styles.label}>Water Savings</Text>
          </View>
        </View>

        <View style={[styles.row, styles.marginTop]}>
          <View style={styles.statGroup}>
            <Text style={styles.value}>{metrics.biodiversityScore}/3</Text>
            <Text style={styles.label}>Biodiversity</Text>
          </View>
          <View style={styles.statGroup}>
            <Text style={styles.value}>{metrics.nativeCount}</Text>
            <Text style={styles.label}>Native Plants</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={captureAndShare}>
        <Text style={styles.shareText}>Share Impact Score</Text>
      </TouchableOpacity>

      {/* Hidden layer for rendering the share image */}
      <ImpactShareCard innerRef={shareRef} metrics={metrics} totalPlants={totalPlants} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marginTop: {
    marginTop: 24,
  },
  statGroup: {
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
