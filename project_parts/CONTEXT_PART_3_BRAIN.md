# LawnLens Part 3: The Environmental Brain

## Role: Backend & Data Architect
**Goal:** Build the robust data pipeline that maps raw environmental context and user preferences into highly accurate plant recommendations.

### Scope & Tasks:
1. **APIs and the Data Pipeline:**
   - Fetch data from: Open-Meteo, USDA Web Soil Survey, USDA Hardiness Zone, NOAA Climate Data.
   - Assemble `EnvironmentalProfile` JSON gathering: location, weather, soil, sun exposure, yard geometry, restrictions (invasive species), and user preferences.
2. **Data Orchestration (Edge Functions):**
   - `/assemble-profile`: Fire all API requests in parallel. Combine with Vision Analysis results. 
   - Manage perceived intelligence on the frontend during assembly (icons popping up as data resolves).
3. **Recommendation Engine (LLM Step 2):**
   - Prompt Claude with the full `EnvironmentalProfile`.
   - Request 6-8 plants in JSON with specific schemas: `rank`, `model_archetype`, `mature_height_meters`, `environmental_data` (carbon, water, biodiversity), etc.
   - Enforce constraints: NEVER recommend invasive/toxic plants if flagged.
4. **Data Enrichment & Caching:**
   - Use `/get-recommendations` to parse LLM output.
   - Check `plant_cache` in Postgres to avoid hitting Perenual API limits (100 req/day).
   - If missing, hit Perenual for images/care data, then write to cache.

### EnvironmentalProfile Interface Highlights:
- Coordinates, elevation, hardiness zone.
- Current temp, 7-day forecast, frost dates.
- Soil texture, drainage, pH.
- Sun exposure and intended user purpose (e.g. privacy, edible).

### Key Files & Interfaces:
- `lib/api/openMeteo.ts`, `lib/api/usdaSoilSurvey.ts`, etc.
- `lib/llm/plantRecommendations.ts`
- `supabase/functions/assemble-profile/index.ts`
- `supabase/functions/get-recommendations/index.ts`

### Acceptance Criteria:
- All external API calls succeed and gracefully degrade if one fails.
- Complete `EnvironmentalProfile` returned within 3 seconds of scan.
- LLM returns highly formatted JSON containing 6-8 plants.
- Cache mechanism effectively limits third-party API usage.
