/**
 * MODEL ARCHETYPE → 3D ASSET MAPPING
 *
 * Maps the `model_archetype` field (from PlantRecommendation or LLM output)
 * to the correct local 3D model file.
 *
 * ARCHETYPE CATEGORIES:
 *   - 'tree' / 'small_tree' / 'medium_tree'  → maple_tree.glb  (default tree)
 *   - 'large_tree'                            → old_tree.glb    (bigger/older tree)
 *   - 'shrub' / 'evergreen_shrub' / 'flowering_shrub' / 'ornamental_grass' / 'groundcover'
 *                                             → shrub.glb       (bush/shrub)
 *   - 'flower' / 'perennial_flower' / 'climbing_vine'
 *                                             → calendula_flower.glb (flower)
 *
 * SUPABASE STORAGE URLS (for runtime downloads if needed):
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/maple_tree.glb
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/old_tree.glb
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/shrub.glb
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/calendula_flower.glb
 */

// Local asset requires (bundled with the app)
const MODELS = {
    maple_tree: require('../../assets/models/maple_tree.glb'),
    old_tree: require('../../assets/models/old_tree.glb'),
    shrub: require('../../assets/models/shrub.glb'),
    flower: require('../../assets/models/calendula_flower.glb'),
} as const;

export type ModelKey = keyof typeof MODELS;

/**
 * Given a model_archetype string (from the LLM or database), return
 * the best matching local 3D asset and a recommended scale.
 */
export function getModelForArchetype(archetype?: string): {
    source: any;
    scale: [number, number, number];
    modelKey: ModelKey;
} {
    const normalized = (archetype ?? '').toLowerCase().trim();

    // Large / old trees
    if (normalized.includes('large_tree') || normalized.includes('old_tree')) {
        return { source: MODELS.old_tree, scale: [0.08, 0.08, 0.08], modelKey: 'old_tree' };
    }

    // Standard trees (default)
    if (
        normalized.includes('tree') ||
        normalized.includes('small_tree') ||
        normalized.includes('medium_tree')
    ) {
        return { source: MODELS.maple_tree, scale: [0.06, 0.06, 0.06], modelKey: 'maple_tree' };
    }

    // Flowers
    if (
        normalized.includes('flower') ||
        normalized.includes('perennial') ||
        normalized.includes('vine') ||
        normalized.includes('climbing')
    ) {
        return { source: MODELS.flower, scale: [0.04, 0.04, 0.04], modelKey: 'flower' };
    }

    // Shrubs, bushes, grasses, groundcover
    if (
        normalized.includes('shrub') ||
        normalized.includes('bush') ||
        normalized.includes('grass') ||
        normalized.includes('groundcover') ||
        normalized.includes('evergreen') ||
        normalized.includes('ornamental')
    ) {
        return { source: MODELS.shrub, scale: [0.05, 0.05, 0.05], modelKey: 'shrub' };
    }

    // Fallback: use height-based heuristic if no archetype matches
    return { source: MODELS.maple_tree, scale: [0.06, 0.06, 0.06], modelKey: 'maple_tree' };
}

/**
 * Fallback: infer archetype from plant height when model_archetype
 * is missing from the database/LLM response.
 *
 * This is used when the Supabase rag_plants table doesn't have an
 * archetype column yet.
 */
export function inferArchetypeFromHeight(heightMeters: number): string {
    if (heightMeters <= 0.3) return 'groundcover';
    if (heightMeters <= 0.8) return 'perennial_flower';
    if (heightMeters <= 1.5) return 'flowering_shrub';
    if (heightMeters <= 4.0) return 'small_tree';
    if (heightMeters <= 8.0) return 'medium_tree';
    return 'large_tree';
}

/**
 * Get the model for a plant, using archetype if available,
 * otherwise falling back to height-based inference.
 */
export function getModelForPlant(plant: {
    model_archetype?: string;
    mature_height_meters?: number;
}): ReturnType<typeof getModelForArchetype> {
    if (plant.model_archetype) {
        return getModelForArchetype(plant.model_archetype);
    }
    if (plant.mature_height_meters) {
        const inferred = inferArchetypeFromHeight(plant.mature_height_meters);
        return getModelForArchetype(inferred);
    }
    return getModelForArchetype(); // default maple tree
}
