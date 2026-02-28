export type ModelArchetype = 'groundcover' | 'ornamental_grass' | 'flowering_shrub' | 'evergreen_shrub' | 'small_tree' | 'medium_tree' | 'climbing_vine' | 'perennial_flower';

export interface PlantEnvironmentalData {
  carbon_sequestration_kg_per_year: number;
  water_usage_liters_per_week: number;
  vs_lawn_water_savings_percent: number;
  native_species: boolean;
  pollinator_support_score: 1 | 2 | 3;
  biodiversity_score: 1 | 2 | 3;
  urban_heat_reduction_score: 1 | 2 | 3;
  soil_erosion_prevention: boolean;
  nitrogen_fixing: boolean;
}

export interface PlantRecommendation {
  id: string; // Unique ID (could be perenual_id or UUID)
  rank: number;
  common_name: string;
  scientific_name: string;
  model_archetype: ModelArchetype;
  mature_height_meters: number;
  mature_width_meters: number;
  why_it_fits: string;
  care_difficulty: "easy" | "moderate" | "hard";
  watering_frequency_days: number;
  sunlight_requirement: "full_sun" | "partial_sun" | "partial_shade" | "full_shade";
  environmental_data: PlantEnvironmentalData;
  image_urls?: string[]; // Added by Part 3 after Perenual fetch
}

export interface PlantPlacement {
  id: string; // Unique placement ID
  plant_id: string; // Refers to PlantRecommendation.id
  position: [number, number, number]; // [x, y, z] in AR space relative to plane
}
