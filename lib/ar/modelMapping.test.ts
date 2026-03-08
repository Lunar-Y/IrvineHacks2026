import { MOCK_RECOMMENDATIONS } from '../mock/mockRecommendations';

jest.mock('../../assets/models/maple_tree.glb', () => 'maple_tree.glb', { virtual: true });
jest.mock('../../assets/models/shrub.glb', () => 'shrub.glb', { virtual: true });
jest.mock('../../assets/models/calendula_flower.glb', () => 'calendula_flower.glb', { virtual: true });

const { getModelForArchetype, getModelForPlant } = require('./modelMapping');

describe('modelMapping (demo contract)', () => {

  it('maps the curated demo plants to required model keys', () => {
    const expected: Record<string, 'shrub' | 'maple_tree' | 'flower'> = {
      'Coyote Brush': 'shrub',
      'Western Sycamore': 'maple_tree',
      'California Poppy': 'flower',
      'California Sagebrush': 'shrub',
      'Coast Live Oak': 'maple_tree',
    };

    MOCK_RECOMMENDATIONS.forEach((plant) => {
      const model = getModelForArchetype(plant.model_archetype);
      expect(model.modelKey).toBe(expected[plant.common_name]);
    });
  });

  it('falls back to maple_tree for unknown archetypes', () => {
    expect(getModelForArchetype('something_else').modelKey).toBe('maple_tree');
  });

  it('falls back by height when archetype is missing', () => {
    expect(getModelForPlant({ mature_height_meters: 0.3 }).modelKey).toBe('flower');
    expect(getModelForPlant({ mature_height_meters: 1.2 }).modelKey).toBe('shrub');
    expect(getModelForPlant({ mature_height_meters: 3.5 }).modelKey).toBe('maple_tree');
  });
});
