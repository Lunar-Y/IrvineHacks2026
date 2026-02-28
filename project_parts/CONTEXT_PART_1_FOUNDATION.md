# LawnLens Part 1: Foundation & Infrastructure

## Role: Foundation Engineer
**Goal:** Build the buildable "Skeleton" of the LawnLens app, establishing the core architecture, navigation, and state management.

### Scope & Tasks:
1. **Expo & Environment Setup:**
   - Initialize project with React Native + Expo SDK 51+ (TypeScript template).
   - Configure NativeWind (Tailwind) for styling.
   - Set up `.env` for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. **Core Dependencies:**
   - Install `expo-camera`, `expo-location`, `expo-sensors`, `expo-haptics`, `expo-file-system`, `expo-sharing`.
   - Setup ViroReact (do this early as it has complex native setup).
3. **App Architecture & Navigation:**
   - Implement bottom tab navigation (`app/(tabs)`): Scan, My Plants, Care, Impact.
   - Implement modal screens: Onboarding, Scanning Animation, Recommendations, Plant Detail, AR View.
   - Implement Progressive Disclosure: never overwhelm, one decision at a time.
4. **State Management Setup:**
   - Setup Zustand stores: `scanStore.ts`, `plantsStore.ts`, `profileStore.ts`, `impactStore.ts`.
5. **Database (Supabase) Setup:**
   - Initialize Supabase project and create DB schema:
     - `plant_cache` (id, perenual_id, common_name, scientific_name, data, image_urls, cached_at)
     - `saved_plants` (id, session_id, plant_common_name, scientific_name, environmental_profile, recommendation_data, saved_at)
     - `scan_sessions` (id, coordinates, environmental_profile, recommendations, created_at)
6. **Onboarding Experience:**
   - Build 3-step onboarding flow (hero animation -> location permission -> camera permission).
   - Use plain-English explanations for permissions. No account creation required.

### Key Files & Interfaces:
- `app/(tabs)/_layout.tsx`
- `app/onboarding.tsx`
- `lib/store/*.ts`
- `lib/api/supabase.ts`

### Acceptance Criteria:
- App builds and runs on a physical device.
- Tab navigation and Onboarding flows work smoothly and look beautiful.
- Camera and Location permissions are requested on the Scan tab.
- Supabase client is successfully initialized and schema is ready.
