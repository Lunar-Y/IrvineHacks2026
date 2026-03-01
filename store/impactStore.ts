import { create } from 'zustand';
import { calculateImpact, ImpactMetrics } from '../lib/utils/impactMath';
import { PlantRecommendation } from '../types/plant';
import { SustainabilityClimateContext, SustainabilityProfileKey } from '../lib/utils/sustainabilityScore';

interface ImpactState {
    metrics: ImpactMetrics;
    totalPlants: number;
    recalculateImpact: (
        plants: PlantRecommendation[],
        options?: {
            climateContext?: SustainabilityClimateContext | null;
            forcedProfile?: SustainabilityProfileKey;
        }
    ) => void;
}

export const useImpactStore = create<ImpactState>((set) => ({
    metrics: calculateImpact([]),
    totalPlants: 0,

    recalculateImpact: (plants, options) => set(() => ({
        metrics: calculateImpact(plants, options),
        totalPlants: plants.length,
    })),
}));
