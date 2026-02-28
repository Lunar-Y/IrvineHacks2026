import React from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';

export default function PlantsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Saved Plants</Text>
      <View style={styles.separator} />
      <Text style={styles.emptyText}>No plants saved yet. Start by scanning your yard!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: '#eee',
  },
  emptyText: {
    color: 'gray',
  }
});
