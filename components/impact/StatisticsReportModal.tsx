import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ImpactMetrics, computeOverallScore } from '@/lib/utils/impactMath';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatisticsReportModalProps {
  visible: boolean;
  onDismiss: () => void;
  metrics: ImpactMetrics;
  plantCount: number;
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reportRow}>
      <Text style={styles.reportLabel}>{label}</Text>
      <Text style={styles.reportValue}>{value}</Text>
    </View>
  );
}

export function StatisticsReportModal({
  visible,
  onDismiss,
  metrics,
  plantCount,
}: StatisticsReportModalProps) {
  const overallScore = computeOverallScore(metrics, plantCount);
  const waterSavingsVsGrass =
    plantCount > 0
      ? `${metrics.averageWaterSavingsPercent}% less water vs. equivalent grass lawn`
      : '—';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Statistics Report</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ReportRow label="Overall score" value={`${overallScore}/100`} />
            <ReportRow label="CO₂ sequestered" value={`${metrics.totalCarbonKg} kg/year`} />
            <ReportRow label="Water savings vs. equivalent grass" value={waterSavingsVsGrass} />
            <ReportRow label="Native species" value={`${metrics.nativeCount} plants`} />
            <ReportRow label="Heat reduction (urban cooling)" value={`${metrics.urbanHeatReduction.toFixed(1)}/3 avg`} />
            <ReportRow label="Nitrogen-fixing plants" value={`${metrics.nitrogenFixingCount}`} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18201D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4C8B6B',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F5F7F6',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: '#9FAFAA',
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2F3B36',
  },
  reportLabel: {
    fontSize: 15,
    color: '#9FAFAA',
    flex: 1,
  },
  reportValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F7F6',
    marginLeft: 12,
  },
});
