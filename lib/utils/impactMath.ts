import { PlantRecommendation } from '../../types/plant';
import {
    calculateSustainabilityScore,
    ScoreBreakdownItem,
    SustainabilityClimateContext,
    SustainabilityProfileKey,
} from './sustainabilityScore';

/** Minimal plant shape from scan/store when environmental_data is not available */
export interface MinimalPlantForImpact {
    common_name: string;
    scientific_name?: string;
    water_requirement?: 'low' | 'medium' | 'high';
}

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

/**
 * Estimate impact metrics from scan recommendations (no environmental_data).
 * Used when only API/recommendation shape is available.
 */
export const estimateImpactFromMinimalPlants = (
    plants: MinimalPlantForImpact[],
    plantCount?: number
): ImpactMetrics => {
    const count = plantCount ?? (plants?.length ?? 0);
    if (!plants || count === 0) {
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

    let carbon = 0;
    let savingsSum = 0;
    let nativeCount = 0;
    let heatSum = 0;
    let nitrogenCount = 0;
    const nativeKeywords = ['california', 'native', 'sage', 'poppy', 'manzanita', 'ceanothus'];

    plants.slice(0, count).forEach((p) => {
        carbon += 5.2; // ~5.2 kg CO2/year per plant estimate
        const waterReq = p.water_requirement ?? 'medium';
        savingsSum += waterReq === 'low' ? 45 : waterReq === 'medium' ? 25 : 10;
        const name = ((p.common_name ?? '') + ' ' + (p.scientific_name ?? '')).toLowerCase();
        if (nativeKeywords.some((k) => name.includes(k))) nativeCount += 1;
        heatSum += 2; // assume moderate heat reduction
        nitrogenCount += 0; // unknown from minimal data
    });

    return {
        totalCarbonKg: Number((carbon).toFixed(2)),
        totalWaterLiters: 0,
        averageWaterSavingsPercent: Math.round(savingsSum / count),
        pollinatorScore: 2,
        biodiversityScore: 2,
        urbanHeatReduction: Number((heatSum / count).toFixed(1)),
        nativeCount,
        erosionPreventionCount: count,
        nitrogenFixingCount: nitrogenCount,
    };
};

/** Overall impact score 0–100 from metrics (equal weight on normalized factors). */
export const computeOverallScore = (metrics: ImpactMetrics, plantCount: number): number => {
    if (plantCount === 0) return 0;
    const carbonScore = Math.min(100, (metrics.totalCarbonKg / 50) * 100);
    const waterScore = metrics.averageWaterSavingsPercent;
    const nativeScore = Math.min(100, (metrics.nativeCount / Math.max(1, plantCount)) * 100 * 3);
    const heatScore = (metrics.urbanHeatReduction / 3) * 100;
    const nitrogenScore = plantCount > 0 ? (metrics.nitrogenFixingCount / plantCount) * 100 * 2 : 0;
    const raw = (carbonScore + waterScore + nativeScore + heatScore + nitrogenScore) / 5;
    return Math.round(Math.min(100, Math.max(0, raw)));
};
