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

interface ScanStore {
  currentScan: {
    id: string | null;
    imageUri: string | null;
    status: ScanStatus;
    recommendations: PlantRecommendation[];
    assembledProfile: AssembledProfile | null;
    errorMessage: string | null;
  };
  setScanStatus: (status: ScanStatus) => void;
  setScanImage: (uri: string) => void;
  setRecommendations: (recs: PlantRecommendation[]) => void;
  setAssembledProfile: (profile: AssembledProfile | null) => void;
  setScanError: (message: string | null) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  currentScan: {
    id: null,
    imageUri: null,
    status: 'idle',
    recommendations: [],
    assembledProfile: null,
    errorMessage: null,
  },
  setScanStatus: (status) => set((state) => ({
    currentScan: {
      ...state.currentScan,
      status,
      ...(status === 'idle' ? { errorMessage: null } : {}),
    },
  })),
  setScanImage: (uri) => set((state) => ({ currentScan: { ...state.currentScan, imageUri: uri } })),
  setRecommendations: (recommendations) => set((state) => ({ currentScan: { ...state.currentScan, recommendations } })),
  setAssembledProfile: (assembledProfile) => set((state) => ({ currentScan: { ...state.currentScan, assembledProfile } })),
  setScanError: (errorMessage) => set((state) => ({ currentScan: { ...state.currentScan, errorMessage } })),
  resetScan: () => set({
    currentScan: {
      id: null,
      imageUri: null,
      status: 'idle',
      recommendations: [],
      assembledProfile: null,
      errorMessage: null,
    },
  }),
}));
