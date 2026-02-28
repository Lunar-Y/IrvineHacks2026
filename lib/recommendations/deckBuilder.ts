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
 * CURRENT DUMMY BEHAVIOR:
 * - This builder is the single source of truth for recommendation deck fixtures.
 * - It guarantees deterministic ordering, deterministic IDs, and a minimum card count.
 *
 * FUTURE API WIRING STEPS:
 * FUTURE_INTEGRATION: Replace the `seedPlants` input with the response from an async
 * FUTURE_INTEGRATION: `fetchRecommendationsFromEdge(profile, preferences)` adapter.
 * FUTURE_INTEGRATION: Keep this normalization layer in place so UI rendering remains
 * FUTURE_INTEGRATION: stable regardless of backend data quality.
 *
 * VALIDATION/BACKFILL EXPECTATIONS:
 * FUTURE_INTEGRATION: Validate each API item shape before mapping into deck items.
 * FUTURE_INTEGRATION: Drop malformed records, then backfill from a trusted fallback set
 * FUTURE_INTEGRATION: until `minCount` is reached.
 *
 * FAILURE HANDLING AND ANALYTICS HOOKS TO ADD LATER:
 * FUTURE_INTEGRATION: Emit telemetry when malformed items are dropped.
 * FUTURE_INTEGRATION: Emit telemetry when backfill path is used.
 */
export function buildDummyDeck(
  minCount: number = 5,
  seedPlants: PlantRecommendation[] = MOCK_RECOMMENDATIONS
): RecommendationDeckItem[] {
  const safeMinCount = Math.max(1, Math.floor(minCount));
  const sourcePlants = seedPlants.length > 0 ? seedPlants : MOCK_RECOMMENDATIONS;
  const dedupedPlants = dedupeRecommendations(sourcePlants);

  if (dedupedPlants.length === 0) return [];

  const initialDeck = dedupedPlants.map((plant, index) => ({
    ...plant,
    id: `dummy-${getIdentity(plant, index)}-${index + 1}`,
    source: 'dummy' as const,
    rank: index + 1,
  }));

  // The fixture set is looped only when needed to satisfy the minimum card count.
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
