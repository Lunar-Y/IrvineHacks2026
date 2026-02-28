# LawnLens Part 3: The Environmental Brain

## Role: Backend & Data Architect
**Goal:** Build the logic that turns location data into plant recommendations.

### Scope:
1. **API Integration:** Implement Open-Meteo, USDA Soil Survey, USDA Hardiness, and NOAA Frost APIs.
2. **Orchestration:** Create the `/assemble-profile` Supabase Edge Function to parallel-fetch all environmental data.
3. **Recommendation Engine:** Implement the `/get-recommendations` Supabase Edge Function using Claude (Daedalus API).
4. **Enrichment:** Merge LLM recommendations with Perenual API data (images, care stats).
5. **Caching:** Implement `plant_cache` in Postgres to respect Perenual rate limits.

### Key Files & Interfaces:
- `lib/api/openMeteo.ts`
- `lib/api/usdaSoilSurvey.ts`
- `lib/llm/plantRecommendations.ts`
- `supabase/functions/assemble-profile/index.ts`
- `supabase/functions/get-recommendations/index.ts`

### Acceptance Criteria:
- `/assemble-profile` returns a complete `EnvironmentalProfile` JSON.
- `/get-recommendations` returns a ranked list of 6-8 plants with rich metadata.
- Plant data is successfully cached in Postgres after the first fetch.
- Invasive and toxic plants are correctly filtered based on region and user flags.
