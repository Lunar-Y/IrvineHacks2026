# GreenScape Demo Branch Contract

This branch is demo-only and intentionally prioritizes deterministic presentation behavior.

## Fixed Plant-to-Model Mapping

The `model_archetype` field on `MOCK_RECOMMENDATIONS` is authoritative.

| Plant | `model_archetype` | Asset |
|---|---|---|
| Coyote Brush | `shrub` | `shrub.glb` |
| Western Sycamore | `maple_tree` | `maple_tree.glb` |
| California Poppy | `flower` | `calendula_flower.glb` |
| California Sagebrush | `shrub` | `shrub.glb` |
| Coast Live Oak | `maple_tree` | `maple_tree.glb` |

No common-name-based remapping is used. If `model_archetype` is missing or unknown, fallback is `maple_tree.glb`.

## Recommendations and Scan Behavior

- `setRecommendations` in `lib/store/scanStore.ts` always stores `MOCK_RECOMMENDATIONS`.
- Fresh scan success always waits `1500ms` before opening recommendations.
- Existing onboarding bypass and instant resume shortcuts remain enabled.

## Plant Cards and Saved-Plant Guarantees

The recommendation card, detail, care, AR placement metadata, and saved plants flows are intentionally unchanged and rely on these mock fields:

- `common_name`
- `scientific_name`
- `why_it_fits`
- `care_tip`
- `water_requirement`
- `is_toxic_to_pets`
- `image_url`
- `environmental_data`
- `care_difficulty`
- `model_archetype`

## Known Demo Limitations

- Environmental profile values are placeholders and not fully location-dynamic.
- Pet toxicity warnings are from hardcoded mock data, not a live toxicity service.
- Recommendation output is curated for presentation reliability, not production personalization.
