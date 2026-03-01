import { PlantRecommendation } from '../../types/plant';

export interface ImpactMetrics {
    totalCarbonKg: number;
    totalWaterLiters: number;
    averageWaterSavingsPercent: number;
    pollinatorScore: number; // Avg 1-3
    biodiversityScore: number; // Avg 1-3
    urbanHeatReduction: number; // Avg 1-3
    nativeCount: number;
    erosionPreventionCount: number;
    nitrogenFixingCount: number;
}

export const calculateImpact = (plants: PlantRecommendation[]): ImpactMetrics => {
    if (!plants || plants.length === 0) {
        return {
            totalCarbonKg: 0,
            totalWaterLiters: 0,
            averageWaterSavingsPercent: 0,
            pollinatorScore: 0,
            biodiversityScore: 0,
            urbanHeatReduction: 0,
            nativeCount: 0,
            erosionPreventionCount: 0,
            nitrogenFixingCount: 0,
        };
    }

    const totals = plants.reduce(
        (acc, plant) => {
            const data = plant.environmental_data;
            return {
                carbon: acc.carbon + data.carbon_sequestration_kg_per_year,
                water: acc.water + data.water_usage_liters_per_week,
                savings: acc.savings + data.vs_lawn_water_savings_percent,
                pollinator: acc.pollinator + data.pollinator_support_score,
                biodiversity: acc.biodiversity + data.biodiversity_score,
                heat: acc.heat + data.urban_heat_reduction_score,
                native: acc.native + (data.native_species ? 1 : 0),
                erosion: acc.erosion + (data.soil_erosion_prevention ? 1 : 0),
                nitrogen: acc.nitrogen + (data.nitrogen_fixing ? 1 : 0),
            };
        },
        { carbon: 0, water: 0, savings: 0, pollinator: 0, biodiversity: 0, heat: 0, native: 0, erosion: 0, nitrogen: 0 }
    );

    const count = plants.length;

    return {
        totalCarbonKg: Number(totals.carbon.toFixed(2)),
        totalWaterLiters: Number(totals.water.toFixed(2)),
        averageWaterSavingsPercent: Math.round(totals.savings / count),
        pollinatorScore: Number((totals.pollinator / count).toFixed(1)),
        biodiversityScore: Number((totals.biodiversity / count).toFixed(1)),
        urbanHeatReduction: Number((totals.heat / count).toFixed(1)),
        nativeCount: totals.native,
        erosionPreventionCount: totals.erosion,
        nitrogenFixingCount: totals.nitrogen,
    };
};
