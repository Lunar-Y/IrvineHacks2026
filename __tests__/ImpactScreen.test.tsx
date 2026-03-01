import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import ImpactScreen from '../app/(tabs)/impact';
import { useImpactStore } from '../store/impactStore';

describe('Impact Store Data Integration Check', () => {
  it('supplies the correct default metrics to the UI layer', () => {
    const { result } = renderHook(() => useImpactStore());

    expect(result.current.totalPlants).toBe(0);
    expect(result.current.metrics.totalCarbonKg).toBe(0);
    expect(result.current.metrics.averageWaterSavingsPercent).toBe(0);
    expect(result.current.metrics.overallScore).toBe(0);
  });

  it('renders statistics modules and labels', () => {
    const { getByText, getByTestId, queryByText } = render(<ImpactScreen />);

    getByTestId('overall-score-module');
    getByTestId('co2-module');
    getByTestId('co2-s-curve');
    getByTestId('co2-endpoint-dot');
    getByTestId('water-module');
    getByTestId('native-module');
    getByTestId('heat-module');
    getByTestId('nitrogen-module');

    getByText('Overall Impact Score');
    getByText('CO₂ Sequestered');
    getByText('Water Savings');
    getByText('Native Species');
    getByText('Heat Reduction');
    getByText('Nitrogen-Fixing');
    getByText('Add plants to see annual sequestration estimate');
    getByText('annual estimate vs grass baseline');
    getByText('count of native species selected');
    getByText('cooling index estimate');
    getByText('soil-enriching species count');
    expect(queryByText(/Active profile:/)).toBeNull();
    getByText('--');
  });
});
