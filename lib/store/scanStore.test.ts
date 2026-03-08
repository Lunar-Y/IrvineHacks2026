import { useScanStore } from './scanStore';
import { MOCK_RECOMMENDATIONS } from '../mock/mockRecommendations';

describe('scanStore demo recommendation behavior', () => {
  beforeEach(() => {
    useScanStore.setState({
      currentScan: {
        id: null,
        imageUri: null,
        status: 'idle',
        recommendations: [],
        assembledProfile: null,
      },
      activeRecommendationIndex: null,
      lastHorizontalIndex: 0,
      placedPlantCounts: {},
      placedItems: [],
    });
  });

  it('forces MOCK_RECOMMENDATIONS even when live results are provided', () => {
    const fakeLiveRecs = [
      {
        common_name: 'Live Plant',
        scientific_name: 'Liveus plantus',
        why_it_fits: 'From API',
        mature_height_meters: 1,
        water_requirement: 'medium' as const,
        is_toxic_to_pets: false,
        care_tip: 'Live tip',
      },
    ];

    useScanStore.getState().setRecommendations(fakeLiveRecs as any);
    expect(useScanStore.getState().currentScan.recommendations).toEqual(MOCK_RECOMMENDATIONS);
  });
});
