import { PlantRecommendation } from '../../types/plant';
import {
    calculateSustainabilityScore,
    ScoreBreakdownItem,
    SustainabilityClimateContext,
    SustainabilityProfileKey,
} from './sustainabilityScore';

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
    waterSavingsVsGrassLiters: number;
    heatReductionIndex: number;
    overallScore: number;
    scoreProfile: SustainabilityProfileKey;
    scoreBreakdown: ScoreBreakdownItem[];
    scoreVersion: 'v1';
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const calculateImpact = (
    plants: PlantRecommendation[],
    options?: {
        climateContext?: SustainabilityClimateContext | null;
        forcedProfile?: SustainabilityProfileKey;
    }
): ImpactMetrics => {
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
            waterSavingsVsGrassLiters: 0,
            heatReductionIndex: 0,
            overallScore: 0,
            scoreProfile: options?.forcedProfile ?? 'drought_warrior',
            scoreBreakdown: [],
            scoreVersion: 'v1',
        };
    }

    const totals = plants.reduce(
        (acc, plant) => {
            const data = plant.environmental_data;
            const savingsRatio = clamp(data.vs_lawn_water_savings_percent / 100, 0, 0.99);
            const baselineLawnWater = savingsRatio >= 0.99
                ? data.water_usage_liters_per_week * 100
                : data.water_usage_liters_per_week / (1 - savingsRatio);
            const savingsVsLawn = Math.max(0, baselineLawnWater - data.water_usage_liters_per_week);

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
                weeklySavingsLiters: acc.weeklySavingsLiters + savingsVsLawn,
            };
        },
        {
            carbon: 0,
            water: 0,
            savings: 0,
            pollinator: 0,
            biodiversity: 0,
            heat: 0,
            native: 0,
            erosion: 0,
            nitrogen: 0,
            weeklySavingsLiters: 0,
        }
    );

    const count = plants.length;
    const totalCarbonKg = Number(totals.carbon.toFixed(2));
    const totalWaterLiters = Number(totals.water.toFixed(2));
    const averageWaterSavingsPercent = Math.round(totals.savings / count);
    const pollinatorScore = Number((totals.pollinator / count).toFixed(1));
    const biodiversityScore = Number((totals.biodiversity / count).toFixed(1));
    const urbanHeatReduction = Number((totals.heat / count).toFixed(1));
    const nativeCount = totals.native;
    const erosionPreventionCount = totals.erosion;
    const nitrogenFixingCount = totals.nitrogen;
    const waterSavingsVsGrassLiters = Number((totals.weeklySavingsLiters * 52).toFixed(0));

    // Approximate equivalent cooling in degrees F from the 1-3 score scale.
    const heatReductionIndex = Number((((urbanHeatReduction / 3) * 8)).toFixed(1));

    const sustainability = calculateSustainabilityScore(
        {
            totalPlants: count,
            waterSavingsVsGrassLiters,
            nativeCount,
            heatReductionIndex,
            nitrogenFixingCount,
            totalCarbonKg,
        },
        options
    );

    return {
        totalCarbonKg,
        totalWaterLiters,
        averageWaterSavingsPercent,
        pollinatorScore,
        biodiversityScore,
        urbanHeatReduction,
        nativeCount,
        erosionPreventionCount,
        nitrogenFixingCount,
        waterSavingsVsGrassLiters,
        heatReductionIndex,
        overallScore: sustainability.overallScore,
        scoreProfile: sustainability.profile,
        scoreBreakdown: sustainability.breakdown,
        scoreVersion: sustainability.version,
    };
};
