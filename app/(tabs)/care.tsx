import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CareScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Care Dashboard</Text>
      <View style={styles.separator} />
      <Text style={styles.emptyText}>Weekly tasks for your yard will appear here.</Text>
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
