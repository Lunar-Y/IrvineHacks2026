import React, { useEffect, useMemo } from 'react';
import { ScrollView, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OverallScore } from '../../components/impact/OverallScore';
import { CO2ImpactCard } from '../../components/impact/CO2ImpactCard';
import { SquareMetricCard } from '../../components/impact/SquareMetricCard';
import Colors from '../../constants/Colors';
import { calculateImpact } from '../../lib/utils/impactMath';
import { formatCount, formatHeatIndex, formatKg, formatLiters } from '../../lib/utils/impactFormat';
import { useScanStore } from '../../lib/store/scanStore';
import { groupPlacedPlantsByRecommendation, GroupedPlacedPlant } from '../../lib/utils/myPlants';

const PROFILE_LABELS = {
  drought_warrior: 'Drought Warrior',
  eco_system_builder: 'Eco-System Builder',
  urban_cooler: 'Urban Cooler',
} as const;

const METRIC_LABELS = {
  water: 'Water Savings',
  native: 'Native Species',
  heat: 'Heat Reduction',
  nitrogen: 'Nitrogen-Fixing',
  co2: 'CO2 Sequestration',
} as const;

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const { currentScan, placedItems } = useScanStore();
  const recommendations = Array.isArray(currentScan.recommendations) ? currentScan.recommendations : [];
  const groupedPlants = groupPlacedPlantsByRecommendation(placedItems, recommendations);

  const metrics = useMemo(() => {
    // [DEMO_HARDCODED]: Crunching real math on curated mock data for 
    // a perfect statistical "wow factor" in the impact dashboard.
    const plantsToCalculate = groupedPlants.flatMap((group: GroupedPlacedPlant) =>
      Array(group.placedCount).fill(group.plant)
    );
    return calculateImpact(plantsToCalculate, {
      climateContext: {
        estimatedMicroclimate: currentScan.assembledProfile?.estimated_microclimate,
      },
    });
  }, [groupedPlants, currentScan.assembledProfile]);

  const hasData = placedItems.length > 0;
  const emptyValue = '--';

  const metricModules = [
    {
      testID: 'water-module',
      title: 'Water Savings',
      value: hasData ? formatLiters(metrics.waterSavingsVsGrassLiters) : emptyValue,
      descriptor: 'annual estimate vs grass baseline',
      icon: 'water' as const,
    },
    {
      testID: 'native-module',
      title: 'Native Species',
      value: hasData ? formatCount(metrics.nativeCount) : emptyValue,
      descriptor: 'count of native species selected',
      icon: 'native' as const,
    },
    {
      testID: 'heat-module',
      title: 'Heat Reduction',
      value: hasData ? formatHeatIndex(metrics.heatReductionIndex) : emptyValue,
      descriptor: 'cooling index estimate',
      icon: 'heat' as const,
    },
    {
      testID: 'nitrogen-module',
      title: 'Nitrogen-Fixing',
      value: hasData ? formatCount(metrics.nitrogenFixingCount) : emptyValue,
      descriptor: 'soil-enriching species count',
      icon: 'nitrogen' as const,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
      <OverallScore score={metrics.overallScore} hasData={hasData} placeholder={emptyValue} />
      {hasData ? (
        <View style={styles.scoreMeta}>
          <Text style={styles.profileText}>
            Active profile: {PROFILE_LABELS[metrics.scoreProfile as keyof typeof PROFILE_LABELS] || 'Standard'}
          </Text>
          {metrics.scoreBreakdown.map((item) => (
            <View key={item.metricKey} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{METRIC_LABELS[item.metricKey as keyof typeof METRIC_LABELS]}</Text>
              <Text style={styles.breakdownValue}>{item.contribution.toFixed(2)} pts</Text>
            </View>
          ))}
        </View>
      ) : null}

      <CO2ImpactCard
        co2Kg={hasData ? formatKg(metrics.totalCarbonKg) : emptyValue}
        subtext={hasData ? 'Annual sequestration estimate' : 'Add plants to see annual sequestration estimate'}
      />

      <View style={styles.grid}>
        {metricModules.map((module) => (
          <SquareMetricCard
            key={module.testID}
            testID={module.testID}
            title={module.title}
            value={module.value}
            descriptor={module.descriptor}
            icon={module.icon}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lawnLens.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  scoreMeta: {
    marginTop: -16,
    marginBottom: 32,
    backgroundColor: Colors.lawnLens.cardSurface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  profileText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.lawnLens.textPrimary,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.lawnLens.textMuted,
  },
  breakdownValue: {
    fontFamily: 'Sora-SemiBold',
    fontSize: 13,
    color: Colors.lawnLens.textPrimary,
  },
});
