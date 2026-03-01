import { create } from 'zustand';
import { calculateImpact, estimateImpactFromMinimalPlants, ImpactMetrics, MinimalPlantForImpact } from '../lib/utils/impactMath';
import { PlantRecommendation } from '../types/plant';
import { SustainabilityClimateContext, SustainabilityProfileKey } from '../lib/utils/sustainabilityScore';

interface ImpactState {
    metrics: ImpactMetrics;
    totalPlants: number;
    /** Recompute from full plant data (with environmental_data). */
    recalculateImpact: (
        plants: PlantRecommendation[],
        options?: {
            climateContext?: SustainabilityClimateContext | null;
            forcedProfile?: SustainabilityProfileKey;
        }
    ) => void;
    /** Set metrics directly (e.g. from estimated impact). */
    setMetrics: (metrics: ImpactMetrics, plantCount: number) => void;
    /** Estimate and set metrics from scan-style recommendations (no environmental_data). */
    setMetricsFromMinimalPlants: (plants: MinimalPlantForImpact[]) => void;
}

export const useImpactStore = create<ImpactState>((set) => ({
    metrics: calculateImpact([]),
    totalPlants: 0,

    recalculateImpact: (plants, options) => set(() => ({
        metrics: calculateImpact(plants, options),
        totalPlants: plants.length,
    })),

    setMetrics: (metrics, plantCount) => set({ metrics, totalPlants: plantCount }),

    setMetricsFromMinimalPlants: (plants) => set(() => ({
        metrics: estimateImpactFromMinimalPlants(plants),
        totalPlants: plants?.length ?? 0,
    })),
}));
