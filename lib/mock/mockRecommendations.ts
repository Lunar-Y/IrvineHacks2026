/**
 * ⚠️  FILLER / MOCK FILE — REMOVE FOR FINAL PRODUCT
 *
 * These hardcoded plant recommendations are used as fallback data when the
 * get-recommendations Edge Function is unavailable. In the final product,
 * this file should either be deleted entirely or kept ONLY as a last-resort
 * offline fallback. All real data should come from the Supabase RAG pipeline.
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
        common_name: 'Lavender',
        scientific_name: 'Lavandula angustifolia',
        why_it_fits:
            'Thrives in your full-sun, well-drained loamy soil. Extremely drought-tolerant once established — perfect for a low-maintenance SoCal yard.',
        mature_height_meters: 0.6,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Cut back by one-third after the first bloom flush in spring to encourage a second flowering.',
        model_archetype: 'flowering_shrub',
        care_difficulty: 'easy',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Lavandula_angustifolia_%27Hidcote%27_2.jpg/800px-Lavandula_angustifolia_%27Hidcote%27_2.jpg',
        model_asset: require('../../assets/models/maple_tree.glb'),
    },
    {
        common_name: 'California Sagebrush',
        scientific_name: 'Artemisia californica',
        why_it_fits:
            'A native to your region that handles heat and drought with ease. Its silver foliage provides year-round visual interest and supports local pollinators.',
        mature_height_meters: 1.2,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Prune lightly in late summer to maintain a compact shape and remove woody growth.',
        model_archetype: 'evergreen_shrub',
        care_difficulty: 'easy',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Artemisia_californica_2.jpg/800px-Artemisia_californica_2.jpg',
    },
    {
        common_name: 'Mexican Sage',
        scientific_name: 'Salvia leucantha',
        why_it_fits:
            'Produces dramatic purple flower spikes from late summer through fall. Loves your hot, sunny conditions and needs very little water once established.',
        mature_height_meters: 1.0,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Cut to the ground in late winter to rejuvenate and encourage a full flush of new growth.',
        model_archetype: 'flowering_shrub',
        care_difficulty: 'easy',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Salvia_leucantha.jpg/800px-Salvia_leucantha.jpg',
    },
    {
        common_name: 'Rockrose',
        scientific_name: 'Cistus purpureus',
        why_it_fits:
            'A Mediterranean native perfectly matched to your dry, sunny yard. Showy pink flowers in spring; excellent for erosion control on slopes.',
        mature_height_meters: 0.9,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Do not over-water — this plant thrives on neglect. Avoid pruning into old wood.',
        model_archetype: 'flowering_shrub',
        care_difficulty: 'easy',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Cistus_purpureus_kz1.JPG/800px-Cistus_purpureus_kz1.JPG',
    },
    {
        common_name: 'Blue Oat Grass',
        scientific_name: 'Helictotrichon sempervirens',
        why_it_fits:
            'Striking blue-silver blades that catch the light. Handles full sun and dry summers without any special care — an ideal textural contrast plant.',
        mature_height_meters: 0.6,
        water_requirement: 'low',
        is_toxic_to_pets: false,
        care_tip: 'Comb out dead blades with a gloved hand in early spring — no cutting required.',
        model_archetype: 'ornamental_grass',
        care_difficulty: 'easy',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Helictotrichon_sempervirens_4.jpg/800px-Helictotrichon_sempervirens_4.jpg',
    },
    {
        common_name: 'Agave',
        scientific_name: 'Agave americana',
        why_it_fits:
            'An architectural statement plant that stores its own water. Practically indestructible in Zone 9-10 heat. Ideal as a focal point or border plant.',
        mature_height_meters: 1.5,
        water_requirement: 'low',
        is_toxic_to_pets: true,
        care_tip: 'Plant in very fast-draining soil. The main threat is root rot from overwatering, not drought.',
        model_archetype: 'evergreen_shrub',
        care_difficulty: 'easy',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Agave_americana_02.jpg/800px-Agave_americana_02.jpg',
    },
];
