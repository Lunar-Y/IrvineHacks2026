import { calculateImpact } from './impactMath';
import { MOCK_RECOMMENDATIONS } from '../../store/plantsStore';
import { formatCount, formatHeatIndex, formatKg, formatLiters } from './impactFormat';

describe('impactMath', () => {
    it('correctly calculates impact for empty array', () => {
        const result = calculateImpact([]);
        expect(result.totalCarbonKg).toBe(0);
        expect(result.totalWaterLiters).toBe(0);
        expect(result.averageWaterSavingsPercent).toBe(0);
        expect(result.pollinatorScore).toBe(0);
        expect(result.biodiversityScore).toBe(0);
        expect(result.urbanHeatReduction).toBe(0);
        expect(result.nativeCount).toBe(0);
        expect(result.erosionPreventionCount).toBe(0);
        expect(result.nitrogenFixingCount).toBe(0);
        expect(result.waterSavingsVsGrassLiters).toBe(0);
        expect(result.heatReductionIndex).toBe(0);
        expect(result.overallScore).toBe(0);
        expect(result.scoreProfile).toBe('drought_warrior');
        expect(result.scoreBreakdown).toEqual([]);
        expect(result.scoreVersion).toBe('v1');
    });

    it('correctly aggregates metrics for mock data', () => {
        const result = calculateImpact(MOCK_RECOMMENDATIONS, { forcedProfile: 'drought_warrior' });

        expect(result.totalCarbonKg).toBe(9.9);
        expect(result.totalWaterLiters).toBe(15);
        expect(result.averageWaterSavingsPercent).toBe(78);
        expect(result.pollinatorScore).toBe(2.2);
        expect(result.biodiversityScore).toBe(2.5);
        expect(result.urbanHeatReduction).toBe(1.7);
        expect(result.nativeCount).toBe(4);
        expect(result.erosionPreventionCount).toBe(5);
        expect(result.nitrogenFixingCount).toBe(0);
        expect(result.waterSavingsVsGrassLiters).toBe(2455);
        expect(result.heatReductionIndex).toBe(4.5);
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
        expect(result.scoreProfile).toBe('drought_warrior');
        expect(result.scoreBreakdown.length).toBe(3);
        expect(result.scoreVersion).toBe('v1');
    });

    it('formats key display metrics for dashboard cards', () => {
        expect(formatKg(1234.6)).toBe('1,235 kg');
        expect(formatLiters(2455)).toBe('2,455 L');
        expect(formatCount(4)).toBe('4');
        expect(formatHeatIndex(4.5)).toBe('-4.5°F');
    });
});
