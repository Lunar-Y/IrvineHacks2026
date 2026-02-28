# LawnLens Part 1: Foundation & Infrastructure

## Role: Foundation Engineer
**Goal:** Build the buildable "Skeleton" of the LawnLens app.

### Scope:
1. **Expo Setup:** Initialize with TypeScript and `expo-router` (Tabs template).
2. **ViroReact Integration:** Configure `@viro-community/react-viro` for AR.
3. **State Management:** Setup `Zustand` for global state (scans, saved plants).
4. **Data Fetching:** Configure `TanStack Query`.
5. **Supabase Client:** Initialize connection to Supabase (URL and ANON_KEY).
6. **Permissions:** Implement `expo-camera` and `expo-location` permission handling.
7. **Navigation:** Setup 4 main tabs: Scan, My Plants, Care, Impact.

### Key Files & Interfaces:
- `lib/store/scanStore.ts`
- `lib/store/profileStore.ts`
- `lib/api/supabase.ts`
- `app/(tabs)/_layout.tsx`

### Acceptance Criteria:
- App builds and runs on a physical device.
- Tab navigation works smoothly.
- Camera and Location permissions are requested on the Scan tab.
- Supabase client is successfully initialized and can be imported.
- Viro AR scene can be initialized without crashing.
