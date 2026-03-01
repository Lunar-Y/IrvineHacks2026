import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { OverallScore } from '../../components/impact/OverallScore';
import { CO2ImpactCard } from '../../components/impact/CO2ImpactCard';
import { SquareMetricCard } from '../../components/impact/SquareMetricCard';
import { StatisticsReportModal } from '../../components/impact/StatisticsReportModal';
import { useImpactStore } from '../../store/impactStore';
import { useScanStore } from '../../lib/store/scanStore';

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const { metrics, totalPlants, setMetricsFromMinimalPlants } = useImpactStore();
  const { currentScan } = useScanStore();
  const [reportVisible, setReportVisible] = useState(false);

  // Sync impact metrics from current scan recommendations (or saved plants when available)
  useEffect(() => {
    const recs = currentScan.recommendations;
    if (recs && recs.length > 0) {
      setMetricsFromMinimalPlants(recs);
    }
  }, [currentScan.recommendations, setMetricsFromMinimalPlants]);

  // When user taps the Impact tab (navbar), show the statistics report immediately
  useFocusEffect(
    useCallback(() => {
      setReportVisible(true);
      return () => setReportVisible(false);
    }, [])
  );

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

      <TouchableOpacity
        style={styles.statisticsButton}
        onPress={() => setReportVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.statisticsButtonText}>View Statistics Report</Text>
      </TouchableOpacity>

      <StatisticsReportModal
        visible={reportVisible}
        onDismiss={() => setReportVisible(false)}
        metrics={metrics}
        plantCount={totalPlants}
      />
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
  statisticsButton: {
    marginTop: 24,
    backgroundColor: '#2F6B4F',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  statisticsButtonText: {
    color: '#F5F7F6',
    fontSize: 16,
    fontWeight: '700',
  },
});
