import type { PlantRecommendation } from '@/lib/store/scanStore';

export interface RecommendationDeckItem extends PlantRecommendation {
  id: string;
  source: 'dummy' | 'api';
  rank: number;
}

const DUMMY_PLANTS: PlantRecommendation[] = [
  { common_name: 'Lavender', scientific_name: 'Lavandula angustifolia', why_it_fits: 'Drought-tolerant, full sun.', model_archetype: 'flowering_shrub', fit_score: 88 },
  { common_name: 'Rosemary', scientific_name: 'Rosmarinus officinalis', why_it_fits: 'Low water, hardy in zone 9.', model_archetype: 'flowering_shrub', fit_score: 85 },
  { common_name: 'California Poppy', scientific_name: 'Eschscholzia californica', why_it_fits: 'Native, easy care.', model_archetype: 'perennial_flower', fit_score: 90 },
  { common_name: 'Creeping Thyme', scientific_name: 'Thymus serpyllum', why_it_fits: 'Groundcover, low maintenance.', model_archetype: 'groundcover', fit_score: 82 },
  { common_name: 'Olive', scientific_name: 'Olea europaea', why_it_fits: 'Small tree, drought tolerant.', model_archetype: 'small_tree', fit_score: 78 },
];

export function buildDummyDeck(
  count: number = 5,
  existing: PlantRecommendation[] = []
): RecommendationDeckItem[] {
  const base = existing.length >= count ? existing : DUMMY_PLANTS;
  return base.slice(0, count).map((plant, i) => ({
    ...plant,
    id: `dummy-${i}-${Date.now()}`,
    source: 'dummy' as const,
    rank: i + 1,
  }));
}
