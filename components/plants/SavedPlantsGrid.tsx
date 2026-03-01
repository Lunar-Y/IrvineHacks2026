import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import SavedPlantCard from './SavedPlantCard';

// Dummy data to render 6 skeleton cards
const DUMMY_DATA = Array.from({ length: 6 }).map((_, i) => ({ id: `skeleton-${i}` }));

export default function SavedPlantsGrid() {
    const EmptyHeader = () => (
        <View style={styles.emptyBanner}>
            <Text style={styles.emptyText}>Save plants from your recommendations to see them here.</Text>
        </View>
    );

    return (
        <FlatList
            data={DUMMY_DATA}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={EmptyHeader}
            renderItem={({ item }) => <SavedPlantCard />}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingTop: 16,
        paddingBottom: 40, // Bottom Safe Area Clearance
    },
    columnWrapper: {
        gap: 16, // Column gap: 16
        marginBottom: 16, // Row gap: 16
    },
    emptyBanner: {
        height: 64,
        backgroundColor: '#18201D',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginBottom: 24, // Spacing above the skeleton grid
    },
    emptyText: {
        fontFamily: 'Inter',
        fontWeight: '500', // Medium
        fontSize: 14,
        color: '#9FAFAA',
        textAlign: 'center',
    },
});
