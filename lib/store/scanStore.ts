import { create } from 'zustand';

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
  model_asset?: any;
}

interface ScanStore {
  currentScan: {
    id: string | null;
    imageUri: string | null;
    status: 'idle' | 'scanning' | 'analyzing' | 'recommending' | 'complete' | 'error';
    assembledProfile: Record<string, unknown> | null;
  };
  recommendations: PlantRecommendation[];
  setScanStatus: (status: ScanStore['currentScan']['status']) => void;
  setScanImage: (uri: string) => void;
  setAssembledProfile: (profile: Record<string, unknown>) => void;
  setRecommendations: (plants: PlantRecommendation[]) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  currentScan: {
    id: null,
    imageUri: null,
    status: 'idle',
    assembledProfile: null,
  },
  recommendations: [],
  setScanStatus: (status) =>
    set((state) => ({ currentScan: { ...state.currentScan, status } })),
  setScanImage: (uri) =>
    set((state) => ({ currentScan: { ...state.currentScan, imageUri: uri } })),
  setAssembledProfile: (profile) =>
    set((state) => ({ currentScan: { ...state.currentScan, assembledProfile: profile } })),
  setRecommendations: (plants) => set({ recommendations: plants }),
  resetScan: () =>
    set({
      currentScan: { id: null, imageUri: null, status: 'idle', assembledProfile: null },
      recommendations: [],
    }),
}));
