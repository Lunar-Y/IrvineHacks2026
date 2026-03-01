import {
  calculateSustainabilityScore,
  resolveSustainabilityProfile,
  SCORING_TARGETS_V1,
} from './sustainabilityScore';

describe('sustainabilityScore', () => {
  const baseInput = {
    totalPlants: 5,
    waterSavingsVsGrassLiters: 9000,
    nativeCount: 3,
    heatReductionIndex: 4,
    nitrogenFixingCount: 2,
    totalCarbonKg: 10,
  };

  it('applies drought warrior weights deterministically', () => {
    const result = calculateSustainabilityScore(baseInput, { forcedProfile: 'drought_warrior' });
    expect(result.profile).toBe('drought_warrior');
    expect(result.breakdown.map((i) => i.metricKey)).toEqual(['water', 'native', 'heat']);
    expect(result.overallScore).toBe(58);
  });

  it('keeps scores clamped in [0, 100]', () => {
    const result = calculateSustainabilityScore({
      totalPlants: 1,
      waterSavingsVsGrassLiters: SCORING_TARGETS_V1.waterSavingsVsGrassLiters * 10,
      nativeCount: 10,
      heatReductionIndex: SCORING_TARGETS_V1.heatReductionIndex * 10,
      nitrogenFixingCount: 10,
      totalCarbonKg: SCORING_TARGETS_V1.totalCarbonKg * 10,
    }, { forcedProfile: 'urban_cooler' });

    expect(result.overallScore).toBe(100);
  });

  it('falls back to drought warrior when climate context is missing', () => {
    expect(resolveSustainabilityProfile(undefined)).toBe('drought_warrior');
    expect(resolveSustainabilityProfile(null)).toBe('drought_warrior');
  });

  it('selects profiles from climate hints', () => {
    expect(resolveSustainabilityProfile({ annualAvgRainfallMm: 200 })).toBe('drought_warrior');
    expect(resolveSustainabilityProfile({ currentTempCelsius: 33 })).toBe('urban_cooler');
    expect(resolveSustainabilityProfile({ annualAvgRainfallMm: 900, currentTempCelsius: 22 })).toBe('eco_system_builder');
  });
});
