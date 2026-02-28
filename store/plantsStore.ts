import { create } from 'zustand';
import { PlantRecommendation, PlantPlacement } from '../types/plant';

// MOCK DATA for Checkpoint 1
export const MOCK_RECOMMENDATIONS: PlantRecommendation[] = [
    {
        id: 'mock-1',
        rank: 1,
        common_name: 'Creeping Thyme',
        scientific_name: 'Thymus serpyllum',
        model_archetype: 'groundcover',
        mature_height_meters: 0.1,
        mature_width_meters: 0.5,
        why_it_fits: 'Excellent drought-tolerant groundcover that thrives in your sunny slopes.',
        care_difficulty: 'easy',
        watering_frequency_days: 7,
        sunlight_requirement: 'full_sun',
        image_urls: ['https://images.unsplash.com/photo-1595166677937-236b283df8e7?auto=format&fit=crop&q=80&w=400'],
        environmental_data: {
            carbon_sequestration_kg_per_year: 0.5,
            water_usage_liters_per_week: 2,
            vs_lawn_water_savings_percent: 85,
            native_species: false,
            pollinator_support_score: 3,
            biodiversity_score: 2,
            urban_heat_reduction_score: 1,
            soil_erosion_prevention: true,
            nitrogen_fixing: false,
        }
    },
    {
        id: 'mock-2',
        rank: 2,
        common_name: 'Blue Grama Grass',
        scientific_name: 'Bouteloua gracilis',
        model_archetype: 'ornamental_grass',
        mature_height_meters: 0.4,
        mature_width_meters: 0.3,
        why_it_fits: 'A very tough native grass that needs almost zero supplemental water once established.',
        care_difficulty: 'easy',
        watering_frequency_days: 14,
        sunlight_requirement: 'full_sun',
        image_urls: ['https://images.unsplash.com/photo-1598424915609-b68c9cf0bde5?auto=format&fit=crop&q=80&w=400'],
        environmental_data: {
            carbon_sequestration_kg_per_year: 1.2,
            water_usage_liters_per_week: 1,
            vs_lawn_water_savings_percent: 95,
            native_species: true,
            pollinator_support_score: 1,
            biodiversity_score: 2,
            urban_heat_reduction_score: 1,
            soil_erosion_prevention: true,
            nitrogen_fixing: false,
        }
    },
    {
        id: 'mock-3',
        rank: 3,
        common_name: 'Lavender',
        scientific_name: 'Lavandula angustifolia',
        model_archetype: 'flowering_shrub',
        mature_height_meters: 0.8,
        mature_width_meters: 0.8,
        why_it_fits: 'Loves the well-drained soil detected in your yard and attracts tons of pollinators.',
        care_difficulty: 'moderate',
        watering_frequency_days: 10,
        sunlight_requirement: 'full_sun',
        image_urls: ['https://images.unsplash.com/photo-1498679367468-2029bf784a95?auto=format&fit=crop&q=80&w=400'],
        environmental_data: {
            carbon_sequestration_kg_per_year: 2.5,
            water_usage_liters_per_week: 4,
            vs_lawn_water_savings_percent: 60,
            native_species: false,
            pollinator_support_score: 3,
            biodiversity_score: 3,
            urban_heat_reduction_score: 2,
            soil_erosion_prevention: false,
            nitrogen_fixing: false,
        }
    }
];

interface PlantsState {
    recommendations: PlantRecommendation[];
    placedPlants: PlantPlacement[];
    savedPlants: PlantRecommendation[];

    addPlacedPlant: (plantId: string, position: [number, number, number]) => void;
    removePlacedPlant: (placementId: string) => void;
    clearPlacedPlants: () => void;
    savePlant: (plantId: string) => void;
    unsavePlant: (plantId: string) => void;
}

export const usePlantsStore = create<PlantsState>((set) => ({
    recommendations: MOCK_RECOMMENDATIONS,
    placedPlants: [],
    savedPlants: [],

    addPlacedPlant: (plantId, position) => set((state) => ({
        placedPlants: [...state.placedPlants, {
            id: Math.random().toString(36).substring(7),
            plant_id: plantId,
            position
        }]
    })),

    removePlacedPlant: (placementId) => set((state) => ({
        placedPlants: state.placedPlants.filter(p => p.id !== placementId)
    })),

    clearPlacedPlants: () => set({ placedPlants: [] }),

    savePlant: (plantId) => set((state) => {
        const plant = state.recommendations.find(p => p.id === plantId);
        if (!plant || state.savedPlants.some(p => p.id === plantId)) return state;
        return { savedPlants: [...state.savedPlants, plant] };
    }),

    unsavePlant: (plantId) => set((state) => ({
        savedPlants: state.savedPlants.filter(p => p.id !== plantId)
    }))
}));
