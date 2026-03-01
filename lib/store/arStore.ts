import { create } from 'zustand';

export interface ARPlacedPlant {
  id: string; // Unique ID for this placed instance (UUID or timestamp)
  plantId: string; // The index or ID of the recommendation
  modelUrl: string | null; // Placeholder for actual 3D model path later
  position: [number, number, number]; // [x, y, z] in 3D AR space
  scale: [number, number, number];
}

interface ARDropPayload {
  plantId: string;
  dropX: number; // 2D Screen Touch X
  dropY: number; // 2D Screen Touch Y
}

interface ARStore {
  // Queue of plants that have been dropped on 2D screen but not yet raycasted to 3D
  pendingDrops: ARDropPayload[];
  // Plants that are actively in the 3D scene
  placedPlants: ARPlacedPlant[];
  
  // Actions
  queueDrop: (payload: ARDropPayload) => void;
  consumeDrop: (index: number) => void;
  addPlacedPlant: (plant: ARPlacedPlant) => void;
  removePlacedPlant: (id: string) => void;
  clearARSession: () => void;
}

export const useARStore = create<ARStore>((set) => ({
  pendingDrops: [],
  placedPlants: [],
  
  queueDrop: (payload) => 
    set((state) => ({ pendingDrops: [...state.pendingDrops, payload] })),
    
  consumeDrop: (index) =>
    set((state) => ({ 
      pendingDrops: state.pendingDrops.filter((_, i) => i !== index) 
    })),
    
  addPlacedPlant: (plant) =>
    set((state) => ({ placedPlants: [...state.placedPlants, plant] })),
    
  removePlacedPlant: (id) =>
    set((state) => ({ placedPlants: state.placedPlants.filter(p => p.id !== id) })),
    
  clearARSession: () =>
    set({ pendingDrops: [], placedPlants: [] }),
}));
