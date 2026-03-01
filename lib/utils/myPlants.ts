export interface GroupingPlacedItem {
  id?: number | string;
  plantIndex: number;
  speciesScientificName?: string;
  speciesCommonName?: string;
  imageUrl?: string;
  waterRequirement?: 'low' | 'medium' | 'high';
  matureHeightMeters?: number;
  isToxicToPets?: boolean;
}

export interface GroupingPlantRecommendation {
  common_name: string;
  scientific_name: string;
  why_it_fits: string;
  mature_height_meters: number;
  water_requirement: 'low' | 'medium' | 'high';
  is_toxic_to_pets: boolean;
  care_tip: string;
  model_archetype?: string;
  water_usage_liters_per_week?: number;
  image_url?: string;
  care_difficulty?: 'easy' | 'moderate' | 'hard';
  environmental_data?: {
    carbon_sequestration_kg_per_year: number;
    water_usage_liters_per_week: number;
    vs_lawn_water_savings_percent: number;
    native_species: boolean;
    pollinator_support_score: number;
    biodiversity_score: number;
    urban_heat_reduction_score: number;
    soil_erosion_prevention: boolean;
    nitrogen_fixing: boolean;
  };
}

export interface GroupedPlacedPlant {
  speciesKey: string;
  representativePlantIndex: number;
  plant: GroupingPlantRecommendation;
  placedCount: number;
}

function normalizeSpeciesValue(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

function getSpeciesKey(
  item: GroupingPlacedItem,
  recommendation?: GroupingPlantRecommendation
): string {
  const scientific = normalizeSpeciesValue(item.speciesScientificName) || normalizeSpeciesValue(recommendation?.scientific_name);
  if (scientific.length > 0) return `scientific:${scientific}`;

  const common = normalizeSpeciesValue(item.speciesCommonName) || normalizeSpeciesValue(recommendation?.common_name);
  if (common.length > 0) return `common:${common}`;

  return `placement:${String(item.id ?? `index-${item.plantIndex}`)}`;
}

function buildPlantSnapshot(
  item: GroupingPlacedItem,
  recommendation?: GroupingPlantRecommendation
): GroupingPlantRecommendation {
  const common = item.speciesCommonName?.trim() || recommendation?.common_name || 'Unknown plant';
  const scientific = item.speciesScientificName?.trim() || recommendation?.scientific_name || 'Unknown species';
  return {
    common_name: common,
    scientific_name: scientific,
    why_it_fits: recommendation?.why_it_fits ?? '',
    mature_height_meters: item.matureHeightMeters ?? recommendation?.mature_height_meters ?? 0,
    water_requirement: item.waterRequirement ?? recommendation?.water_requirement ?? 'low',
    is_toxic_to_pets: item.isToxicToPets ?? recommendation?.is_toxic_to_pets ?? false,
    care_tip: recommendation?.care_tip ?? '',
    image_url: item.imageUrl ?? recommendation?.image_url,
    model_archetype: recommendation?.model_archetype,
    water_usage_liters_per_week: recommendation?.water_usage_liters_per_week,
    care_difficulty: recommendation?.care_difficulty,
    environmental_data: recommendation?.environmental_data,
  };
}

export function groupPlacedPlantsByRecommendation(
  placedItems: GroupingPlacedItem[],
  recommendations: GroupingPlantRecommendation[]
): GroupedPlacedPlant[] {
  const grouped = new Map<string, GroupedPlacedPlant>();

  placedItems.forEach((item) => {
    const hasValidIndex =
      Number.isInteger(item.plantIndex) && item.plantIndex >= 0 && item.plantIndex < recommendations.length;
    const recommendation = hasValidIndex ? recommendations[item.plantIndex] : undefined;
    const speciesKey = getSpeciesKey(item, recommendation);

    const existing = grouped.get(speciesKey);
    if (existing) {
      existing.placedCount += 1;
      return;
    }

    const plant = buildPlantSnapshot(item, recommendation);
    grouped.set(speciesKey, {
      speciesKey,
      representativePlantIndex: hasValidIndex ? item.plantIndex : -1,
      plant,
      placedCount: 1,
    });
  });

  return Array.from(grouped.values());
}
