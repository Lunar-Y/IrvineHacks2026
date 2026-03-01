export type SustainabilityMetricKey = 'water' | 'native' | 'heat' | 'nitrogen' | 'co2';

export type SustainabilityProfileKey =
  | 'drought_warrior'
  | 'eco_system_builder'
  | 'urban_cooler';

export interface ScoreBreakdownItem {
  metricKey: SustainabilityMetricKey;
  weight: number;
  normalized: number;
  contribution: number;
}

export interface SustainabilityScoreResult {
  overallScore: number;
  profile: SustainabilityProfileKey;
  breakdown: ScoreBreakdownItem[];
  version: 'v1';
}

export interface SustainabilityClimateContext {
  annualAvgRainfallMm?: number;
  currentTempCelsius?: number;
  estimatedMicroclimate?: string;
}

export interface SustainabilityMetricInput {
  totalPlants: number;
  waterSavingsVsGrassLiters: number;
  nativeCount: number;
  heatReductionIndex: number;
  nitrogenFixingCount: number;
  totalCarbonKg: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const normalizeByTarget = (value: number, target: number): number => clamp(value / target, 0, 1);

export const SCORING_TARGETS_V1 = {
  waterSavingsVsGrassLiters: 15000,
  heatReductionIndex: 8,
  totalCarbonKg: 50,
} as const;

const PROFILE_WEIGHTS: Record<SustainabilityProfileKey, Record<SustainabilityMetricKey, number>> = {
  drought_warrior: {
    water: 0.5,
    native: 0.3,
    heat: 0.2,
    nitrogen: 0,
    co2: 0,
  },
  eco_system_builder: {
    water: 0,
    native: 0.35,
    heat: 0,
    nitrogen: 0.45,
    co2: 0.2,
  },
  urban_cooler: {
    water: 0.2,
    native: 0,
    heat: 0.5,
    nitrogen: 0,
    co2: 0.3,
  },
};

const getNormalizedMetrics = (input: SustainabilityMetricInput): Record<SustainabilityMetricKey, number> => {
  const plantCount = Math.max(1, input.totalPlants);

  return {
    water: normalizeByTarget(input.waterSavingsVsGrassLiters, SCORING_TARGETS_V1.waterSavingsVsGrassLiters),
    native: normalizeByTarget(input.nativeCount, plantCount),
    heat: normalizeByTarget(input.heatReductionIndex, SCORING_TARGETS_V1.heatReductionIndex),
    nitrogen: normalizeByTarget(input.nitrogenFixingCount, plantCount),
    co2: normalizeByTarget(input.totalCarbonKg, SCORING_TARGETS_V1.totalCarbonKg),
  };
};

export const resolveSustainabilityProfile = (
  climateContext?: SustainabilityClimateContext | null
): SustainabilityProfileKey => {
  if (!climateContext) return 'drought_warrior';

  const rainfall = climateContext.annualAvgRainfallMm;
  const temp = climateContext.currentTempCelsius;
  const micro = (climateContext.estimatedMicroclimate || '').toLowerCase();

  const droughtLike = (typeof rainfall === 'number' && rainfall > 0 && rainfall < 450)
    || micro.includes('arid')
    || micro.includes('dry')
    || micro.includes('drought');
  if (droughtLike) return 'drought_warrior';

  const urbanHeatLike = (typeof temp === 'number' && temp >= 30)
    || micro.includes('urban')
    || micro.includes('heat')
    || micro.includes('hot');
  if (urbanHeatLike) return 'urban_cooler';

  return 'eco_system_builder';
};

export const calculateSustainabilityScore = (
  input: SustainabilityMetricInput,
  options?: {
    forcedProfile?: SustainabilityProfileKey;
    climateContext?: SustainabilityClimateContext | null;
  }
): SustainabilityScoreResult => {
  const profile = options?.forcedProfile ?? resolveSustainabilityProfile(options?.climateContext);
  const weights = PROFILE_WEIGHTS[profile];
  const normalizedMetrics = getNormalizedMetrics(input);

  const breakdown = (Object.keys(weights) as SustainabilityMetricKey[])
    .filter((metricKey) => weights[metricKey] > 0)
    .map((metricKey) => {
      const normalized = normalizedMetrics[metricKey];
      const weight = weights[metricKey];
      return {
        metricKey,
        weight,
        normalized: Number(normalized.toFixed(4)),
        contribution: Number((weight * normalized * 100).toFixed(2)),
      };
    });

  const weightSum = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = breakdown.reduce((sum, item) => sum + (item.weight * item.normalized), 0);
  const overallScore = Math.round(clamp((weightSum > 0 ? (weightedSum / weightSum) : 0) * 100, 0, 100));

  return {
    overallScore,
    profile,
    breakdown,
    version: 'v1',
  };
};
