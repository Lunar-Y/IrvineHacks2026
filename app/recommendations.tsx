import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useScanStore, type PlantRecommendation } from '@/lib/store/scanStore';

export default function RecommendationsScreen() {
  const { currentScan } = useScanStore();
  const recommendations: PlantRecommendation[] = currentScan.recommendations ?? [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Your Recommendations</Text>
        <Text style={styles.count}>{recommendations.length} plants for your yard</Text>
        {recommendations.map((rec: PlantRecommendation, i: number) => (
          <View key={i} style={styles.card}>
            <Text style={styles.name}>{rec.common_name}</Text>
            <Text style={styles.scientific}>{rec.scientific_name}</Text>
            {rec.fit_score != null && <Text style={styles.score}>Fit: {rec.fit_score}/100</Text>}
            <Text style={styles.why}>{rec.why_it_fits}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faf8' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#14532d', marginBottom: 4 },
  count: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  card: {
    backgroundColor: '#ecfdf3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  name: { fontSize: 18, fontWeight: '700', color: '#111' },
  scientific: { fontSize: 13, color: '#444', fontStyle: 'italic', marginTop: 2 },
  score: { fontSize: 12, color: '#166534', fontWeight: '600', marginTop: 4 },
  why: { fontSize: 14, color: '#333', marginTop: 6, lineHeight: 20 },
});
