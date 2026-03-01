import { calculateImpact } from './impactMath';
import { PlantRecommendation } from '../../types/plant';
import { MOCK_RECOMMENDATIONS } from '../../store/plantsStore';

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
    });

    it('correctly aggregates metrics for mock data', () => {
        const result = calculateImpact(MOCK_RECOMMENDATIONS);

        // From mock data:
        // Carbon: 0.5 + 1.2 + 2.5 = 4.2
        expect(result.totalCarbonKg).toBe(4.2);

        // Water liters: 2 + 1 + 4 = 7
        expect(result.totalWaterLiters).toBe(7);

        // Average Savings: (85 + 95 + 60) / 3 = 240 / 3 = 80
        expect(result.averageWaterSavingsPercent).toBe(80);

        // Pollinator: (3 + 1 + 3) / 3 = 2.333... -> 2.3
        expect(result.pollinatorScore).toBe(2.3);

        // Biodiversity: (2 + 2 + 3) / 3 = 2.333... -> 2.3
        expect(result.biodiversityScore).toBe(2.3);

        // Heat: (1 + 1 + 2) / 3 = 1.333... -> 1.3
        expect(result.urbanHeatReduction).toBe(1.3);

        // Natives: 1 (Blue Grama) 
        expect(result.nativeCount).toBe(1);

        // Erosion: 2 (Thyme, Blue Grama)
        expect(result.erosionPreventionCount).toBe(2);

        // Nitrogen: 0
        expect(result.nitrogenFixingCount).toBe(0);
    });
});
