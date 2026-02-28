import React from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';

const calculateImpact = (plants: any[]) => {
  const co2 = plants.reduce((acc, p) => acc + (p.co2_kg || 5.2), 0);
  const water = plants.reduce((acc, p) => acc + (p.water_savings || 120), 0);
  const biodiversity = plants.length * 3;

  return { co2, water, biodiversity };
};

export default function EnvironmentStats({ savedPlants = [] }: { savedPlants?: any[] }) {
  const stats = calculateImpact(savedPlants);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Yard's Impact</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>CO2 Sequestered/Year</Text>
        <Text style={styles.value}>{stats.co2.toFixed(1)} kg</Text>
        <Text style={styles.subtext}>Equivalent to {Math.round(stats.co2 * 2.5)} miles driven</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Weekly Water Savings</Text>
        <Text style={styles.value}>{stats.water} Liters</Text>
        <Text style={styles.subtext}>Vs. equivalent area of grass lawn</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Biodiversity Score</Text>
        <Text style={styles.value}>{stats.biodiversity}/100</Text>
        <Text style={styles.subtext}>Supporting native species & pollinators</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2e7d32',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  subtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
});
