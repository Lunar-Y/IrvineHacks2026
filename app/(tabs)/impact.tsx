import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OverallScore } from '../../components/impact/OverallScore';
import { CO2ImpactCard } from '../../components/impact/CO2ImpactCard';
import { SquareMetricCard } from '../../components/impact/SquareMetricCard';

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
      <OverallScore />

      <CO2ImpactCard />

      {/* 2x2 Grid */}
      <View style={styles.grid}>
        <SquareMetricCard title="Water Savings" />
        <SquareMetricCard title="Biodiversity" />
        <SquareMetricCard title="Urban Cooling" />
        <SquareMetricCard title="Soil Health" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1412',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Bottom Safe Area space + Tab Bar Height
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16, // Grid Gutter
  },
});
