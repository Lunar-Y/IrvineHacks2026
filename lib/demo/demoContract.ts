export const DEMO_BRANCH_MODE = true;

export const DEMO_SCAN_POST_RECOMMENDATION_DELAY_MS = 1500;

export const DEMO_MODEL_ARCHETYPES = ['shrub', 'maple_tree', 'flower'] as const;

export type DemoModelArchetype = (typeof DEMO_MODEL_ARCHETYPES)[number];
