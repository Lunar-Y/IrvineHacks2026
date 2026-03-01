import { create } from 'zustand';
import { usePlantsStore } from './plantsStore';
import { calculateImpact, ImpactMetrics } from '../lib/utils/impactMath';
import { PlantRecommendation } from '../types/plant';

interface ImpactState {
    metrics: ImpactMetrics;
    totalPlants: number;
    // This computes stats based on a given array of plants (e.g., the user's placed + saved plants)
    recalculateImpact: (plants: PlantRecommendation[]) => void;
}

export const useImpactStore = create<ImpactState>((set) => ({
    metrics: calculateImpact([]),
    totalPlants: 0,

    recalculateImpact: (plants) => set(() => ({
        metrics: calculateImpact(plants),
        totalPlants: plants.length,
    }))
}));
