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

interface ScanStore {
  currentScan: {
    id: string | null;
    imageUri: string | null;
    status: 'idle' | 'scanning' | 'analyzing' | 'complete' | 'error';
  };
  setScanStatus: (status: 'idle' | 'scanning' | 'analyzing' | 'complete' | 'error') => void;
  setScanImage: (uri: string) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  currentScan: {
    id: null,
    imageUri: null,
    status: 'idle',
  },
  setScanStatus: (status) => set((state) => ({ currentScan: { ...state.currentScan, status } })),
  setScanImage: (uri) => set((state) => ({ currentScan: { ...state.currentScan, imageUri: uri } })),
  resetScan: () => set({ currentScan: { id: null, imageUri: null, status: 'idle' } }),
}));
