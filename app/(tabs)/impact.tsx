import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { OverallScore } from '../../components/impact/OverallScore';
import { CO2ImpactCard } from '../../components/impact/CO2ImpactCard';
import { SquareMetricCard } from '../../components/impact/SquareMetricCard';
import { StatisticsReportModal } from '../../components/impact/StatisticsReportModal';
import Colors from '../../constants/Colors';
import { calculateImpact } from '../../lib/utils/impactMath';
import { formatCount, formatHeatIndex, formatKg, formatLiters } from '../../lib/utils/impactFormat';
import { useScanStore } from '../../lib/store/scanStore';
import { groupPlacedPlantsByRecommendation, GroupedPlacedPlant } from '../../lib/utils/myPlants';

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const { currentScan, placedItems } = useScanStore();
  const [reportVisible, setReportVisible] = useState(false);

  const recommendations = Array.isArray(currentScan.recommendations) ? currentScan.recommendations : [];
  const groupedPlants = groupPlacedPlantsByRecommendation(placedItems, recommendations);

  const metrics = useMemo(() => {
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
  const totalPlants = placedItems.length;

  useFocusEffect(
    useCallback(() => {
      // Auto-show report when focusing this screen for the first time or returning
      setReportVisible(true);
      return () => setReportVisible(false);
    }, [])
  );

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
    backgroundColor: Colors.greenScape.background,
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
});
