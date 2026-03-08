/**
 * MODEL ARCHETYPE → 3D ASSET MAPPING
 *
 * Maps the `model_archetype` field (from PlantRecommendation or LLM output)
 * to the correct local 3D model file.
 *
 * DEMO MAPPING (authoritative):
 *   - 'maple_tree' -> maple_tree.glb
 *   - 'shrub'      -> shrub.glb
 *   - 'flower'     -> calendula_flower.glb
 *
 * SUPABASE STORAGE URLS (for runtime downloads if needed):
 *   https://tzewkyhnmctwpstwqnvq.supabase.co/storage/v1/object/public/plant-models/maple_tree.glb
 *   https://tzewkyhnmctwpstwqnvq.supabase.co/storage/v1/object/public/plant-models/shrub.glb
 *   https://tzewkyhnmctwpstwqnvq.supabase.co/storage/v1/object/public/plant-models/calendula_flower.glb
 */

// Local asset requires (bundled with the app)
const MODELS = {
    maple_tree: require('../../assets/models/maple_tree.glb'),
    shrub: require('../../assets/models/shrub.glb'),
    flower: require('../../assets/models/calendula_flower.glb'),
} as const;

export type ModelKey = keyof typeof MODELS;

function normalizeArchetype(archetype?: string): string {
    return (archetype ?? '')
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_');
}

/**
 * Given a model_archetype string (from the LLM or database), return
 * the best matching local 3D asset and a recommended scale.
 */
export function getModelForArchetype(archetype?: string): {
    source: any;
    scale: [number, number, number];
    modelKey: ModelKey;
} {
    const normalized = normalizeArchetype(archetype);

    if (normalized === 'maple_tree') {
        return { source: MODELS.maple_tree, scale: [0.06, 0.06, 0.06], modelKey: 'maple_tree' };
    }

    if (normalized === 'shrub') {
        return { source: MODELS.shrub, scale: [0.8, 0.8, 0.8], modelKey: 'shrub' };
    }

    if (normalized === 'flower') {
        return { source: MODELS.flower, scale: [0.4, 0.4, 0.4], modelKey: 'flower' };
    }

    // Fallback: keep a reliable tree model for unknown/missing archetypes.
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
    if (heightMeters <= 0.8) return 'flower';
    if (heightMeters <= 1.5) return 'shrub';
    return 'maple_tree';
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
