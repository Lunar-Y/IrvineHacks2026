import { create } from 'zustand';

interface ImpactMetrics {
    totalCo2SequesteredKg: number;
    waterSavingsLiters: number;
    biodiversityScore: number;
}

interface ImpactState {
    metrics: ImpactMetrics;
    setMetrics: (metrics: ImpactMetrics) => void;
    addImpact: (additionalMetrics: ImpactMetrics) => void;
    recalculateFromPlants: (plantsData: any[]) => void;
}

export const useImpactStore = create<ImpactState>((set) => ({
    metrics: {
        totalCo2SequesteredKg: 0,
        waterSavingsLiters: 0,
        biodiversityScore: 0,
    },
    setMetrics: (metrics) => set({ metrics }),
    addImpact: (additionalMetrics) =>
        set((state) => ({
            metrics: {
                totalCo2SequesteredKg: state.metrics.totalCo2SequesteredKg + additionalMetrics.totalCo2SequesteredKg,
                waterSavingsLiters: state.metrics.waterSavingsLiters + additionalMetrics.waterSavingsLiters,
                biodiversityScore: state.metrics.biodiversityScore + additionalMetrics.biodiversityScore,
            },
        })),
    recalculateFromPlants: (plantsData) => {
        // This will be implemented more robustly when plant data shape is concrete
        let newMetrics = {
            totalCo2SequesteredKg: 0,
            waterSavingsLiters: 0,
            biodiversityScore: 0,
        };
        // Example theoretical calculation here
        set({ metrics: newMetrics });
    },
}));
