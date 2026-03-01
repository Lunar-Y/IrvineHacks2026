import { create } from 'zustand';
import { MOCK_RECOMMENDATIONS } from '@/lib/mock/mockRecommendations';

export interface EnvironmentalProfile {
  coordinates: { lat: number; lng: number };
  elevation_meters: number;
  usda_hardiness_zone: string;
  current_temp_celsius: number;
  annual_avg_rainfall_mm: number;
  soil_texture: string;
  soil_drainage: string;
  soil_ph_range: { min: number; max: number };
  sun_exposure: string;
  estimated_slope: string;
  detected_existing_plants: string[];
}

// Matches the JSON shape returned by the get-recommendations Edge Function
export interface PlantRecommendation {
  common_name: string;
  scientific_name: string;
  why_it_fits: string;
  mature_height_meters: number;
  water_requirement: 'low' | 'medium' | 'high';
  is_toxic_to_pets: boolean;
  care_tip: string;
  // Optional richer fields if present in the response
  model_archetype?: string;
  water_usage_liters_per_week?: number;
  image_url?: string;
  care_difficulty?: 'easy' | 'moderate' | 'hard';
  environmental_data?: {
    carbon_sequestration_kg_per_year: number;
    water_usage_liters_per_week: number;
    vs_lawn_water_savings_percent: number;
    native_species: boolean;
    pollinator_support_score: number;
    biodiversity_score: number;
    urban_heat_reduction_score: number;
    soil_erosion_prevention: boolean;
    nitrogen_fixing: boolean;
  };
}

export type ScanStatus = 'idle' | 'scanning' | 'analyzing' | 'recommending' | 'complete' | 'error';

export interface AssembledProfile {
  coordinates: { lat: number; lng: number };
  hardiness_zone?: string;
  estimated_sun_exposure?: string;
  estimated_microclimate?: string;
  soil?: { soil_texture?: string; drainage?: string };
  source?: string;
}

export interface PlacedItemData {
  id: number;
  archetype: string;
  pos: [number, number, number];
  plantIndex: number;
  speciesScientificName?: string;
  speciesCommonName?: string;
  imageUrl?: string;
  waterRequirement?: 'low' | 'medium' | 'high';
  matureHeightMeters?: number;
  isToxicToPets?: boolean;
}

interface ScanStore {
  currentScan: {
    id: string | null;
    imageUri: string | null;
    status: ScanStatus;
    recommendations: PlantRecommendation[];
    assembledProfile: AssembledProfile | null;
  };
  setScanStatus: (status: ScanStatus) => void;
  setScanImage: (uri: string) => void;
  setRecommendations: (recs: PlantRecommendation[]) => void;
  setAssembledProfile: (profile: AssembledProfile | null) => void;
  activeRecommendationIndex: number | null;
  setActiveRecommendationIndex: (index: number | null) => void;
  lastHorizontalIndex: number;
  setLastHorizontalIndex: (index: number) => void;
  getActiveRecommendation: () => PlantRecommendation | null;
  resetScan: () => void;

  placedPlantCounts: Record<string, number>;
  placedItems: PlacedItemData[];
  addPlacedItem: (item: PlacedItemData) => void;
  clearPlacedPlants: () => void;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  currentScan: {
    id: null,
    imageUri: null,
    status: 'idle',
    recommendations: [],
    assembledProfile: null,
  },
  setScanStatus: (status) => set((state) => ({ currentScan: { ...state.currentScan, status } })),
  setScanImage: (uri) => set((state) => ({ currentScan: { ...state.currentScan, imageUri: uri } })),
  setRecommendations: (_recs) => set((state) => ({
    currentScan: {
      ...state.currentScan,
      // [DEMO_HARDCODED]: Force mock plants even if scan fails or returns different data
      recommendations: MOCK_RECOMMENDATIONS
    }
  })),
  setAssembledProfile: (assembledProfile) => set((state) => ({ currentScan: { ...state.currentScan, assembledProfile } })),
  activeRecommendationIndex: null,
  setActiveRecommendationIndex: (index) => set({ activeRecommendationIndex: index }),
  lastHorizontalIndex: 0,
  setLastHorizontalIndex: (index) => set({ lastHorizontalIndex: index }),
  getActiveRecommendation: () => {
    const state = get();
    const index = state.activeRecommendationIndex;
    const recommendations = state.currentScan.recommendations;
    if (!Number.isInteger(index) || index === null || index < 0 || index >= recommendations.length) {
      return null;
    }
    return recommendations[index];
  },
  resetScan: () => set({
    currentScan: {
      id: null,
      imageUri: null,
      status: 'idle',
      recommendations: [],
      assembledProfile: null,
    },
    activeRecommendationIndex: null,
    lastHorizontalIndex: 0,
  }),

  placedPlantCounts: {},
  placedItems: [],
  addPlacedItem: (item) => set((state) => ({
    placedItems: [...state.placedItems, item],
    placedPlantCounts: {
      ...state.placedPlantCounts,
      [item.archetype]: (state.placedPlantCounts[item.archetype] || 0) + 1,
    }
  })),
  clearPlacedPlants: () => set({ placedPlantCounts: {}, placedItems: [] }),
}));
