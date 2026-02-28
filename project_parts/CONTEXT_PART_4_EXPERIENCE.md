# LawnLens Part 4: AR & User Experience

## Role: AR & UX Developer
**Goal:** Build the interactive 3D placement, post-scan details, and final user impact metrics.

### Scope & Tasks:
1. **Recommendations & Detail UI:**
   - Slide up a bottom sheet over the live camera frame displaying plant cards.
   - Tap card -> open Plant Detail modal (Why it fits, stats, companion plants, care).
2. **AR Visualization (Stage 5):**
   - Drag plant card up -> enter AR placement mode.
   - Use ViroReact. Download 10-12 glTF archetype models initially. 
   - Render a drop-zone indicator and ghost silhouette.
   - On release on plane: drop model with scale-up animation, scaled to `mature_height_meters`. Add soft shadow plane.
   - Fallback: Perspective warp 2D image over frozen scan if AR fails.
3. **Care Dashboard (LLM Step 3):**
   - Edge Function `/generate-care-schedule` returns week-by-week tasks.
   - Merge tasks of all saved plants.
   - Adaptive care weather checks (e.g., skip watering if rain forecast).
4. **Environment Statistics (Impact Tab):**
   - Calculate cumulative ecological impact for user's selected plants.
   - Show: Total CO2 sequestered, water savings vs grass, biodiversity score, urban heat reduction.
5. **Share Card:**
   - Use `react-native-view-shot` to produce "My LawnLens yard scores X/100" shareable graphic.

### Key Files & Interfaces:
- `components/plants/PlantCard.tsx`, `components/plants/PlantCardDragHandler.tsx`
- `components/ar/PlantARScene.tsx`, `app/ar/[id].tsx`
- `components/plants/EnvironmentStats.tsx`
- `components/plants/ImpactShareCard.tsx`
- `lib/llm/careSchedule.ts`

### Acceptance Criteria:
- Fluid drag-and-drop AR placement. Models are cached and rendered nicely.
- Intuitive and informative Plant Detail and Care screens.
- Math for Impact Stats is verified and reacts live to adding/removing plants.
- Users can export screenshot to share their impact score.
