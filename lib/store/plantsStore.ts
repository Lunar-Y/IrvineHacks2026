import { create } from 'zustand';

interface SavedPlant {
    id: string; // From Supabase
    session_id: string;
    plant_common_name: string;
    plant_scientific_name: string;
    environmental_profile: any;
    recommendation_data: any;
    saved_at: string;
}

interface PlantsState {
    savedPlants: SavedPlant[];
    setSavedPlants: (plants: SavedPlant[]) => void;
    addPlant: (plant: SavedPlant) => void;
    removePlant: (id: string) => void;
    clearPlants: () => void;
}

export const usePlantsStore = create<PlantsState>((set) => ({
    savedPlants: [],
    setSavedPlants: (plants) => set({ savedPlants: plants }),
    addPlant: (plant) => set((state) => ({ savedPlants: [...state.savedPlants, plant] })),
    removePlant: (id) => set((state) => ({ savedPlants: state.savedPlants.filter((p) => p.id !== id) })),
    clearPlants: () => set({ savedPlants: [] }),
}));
