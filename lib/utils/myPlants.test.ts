import {
  GroupingPlacedItem,
  GroupingPlantRecommendation,
  groupPlacedPlantsByRecommendation,
} from './myPlants';

const recs: GroupingPlantRecommendation[] = [
  {
    common_name: 'Lavender',
    scientific_name: 'Lavandula angustifolia',
    why_it_fits: 'Good fit',
    mature_height_meters: 0.8,
    water_requirement: 'low',
    is_toxic_to_pets: false,
    care_tip: 'Trim yearly',
  },
  {
    common_name: 'California Poppy',
    scientific_name: 'Eschscholzia californica',
    why_it_fits: 'Native option',
    mature_height_meters: 0.3,
    water_requirement: 'low',
    is_toxic_to_pets: false,
    care_tip: 'Full sun',
  },
  {
    common_name: 'English Lavender',
    scientific_name: 'Lavandula angustifolia',
    why_it_fits: 'Duplicate species in another slot',
    mature_height_meters: 0.7,
    water_requirement: 'low',
    is_toxic_to_pets: false,
    care_tip: 'Prune lightly',
  },
];

function placed(
  id: number,
  plantIndex: number,
  speciesScientificName?: string,
  speciesCommonName?: string
): GroupingPlacedItem & { id: number } {
  return {
    id,
    plantIndex,
    speciesScientificName,
    speciesCommonName,
  };
}

describe('groupPlacedPlantsByRecommendation', () => {
  it('returns empty for empty input', () => {
    expect(groupPlacedPlantsByRecommendation([], recs)).toEqual([]);
  });

  it('groups multiple placements for the same species', () => {
    const grouped = groupPlacedPlantsByRecommendation(
      [
        placed(1, 0, 'Lavandula angustifolia', 'Lavender'),
        placed(2, 0, 'Lavandula angustifolia', 'Lavender'),
        placed(3, 0, 'Lavandula angustifolia', 'Lavender'),
      ],
      recs
    );
    expect(grouped).toHaveLength(1);
    expect(grouped[0].placedCount).toBe(3);
    expect(grouped[0].plant.common_name).toBe('Lavender');
  });

  it('creates separate cards for distinct species with count 1 each', () => {
    const grouped = groupPlacedPlantsByRecommendation(
      [
        placed(1, 0, 'Malus domestica', 'Apple'),
        placed(2, 1, 'Pyrus communis', 'Pear'),
        placed(3, 2, 'Citrus limon', 'Lemon'),
      ],
      recs
    );
    expect(grouped).toHaveLength(3);
    expect(grouped.every((item) => item.placedCount === 1)).toBe(true);
  });

  it('merges same species across different recommendation indices', () => {
    const grouped = groupPlacedPlantsByRecommendation(
      [
        placed(1, 0, 'Lavandula angustifolia', 'Lavender'),
        placed(2, 2, 'Lavandula angustifolia', 'English Lavender'),
      ],
      recs
    );
    expect(grouped).toHaveLength(1);
    expect(grouped[0].placedCount).toBe(2);
    expect(grouped[0].speciesKey).toBe('scientific:lavandula angustifolia');
  });

  it('falls back safely when recommendation index is invalid', () => {
    const grouped = groupPlacedPlantsByRecommendation(
      [placed(1, -1, '', 'Apple'), placed(2, 99, 'Pyrus communis', 'Pear')],
      recs
    );
    expect(grouped).toHaveLength(2);
    expect(grouped[0].placedCount).toBe(1);
    expect(grouped[1].placedCount).toBe(1);
    expect(grouped[0].speciesKey).toContain('common:apple');
    expect(grouped[1].speciesKey).toContain('scientific:pyrus communis');
  });

  it('uses snapshot metadata over recommendation data when present', () => {
    const grouped = groupPlacedPlantsByRecommendation(
      [
        placed(1, 0, 'Mespilus germanica', 'Loquat'),
      ],
      recs
    );
    expect(grouped).toHaveLength(1);
    expect(grouped[0].plant.common_name).toBe('Loquat');
    expect(grouped[0].plant.scientific_name).toBe('Mespilus germanica');
  });
});
