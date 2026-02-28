# LawnLens — AI-Powered Lawn Scanning & AR Plant Recommendation App
## Gemini Project Context File

---

## Project Overview

You are helping build **LawnLens**, a mobile application that scans a user's lawn using their phone camera, aggregates environmental and soil data from multiple free APIs, uses AI to recommend the best plants for that specific yard, and renders those plants in Augmented Reality at their mature size. Additional features include a week-by-week care schedule adapted to local weather forecasts and a where-to-buy layer using nearby nurseries and online retailers.

The app must be built within **one week** by a small team (treat as 1–2 developers). Prioritize free tools and APIs. Paid services are acceptable only where no free alternative exists, and must be flagged clearly.

---

## Tech Stack

### Mobile Client
- **Framework:** React Native with Expo SDK 51+
- **Language:** TypeScript throughout
- **AR Engine:** ViroReact (wraps ARKit on iOS, ARCore on Android)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Styling:** NativeWind (Tailwind for React Native)
- **Navigation:** React Navigation v6
- **Key Expo Modules:**
  - `expo-camera` — live camera feed and frame capture
  - `expo-location` — GPS coordinates
  - `expo-sensors` — ambient light sensor, device orientation
  - `expo-haptics` — haptic feedback at key interactions
  - `expo-file-system` — local caching of plant models and images
  - `expo-sharing` — share impact card to social/messages
  - `react-native-view-shot` — render offscreen share card as image
  - `react-native-gesture-handler` — drag-to-AR pan gesture on plant cards
  
### Backend / Middleware
- **Platform:** Supabase (free tier)
  - **Edge Functions** (Deno runtime) — API orchestration layer, protects all API keys
  - **Postgres** — caches plant data, user saved plants, scan sessions
  - **Supabase Storage** — stores downloaded glTF plant models
- **Fallback option:** Node.js + Express on Railway (free tier) if Supabase Edge Functions prove limiting

### AI & ML
- **On-device segmentation:** Google ML Kit Scene Segmentation (free, no API key, runs locally)
- **LLM reasoning:** Daedalus Labs API: Anthropic Claude (`claude-sonnet-4-6`) — primary plant recommendation engine, also used for camera frame vision analysis
- **Input to LLM:** Structured JSON bundle of all environmental data + base64 camera frame
- **Output from LLM:** Structured JSON array of plant recommendations

### External APIs (All Free Unless Noted)
| API | Purpose | Cost |
|-----|---------|------|
| Open-Meteo | Current weather + 7-day forecast | Free, no key |
| USDA Web Soil Survey | Soil composition, drainage, pH by GPS | Free |
| USDA Plant Hardiness Zone | Growing zone by coordinates | Free |
| NOAA Climate Data | Historical frost dates by ZIP | Free |
| Perenual API | Plant database, care data, images | Free (100 req/day) |
| Google Places API | Nearby nurseries | Free under $200/mo credit |
| Sketchfab API | glTF 3D plant model downloads | Free with attribution |
| State invasive species lists | Filter harmful plant recommendations | Free (varies by state) |

### AR Asset Strategy
- Pre-download and cache **10–12 high-quality glTF plant models** covering archetypes: groundcover, ornamental grass, flowering shrub, evergreen shrub, small tree, medium tree, climbing vine, perennial flower
- LLM maps any recommended plant to the closest archetype model
- Models stored in Supabase Storage, downloaded on first app launch
- Rendered via `Viro3DObject` component in ViroReact
- Ground shadow plane rendered beneath each model for realism

---

## Data Pipeline — Environmental Profile Assembly

When a user confirms a lawn scan, the backend assembles a complete **Environmental Profile** before querying the LLM. This is the single most important data structure in the app. Every recommendation flows from it.

```typescript
interface EnvironmentalProfile {
  // Location
  coordinates: { lat: number; lng: number };
  elevation_meters: number;
  usda_hardiness_zone: string;           // e.g. "7b"
  
  // Weather
  current_temp_celsius: number;
  annual_avg_rainfall_mm: number;
  forecast_7day: WeatherDay[];
  last_spring_frost_date: string;        // from NOAA
  first_fall_frost_date: string;         // from NOAA
  growing_days_per_year: number;
  
  // Soil (from USDA Web Soil Survey)
  soil_texture: "sandy" | "loamy" | "clay" | "silty" | "peaty" | "chalky";
  soil_drainage: "very_rapid" | "rapid" | "well" | "moderately_well" | "somewhat_poor" | "poor" | "very_poor";
  soil_ph_range: { min: number; max: number };
  organic_matter_percent: number;
  
  // Sun Exposure
  sun_exposure: "full_sun" | "partial_sun" | "partial_shade" | "full_shade";
  sun_source: "user_input" | "estimated_from_sensors";
  
  // Yard Geometry (from AR plane detection)
  estimated_slope: "flat" | "gentle" | "moderate" | "steep";
  near_structure: boolean;               // wall, fence detected in frame
  near_water_body: boolean;              // within 100m of pond/stream from GPS
  
  // Camera Vision Analysis (from Claude)
  detected_existing_plants: string[];
  detected_yard_features: string[];      // e.g. "south-facing brick wall", "concrete pathway"
  estimated_microclimate: string;
  
  // Restrictions
  invasive_species_to_avoid: string[];   // from state dataset
  water_restriction_level: 0 | 1 | 2 | 3;
  wildfire_risk_zone: boolean;
  
  // User Preferences
  intended_purpose: PlantPurpose[];      // "privacy" | "pollinators" | "edible" | "ground_cover" | "aesthetic" | "low_maintenance"
  maintenance_level: "none" | "minimal" | "moderate" | "high";
  budget_usd: number;
  pets_present: boolean;
  children_present: boolean;
  existing_nearby_plants: string[];
}
```

---

## LLM Integration

### Vision Analysis Prompt (Step 1 — runs on camera frame)
```
You are an expert horticulturalist and landscape analyst. Analyze this image of a yard/lawn area.

Return ONLY valid JSON in this exact structure:
{
  "detected_existing_plants": ["string"],
  "detected_yard_features": ["string"],
  "estimated_microclimate": "string",
  "visible_soil_clues": "string",
  "estimated_sun_exposure": "full_sun | partial_sun | partial_shade | full_shade",
  "confidence_notes": "string"
}

Be specific. Note wall materials, pavement proximity, tree canopy coverage, grass condition, visible weeds, slope indicators.
```

### Plant Recommendation Prompt (Step 2 — runs after full profile assembled)
```
You are an expert horticulturalist. Based on the environmental profile below, recommend 6-8 plants that would genuinely thrive in this specific yard.

Environmental Profile:
{FULL_ENVIRONMENTAL_PROFILE_JSON}

User Preferences:
- Intended purpose: {purposes}
- Maintenance tolerance: {maintenance_level}
- Budget: ${budget}
- Pets present: {pets}
- Children present: {children}
- Must avoid (invasive in this region): {invasive_list}
- Already growing nearby: {existing_plants}

Return ONLY a valid JSON array. Each object must have:
{
  "rank": number,
  "common_name": "string",
  "scientific_name": "string",
  "perenual_search_keyword": "string",
  "model_archetype": "groundcover | ornamental_grass | flowering_shrub | evergreen_shrub | small_tree | medium_tree | climbing_vine | perennial_flower",
  "mature_height_meters": number,
  "mature_width_meters": number,
  "why_it_fits": "2-3 sentence explanation specific to THIS yard's conditions",
  "care_difficulty": "easy | moderate | hard",
  "watering_frequency_days": number,
  "sunlight_requirement": "full_sun | partial_sun | partial_shade | full_shade",
  "best_planting_month": number,
  "estimated_cost_usd": { "min": number, "max": number },
  "companion_friendly": ["string"],
  "incompatible_with": ["string"],
  "toxic_to_pets": boolean,
  "toxic_to_humans": boolean,
  "wildlife_benefit": "string",
  "environmental_data": {
    "carbon_sequestration_kg_per_year": number,
    "water_usage_liters_per_week": number,
    "vs_lawn_water_savings_percent": number,
    "native_species": boolean,
    "pollinator_support_score": "1 | 2 | 3",
    "biodiversity_score": "1 | 2 | 3",
    "urban_heat_reduction_score": "1 | 2 | 3",
    "soil_erosion_prevention": boolean,
    "nitrogen_fixing": boolean
  }
}

Rank by fit score — best match first. Never recommend anything in the invasive list. Never recommend anything toxic if pets or children are present.
```

### Care Schedule Prompt (Step 3 — runs per saved plant)
```
You are a plant care specialist. Generate a week-by-week care schedule for {plant_common_name} ({plant_scientific_name}) planted in {usda_zone}, {climate_description}.

Weather forecast for next 7 days: {forecast_json}
Current season: {season}
User's maintenance level: {maintenance_level}

Return ONLY valid JSON:
{
  "this_week_tasks": [
    {
      "day": "Monday | Tuesday | ...",
      "task": "string",
      "reason": "string",
      "duration_minutes": number,
      "skip_if": "string | null"
    }
  ],
  "monthly_recurring": ["string"],
  "seasonal_notes": { "spring": "string", "summer": "string", "fall": "string", "winter": "string" },
  "warning_signs": ["string"]
}

If rain is forecast within 2 days, mark watering tasks with skip_if: "rain forecast".
```

---

## Development Stages

### Stage 1 — Foundation (Day 1)
**Goal:** Skeleton app runs on device with camera and location working.

Tasks:
- Initialize Expo project with TypeScript template
- Install and configure ViroReact (do this first — it has the most complex native setup)
- Set up React Navigation with 4 screens: Scan, Recommendations, Plant Detail, Care Dashboard
- Configure Supabase project, create tables (see schema below), deploy skeleton Edge Function
- Implement location permission request and GPS acquisition
- Implement camera permission and live camera preview rendering
- Verify AR session initializes on both iOS and Android test devices

Supabase Schema:
```sql
-- Cache plant data to protect Perenual rate limit
CREATE TABLE plant_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perenual_id INTEGER UNIQUE,
  common_name TEXT,
  scientific_name TEXT,
  data JSONB,
  image_urls TEXT[],
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved plants
CREATE TABLE saved_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  plant_common_name TEXT,
  plant_scientific_name TEXT,
  environmental_profile JSONB,
  recommendation_data JSONB,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scan sessions
CREATE TABLE scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinates POINT,
  environmental_profile JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Stage 2 — Lawn Detection (Day 2)
**Goal:** Camera detects lawn area and user can confirm it.

Tasks:
- Integrate ML Kit Scene Segmentation via `@react-native-ml-kit/subject-segmentation`
- Process camera frames at 3fps (throttle to avoid device heat)
- Render green tint overlay on detected ground/grass regions
- Implement confidence threshold — only show "Tap to confirm" button when coverage > 40% of frame
- On confirmation: freeze frame, save as base64 for LLM vision analysis
- Begin ARKit/ARCore plane detection session simultaneously
- Store detected plane dimensions and orientation

### Stage 3 — Environmental Data Pipeline (Day 2–3)
**Goal:** Full Environmental Profile assembled within 3 seconds of scan confirmation.

Supabase Edge Function `/assemble-profile`:
```typescript
// Fires all requests in parallel
const [weather, soilData, hardinessZone, frostDates, visionAnalysis] = await Promise.all([
  fetchOpenMeteo(lat, lng),
  fetchUSDAsoilSurvey(lat, lng),
  fetchHardinessZone(lat, lng),
  fetchNOAAFrostDates(zipCode),
  analyzeFrameWithClaude(base64Image)
]);

// Merge with user preferences and device sensor data
// Return complete EnvironmentalProfile object
```

- Fetch invasive species list for the detected state (cache in Postgres, update weekly)
- Derive elevation from GPS altitude field
- Detect proximity to water body using a simple reverse geocoding check
- Merge everything into the `EnvironmentalProfile` interface above

During this stage on the client: show an animated "Reading your environment" screen with individual data points populating — sunlight icon, soil icon, temperature icon, zone badge — each appearing as its data resolves. This builds perceived intelligence.

### Stage 4 — Recommendation Engine (Day 3)
**Goal:** LLM returns 6–8 ranked plant recommendations, enriched with Perenual data.

Supabase Edge Function `/get-recommendations`:
1. Send Environmental Profile to Claude with the recommendation prompt above
2. Parse returned JSON array
3. For each plant, check `plant_cache` table first
4. If not cached, query Perenual API with `perenual_search_keyword`
5. Merge Perenual images and care data with LLM recommendation data
6. Cache in `plant_cache` table
7. Return enriched recommendation array to client

Client-side: render horizontal scrolling plant cards over the still camera frame. Implement card tap → Plant Detail screen transition.

### Stage 5 — AR Visualization (Days 4–5)
**Goal:** User can place a 3D plant model on their detected lawn surface.

Tasks:
- Download and bundle 12 glTF archetype models (do this during Stage 1 in background)
- Map each recommendation to its `model_archetype`
- On "View in AR" tap: launch ViroReact AR session
- Show instruction toast: "Point camera at your lawn"
- When ARKit/ARCore detects a horizontal plane: render a subtle grid indicator on the plane
- On plane tap: place the plant model at that point, scaled to `mature_height_meters`
- Implement pinch gesture for manual scale adjustment
- Implement one-finger drag for repositioning
- Render a soft shadow plane beneath the model (`ViroQuad` with shadow texture)
- Add a screenshot button that saves the AR view to camera roll
- Implement graceful degradation: if AR not supported, composite the plant image onto the saved scan photo using a flat 2D overlay instead

### Stage 6 — Care Schedule & Where to Buy (Day 5–6)
**Goal:** Complete post-recommendation features.

Care Schedule:
- Call `/generate-care-schedule` Edge Function for each saved plant
- Render as a week calendar view in the Care Dashboard tab
- Merge tasks across all saved plants into a unified calendar
- Cross-reference forecast: if rain within 48 hours, visually dim watering tasks and show "Rain expected" badge
- Implement local notifications for upcoming care tasks via `expo-notifications`

### Stage 7 — Polish & Integration (Day 6–7)
**Goal:** Coherent end-to-end experience, error handling, performance.

- Implement loading skeletons for all async screens
- Error boundaries for API failures with human-readable fallback messages
- Haptic feedback: medium impact on scan confirmation, light impact on plant card tap, success notification on AR placement
- Onboarding flow (3 screens, first launch only, stored in AsyncStorage)
- Performance: verify camera + AR maintains 30fps on mid-range Android device
- Test invasive species filtering works correctly for at least 3 different states
- Test toxic plant filtering with pets/children flags enabled
- App icon, splash screen, basic branding

---

## UX Flow

### Design Principles
1. **Camera is home base** — always return to it, never bury it
2. **Progressive disclosure** — one decision at a time, never overwhelm
3. **Perceived intelligence** — make data assembly feel thoughtful, not instant-loading
4. **Graceful degradation** — every feature has a fallback if hardware or API fails
5. **Sub-60 second core flow** — from launch to first plant recommendation in under 60 seconds

### Screen Architecture
```
Bottom Nav:
├── 📷 Scan (default home tab)
├── 🌿 My Plants (saved recommendations)
├── 📅 Care Dashboard (weekly task calendar)
└── 🌍 Impact (Environment Statistics)

Modal Screens (no nav bar):
├── Scanning Animation (full screen, brief)
├── Recommendations (bottom sheet over camera)
├── Plant Detail (full screen, tabbed)
└── AR View (full screen)
```

### Flow Step by Step

**Onboarding (first launch only)**
- Screen 1: Hero animation of the AR experience, tagline, "Get Started" CTA
- Screen 2: Location permission request with plain-English "why" explanation
- Screen 3: Camera permission request
- No account creation — value first, account never required for core features

**Scan Screen**
- Camera opens within 1 second of app launch
- Animated guide ring pulses in center: "Point at your lawn"
- ML Kit segmentation overlays a green tint on detected lawn areas in real time
- Confidence meter fills subtly at bottom of screen
- When confidence > 40%: "Looks good — tap to scan" button animates up from bottom
- Bottom toolbar (minimal): flashlight toggle, settings icon, "My Plants" shortcut

**Scanning Moment (2–3 seconds)**
- Screen freeze-frames with a brief flash effect
- Grid/measurement animation overlays the frozen frame
- Data points populate one by one with icons and labels:
  - ☀️ "Partial shade detected"
  - 🌡️ "Zone 7b · 18°C avg"
  - 💧 "Well-drained loam soil"
  - 🗺️ "Last frost: April 3"
- Smooth transition to Recommendations

**Recommendations Screen**
- Bottom sheet slides up over the **live** camera frame (lawn remains visible and active behind the sheet)
- Header: "6 plants for your yard" with subtle zone/sun badges
- Horizontal scrolling list of plant cards 
- Each card contains:
  - Plant photo (from Perenual) on the left, 80×80px rounded
  - Common name (large) + scientific name (small, muted) on the right
  - "Best Match" badge on rank 1 card
  - One-line fit reason (e.g. "Thrives in your Zone 7b partial shade")
  - Difficulty pill: Easy / Moderate / Hard
  - Mature size indicator (height × width)
  - Subtle drag handle icon (⠿) on the right edge with micro-label "drag to place"

**Two distinct interactions on plant cards:**

1. **Tap the card** → opens Plant Detail as a modal sheet that slides up over the Recommendations screen. Dismissing Plant Detail (swipe down or X button) returns the user exactly to the Recommendations screen with scroll position preserved. The lawn camera remains live underneath the entire time.

2. **Drag the card upward toward the lawn area** → triggers AR placement mode:
   - Card lifts with a shadow elevation effect and slight scale-up (1.05×) to signal it's been grabbed
   - Bottom sheet compresses/fades to reveal more of the live camera
   - A glowing drop-zone indicator pulses on the detected lawn plane in the camera view
   - A ghost/silhouette of the plant model appears at the drag position as the user moves their finger over the lawn area
   - On finger release over the detected plane: plant model drops in with a scale-up animation and a subtle haptic confirmation
   - On finger release outside the lawn area: card snaps back to its position with a bounce animation, no placement occurs
   - Implementation: use React Native's `PanResponder` or `react-native-gesture-handler`'s `Gesture.Pan()` to track drag. Monitor Y-position threshold — when drag travels more than 80px upward, switch the camera feed from frozen to live AR mode. Track whether release coordinates fall within the ARKit/ARCore detected plane bounds.

**Plant Detail Screen** (modal over Recommendations, not a separate nav screen)
- Hero image (full width, parallax scroll)
- Common name + scientific name header
- Swipe-down handle at top + X button — both dismiss back to Recommendations
- Two tabs: **Overview · Care**
- Overview tab:
  - LLM-generated "Why it fits your yard" paragraph (specific, not generic)
  - Key stats row: mature size, water needs, sun, difficulty
  - Companion plants and plants to avoid
  - Wildlife benefit note
  - Environmental impact preview: carbon sequestration estimate, water impact badge (see Environment Statistics section)
- Care tab:
  - This week's tasks as cards with day labels
  - Weather-adaptive messaging ("Skip watering — rain Thursday")
  - Monthly recurring tasks list
  - Seasonal notes accordion
- Persistent floating button at bottom: **"Drag card to place in yard ↑"** — tapping this dismisses the modal and highlights the drag handle on the card with a pulsing animation to guide the user

**AR View** (entered via drag gesture from Recommendations, or "See in yard" from Plant Detail)
- Camera switches to full AR mode, bottom sheet collapses to a slim tray
- Toast message: "Walk to your lawn and point down" (if plane not yet detected)
- Plane detection indicator: subtle green grid pulses on detected lawn surface
- On drag-release or plane tap: plant model drops in with a scale-up animation
- Multiple plants can be placed — each placed plant appears as a small thumbnail in a horizontal tray at the bottom
- Bottom controls:
  - 📸 Screenshot / share button
  - 🗑️ Remove last plant
  - ↩ Back to recommendations (preserves all placements as a saved "yard plan")
- If AR unsupported: "AR not available on this device" toast + fallback to 2D composite — plant image is perspective-warped and overlaid onto the frozen scan photo at the estimated ground plane position

**Care Dashboard Tab**
- Week calendar at top (horizontal scroll, today highlighted)
- Task cards below grouped by day
- Each card: plant name, task description, estimated duration, weather note if relevant
- Completed tasks can be checked off (stored locally)
- "Add to calendar" export via `expo-calendar`

**Environment Statistics Screen / Tab**

This is a dashboard that calculates the cumulative ecological and environmental impact of all plants the user has placed or saved. It updates live as plants are added. Present as a dedicated tab or accessible from the Care Dashboard via a banner CTA ("See your yard's impact →").

Data is calculated client-side using per-plant constants returned by the LLM recommendation (add these fields to the recommendation JSON schema):
```typescript
// Add to plant recommendation JSON output:
"environmental_data": {
  "carbon_sequestration_kg_per_year": number,     // CO₂ absorbed annually at maturity
  "water_usage_liters_per_week": number,           // weekly water requirement
  "vs_lawn_water_savings_percent": number,         // savings vs equivalent area of turf grass
  "native_species": boolean,
  "pollinator_support_score": 1 | 2 | 3,          // 1=low, 3=high
  "biodiversity_score": 1 | 2 | 3,
  "urban_heat_reduction_score": 1 | 2 | 3,        // canopy cooling effect
  "soil_erosion_prevention": boolean,
  "nitrogen_fixing": boolean                       // legumes etc
}
```

**Statistics displayed (aggregate across all saved/placed plants):**

*Carbon Impact*
- Total CO₂ sequestered per year (kg) — displayed as "equivalent to driving X miles" for context
- Running total shown as a filling leaf icon progress bar
- Comparison: "Your plant selection sequesters 3× more carbon than the same area of grass"

*Water Efficiency*
- Total water needed per week (liters/gallons) for all placed plants
- Savings vs. equivalent turf grass area (%) — turf uses ~25L/m²/week baseline
- "You're saving X liters per week vs. a traditional lawn"
- If any water restrictions are active for the user's region, a badge shows "Your selection is drought-compliant ✓" or a warning if it isn't

*Biodiversity & Wildlife*
- Pollinator support score (aggregate) rendered as a bee icon rating
- Number of native species in selection (badge: "X of Y plants are native to your region")
- Wildlife species supported: aggregate list pulled from `wildlife_benefit` fields ("Monarch butterflies, Ruby-throated hummingbirds, Mason bees...")
- Biodiversity index score (1–10) calculated from diversity of plant types and native status

*Soil & Ecosystem Health*
- Nitrogen-fixing plants count (these improve soil for neighbors)
- Erosion prevention: area of slope coverage if applicable
- Organic matter contribution score

*Urban Heat*
- Urban heat island reduction estimate — calculated from canopy cover of placed plants at mature size
- "Your yard will be ~X°F cooler at maturity than a paved surface"
- Displayed as a simple before/after color temperature map of the yard

*Overall Impact Score*
- A single "Yard Health Score" from 0–100 combining carbon, water efficiency, biodiversity, and native species ratio
- Color coded: 0–40 red, 41–70 amber, 71–100 green
- Shareable card: "My LawnLens yard scores 84/100 for environmental impact 🌿" with a stylized graphic for social sharing via `expo-sharing`

**Behavior notes for implementation:**
- All calculations are deterministic from the LLM-returned `environmental_data` fields — no additional API calls needed
- Stats update immediately when a plant is added or removed from the yard plan
- Turf grass baseline values are hardcoded constants (well-established horticultural data)
- The share card renders as an offscreen `ViewShot` (use `react-native-view-shot`) then saved to camera roll

---

## File Structure

```
/app
  /(tabs)
    /scan          — camera + detection screen
    /plants        — saved plants list
    /care          — care dashboard calendar
    /impact        — environment statistics dashboard
  /plant/[id]      — plant detail (modal over recommendations)
  /ar/[id]         — AR view (entered via drag gesture or plant detail)
  /onboarding      — first launch flow

/components
  /camera
    LawnDetectionOverlay.tsx
    ScanConfirmButton.tsx
    ScanningAnimation.tsx
  /ar
    PlantARScene.tsx
    ARInstructions.tsx
    ARControls.tsx
  /plants
    PlantCard.tsx              — card with tap (detail) and drag (AR) interactions
    PlantCardDragHandler.tsx   — PanResponder logic for drag-to-AR gesture
    PlantDetail.tsx            — modal sheet, dismisses back to Recommendations
    CareTaskCard.tsx
    NurseryMap.tsx
    EnvironmentStats.tsx       — aggregate impact dashboard
    ImpactShareCard.tsx        — offscreen ViewShot for social sharing
  /ui
    BottomSheet.tsx
    LoadingSkeleton.tsx
    DataPopulator.tsx    — the animated "reading environment" component

/lib
  /api
    openMeteo.ts
    usdaSoilSurvey.ts
    hardinessZone.ts
    noaaFrost.ts
    perenual.ts
    googlePlaces.ts
  /llm
    visionAnalysis.ts
    plantRecommendations.ts
    careSchedule.ts
  /ar
    modelLoader.ts       — downloads and caches glTF models
    archetypeMap.ts      — maps plant → model archetype
  /store
    scanStore.ts         — Zustand: current scan session
    plantsStore.ts       — Zustand: saved plants + placed yard plan
    profileStore.ts      — Zustand: environmental profile
    impactStore.ts       — Zustand: aggregate environmental stats (derived from plantsStore)

/supabase
  /functions
    /assemble-profile    — orchestrates all environmental APIs
    /get-recommendations — LLM + Perenual enrichment
    /generate-care-schedule

/assets
  /models              — 12 glTF plant archetype models
  /images
  /fonts
```

---

## Environment Variables

```bash
# Supabase (backend only — never expose to client except ANON key)
SUPABASE_URL=
SUPABASE_ANON_KEY=           # safe for client
SUPABASE_SERVICE_ROLE_KEY=   # Edge Functions only

# In Supabase Edge Function secrets only:
DAEDALUS_API_KEY=
PERENUAL_API_KEY=

# Client-side (.env)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

**Never put Daedalus or Perenual API keys in the Expo client bundle.** All third-party API calls route through Supabase Edge Functions.

---

## Cost Summary

| Resource | Free Tier | Estimated Weekly Dev Usage |
|----------|-----------|---------------------------|
| Expo / React Native | Free | — |
| Supabase | 500MB DB, 2GB storage, 500K Edge Function invocations | Well within limits |
| Open-Meteo | Unlimited | Free |
| USDA APIs | Unlimited | Free |
| NOAA Climate Data | Unlimited | Free |
| Perenual API | 100 req/day | Cache to stay under limit |
| Daedalus API | Pay per token | ~$10–20 for a week of dev |
| Sketchfab / Poly Pizza models | Free with attribution | — |
| ViroReact | Open source | — |
| **Total** | | **~$10–20** |



---

## Known Risks & Mitigations

**ViroReact setup complexity** - If it fails to build after 4 hours, fallback to `expo-three` with `three.js` for basic 3D rendering, accepting reduced AR quality.

**Perenual 100 req/day limit** — aggressive Supabase caching is mandatory. Seed the cache with the 50 most common plants for the target test region so demo runs entirely from cache.

**glTF model quality** — do a Sketchfab/Poly Pizza audit and download all 12 archetype models immediately. 

**Claude API JSON reliability** — always wrap LLM response parsing in try/catch with a retry. Add `"Return ONLY valid JSON, no markdown, no explanation"` to every prompt. Validate with Zod schemas before using any LLM output.

**AR on Android fragmentation** — test on a real mid-range Android device. ARCore requires Google Play Services and isn't available on all devices. Implement the 2D fallback by Day 5 so it's ready.

---

*This document reflects the full product design and technical architecture of LawnLens as of initial planning. Update this file as decisions change during development.*