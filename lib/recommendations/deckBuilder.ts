/**
 * ⚠️  FILLER / SCAFFOLD FILE — REPLACE FOR FINAL PRODUCT
 *
 * This deck builder currently uses hardcoded mock data to populate the
 * recommendations carousel. In the final product, replace `buildDummyDeck()`
 * with an async `buildLiveDeck()` that fetches from the get-recommendations
 * Edge Function and falls back to mockRecommendations only on network failure.
 */
import { MOCK_RECOMMENDATIONS } from '@/lib/mock/mockRecommendations';
import { PlantRecommendation } from '@/lib/store/scanStore';

export type DeckSource = 'dummy';

export interface RecommendationDeckItem extends PlantRecommendation {
  id: string;
  source: DeckSource;
  rank: number;
}

function normalizeIdentity(value: string | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getIdentity(plant: PlantRecommendation, index: number): string {
  const scientific = normalizeIdentity(plant.scientific_name);
  if (scientific.length > 0) return scientific;

  const common = normalizeIdentity(plant.common_name);
  if (common.length > 0) return common;

  return `plant-${index + 1}`;
}

function dedupeRecommendations(plants: PlantRecommendation[]): PlantRecommendation[] {
  const seen = new Set<string>();
  const deduped: PlantRecommendation[] = [];

  plants.forEach((plant, index) => {
    const key = getIdentity(plant, index);
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(plant);
  });

  return deduped;
}

/**
 * Builds a recommendation deck with deterministic ordering, IDs, and a minimum card count.
 * Uses seedPlants (or existing recommendations) when provided, otherwise MOCK_RECOMMENDATIONS.
 */
export function buildDummyDeck(
  minCount: number = 5,
  _seedPlants: PlantRecommendation[] = MOCK_RECOMMENDATIONS
): RecommendationDeckItem[] {
  const safeMinCount = Math.max(1, Math.floor(minCount));
  // [DEMO_HARDCODED]: Always use MOCK_RECOMMENDATIONS for the demo to ensure
  // predictability and handle specific glb model requirements.
  const sourcePlants = MOCK_RECOMMENDATIONS;
  const dedupedPlants = dedupeRecommendations(sourcePlants);

  if (dedupedPlants.length === 0) return [];

  const initialDeck = dedupedPlants.map((plant, index) => ({
    ...plant,
    id: `dummy-${getIdentity(plant, index)}-${index + 1}`,
    source: 'dummy' as const,
    rank: index + 1,
  }));

  const deck = [...initialDeck];
  let loopIndex = 0;

  while (deck.length < safeMinCount) {
    const baseIndex = loopIndex % dedupedPlants.length;
    const plant = dedupedPlants[baseIndex];
    deck.push({
      ...plant,
      id: `dummy-${getIdentity(plant, baseIndex)}-loop-${deck.length + 1}`,
      source: 'dummy',
      rank: deck.length + 1,
    });
    loopIndex += 1;
  }

  return deck;
}
