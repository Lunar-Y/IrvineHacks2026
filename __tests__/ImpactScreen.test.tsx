import { renderHook } from '@testing-library/react-hooks';
import { useImpactStore } from '../store/impactStore';

describe('Impact Store Data Integration Check', () => {
  it('supplies the correct default metrics to the UI layer', () => {
    // We mount the store hook directly, exactly how EnvironmentStats does
    const { result } = renderHook(() => useImpactStore());
    
    // Assert that the default state (empty array) correctly propagates
    expect(result.current.totalPlants).toBe(0);
    expect(result.current.metrics.totalCarbonKg).toBe(0);
    expect(result.current.metrics.averageWaterSavingsPercent).toBe(0);
  });
});
