/**
 * [DEMO_HARDCODED]: This entire file contains static assets and metadata 
 * specifically curated for the IrvineHacks demo.
 */
import { PlantRecommendation } from '@/lib/store/scanStore';

/**
 * Mock plant recommendations used as a fallback when the get-recommendations
 * Edge Function is unavailable or returns an error. These are realistic
 * Southern California / Zone 9-10 plants.
 *
 * CURRENT DUMMY BEHAVIOR:
 * - During the deck UI iteration phase, these fixtures are the primary source.
 *
 * FUTURE API WIRING STEPS:
 * FUTURE_INTEGRATION: Keep this file as a resilient fallback list after backend
 * FUTURE_INTEGRATION: is re-enabled. The scan flow should first consume API output,
 * FUTURE_INTEGRATION: then backfill from this list if API returns fewer than target.
 *
 * VALIDATION/BACKFILL EXPECTATIONS:
 * FUTURE_INTEGRATION: Maintain field parity with PlantRecommendation so the same
 * FUTURE_INTEGRATION: rendering pipeline can operate on API and fallback records.
 *
 * FAILURE HANDLING AND ANALYTICS HOOKS TO ADD LATER:
 * FUTURE_INTEGRATION: Add metric increments when fallback items are displayed.
 */
export const MOCK_RECOMMENDATIONS: PlantRecommendation[] = [
    {
        common_name: 'Coyote Brush',
        scientific_name: 'Baccharis pilularis',
        why_it_fits:
            'A rugged California native that thrives in coastal and inland environments. Excellent for erosion control and provides habitat for local wildlife.',
        mature_height_meters: 1.5,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Prune in late winter to maintain a desired shape and encourage fresh green growth.',
        model_archetype: 'shrub',
        care_difficulty: 'easy',
        image_url: require('../../assets/images/plants/coyote_brush.jpg') as any,
        environmental_data: {
            carbon_sequestration_kg_per_year: 12.5,
            water_usage_liters_per_week: 15.0,
            vs_lawn_water_savings_percent: 85,
            native_species: true,
            pollinator_support_score: 2,
            biodiversity_score: 2,
            urban_heat_reduction_score: 2,
            soil_erosion_prevention: true,
            nitrogen_fixing: false,
        }
    },
    {
        common_name: 'Western Sycamore',
        scientific_name: 'Platanus racemosa',
        why_it_fits:
            'Iconic California tree with beautiful mottled bark and large, sculptural leaves. Perfect as a large shade tree for bigger yards.',
        mature_height_meters: 25.0,
        water_requirement: 'medium',
        is_toxic_to_pets: false,
        care_tip: 'Requires space for root expansion. Very drought tolerant once established but enjoys occasional deep watering.',
        model_archetype: 'maple_tree',
        care_difficulty: 'moderate',
        image_url: require('../../assets/images/plants/western_sycamore.webp') as any,
        environmental_data: {
            carbon_sequestration_kg_per_year: 45.0,
            water_usage_liters_per_week: 40.0,
            vs_lawn_water_savings_percent: 60,
            native_species: true,
            pollinator_support_score: 1,
            biodiversity_score: 3,
            urban_heat_reduction_score: 3,
            soil_erosion_prevention: true,
            nitrogen_fixing: false,
        }
    },
    {
        common_name: 'California Poppy',
        scientific_name: 'Eschscholzia californica',
        why_it_fits:
            ' The state flower of California. Its vibrant orange blooms bring a splash of color to any sunny spot with minimal water needs.',
        mature_height_meters: 0.3,
        water_requirement: 'low',
        is_toxic_to_pets: true,
        care_tip: 'Drought tolerant and self-seeding. Let the seed pods dry on the plant if you want them to return next year.',
        model_archetype: 'flower',
        care_difficulty: 'easy',
        image_url: require('../../assets/images/plants/california_poppy.webp') as any,
        environmental_data: {
            carbon_sequestration_kg_per_year: 2.0,
            water_usage_liters_per_week: 5.0,
            vs_lawn_water_savings_percent: 95,
            native_species: true,
            pollinator_support_score: 3,
            biodiversity_score: 1,
            urban_heat_reduction_score: 1,
            soil_erosion_prevention: false,
            nitrogen_fixing: false,
        }
    },
    {
        common_name: 'California Sagebrush',
        scientific_name: 'Artemisia californica',
        why_it_fits:
            'Known as "Cowboy Cologne" for its iconic fragrance. This silver-green shrub is a cornerstone of the coastal sage scrub ecosystem.',
        mature_height_meters: 1.2,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Needs very little water. Avoid over-watering as it can lead to root rot in heavier soils.',
        model_archetype: 'shrub',
        care_difficulty: 'easy',
        image_url: require('../../assets/images/plants/california_sagebrush.jpg') as any,
        environmental_data: {
            carbon_sequestration_kg_per_year: 10.0,
            water_usage_liters_per_week: 8.0,
            vs_lawn_water_savings_percent: 90,
            native_species: true,
            pollinator_support_score: 2,
            biodiversity_score: 2,
            urban_heat_reduction_score: 1,
            soil_erosion_prevention: true,
            nitrogen_fixing: false,
        }
    },
    {
        common_name: 'Coast Live Oak',
        scientific_name: 'Quercus agrifolia',
        why_it_fits:
            'A majestic long-lived evergreen oak. Provides immense ecological value and a permanent, sculptural presence in the landscape.',
        mature_height_meters: 15.0,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Never water under the canopy of a mature oak during the dry summer months to prevent root diseases.',
        model_archetype: 'maple_tree',
        care_difficulty: 'moderate',
        image_url: require('../../assets/images/plants/coast_live_oak.jpg') as any,
        environmental_data: {
            carbon_sequestration_kg_per_year: 35.0,
            water_usage_liters_per_week: 25.0,
            vs_lawn_water_savings_percent: 75,
            native_species: true,
            pollinator_support_score: 2,
            biodiversity_score: 3,
            urban_heat_reduction_score: 3,
            soil_erosion_prevention: true,
            nitrogen_fixing: false,
        }
    },

];

