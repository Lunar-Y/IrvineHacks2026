# Demo Spec: AR-First Plant Drag-and-Drop From Recommendations

## 1. Goal
Replace the current scan/analyze/recommend flow with a demo-ready AR + recommendations experience:
- AR environment is visible in the top region,
- the recommendations section stays open as the card source,
- users drag plant cards from recommendations into the AR environment,
- dropping the card places a 3D plant in AR.

This document is implementation-oriented and intended to be decision complete for the coding phase.

## 2. Current State (Repo Audit)
- `app/(tabs)/scan.tsx` currently runs camera capture + simulated scan states and routes to recommendations.
- `app/recommendations.tsx` already has strong drag-lift gesture logic that can be reused.
- `components/ar/PlantARScene.tsx` exists as a prototype but is not wired into the main flow.
- `app/ar/[id].tsx` is a placeholder screen and does not render AR content.
- `@viro-community/react-viro` is installed but package-lock marks it deprecated in favor of `@reactvision/react-viro`.
- There are no `assets/models/*` files yet, so AR model rendering cannot be complete without adding assets.

## 3. Product Scope for Demo
### In Scope
- AR opens directly in Scan tab.
- Recommendations section is visible/open during placement flow.
- Drag plant card upward from recommendations and drop into AR space.
- Multiple placements of same or different plant are supported.
- User can reposition placed plants by dragging the 3D model in AR.
- A no-plane fallback placement mode exists so live demo does not fail.

### Out of Scope
- Full environmental profile assembly.
- LLM recommendation generation during demo interaction.
- Botanical species-accurate 3D models for every plant.
- Persistent cloud sync of placed plants.

## 4. User Flow (Detailed)
### Primary demo flow
1. User opens app and taps `Scan` tab.
2. App requests AR/camera permission if missing.
3. AR view appears with instruction overlay: `Move phone slowly to detect ground`.
4. Recommendations section is open and shows plant cards (image, name, short tags).
5. User long-presses a card and drags upward.
6. While dragging, a floating ghost card follows finger and AR drop zone highlights.
7. User releases in AR viewport.
8. App places corresponding 3D plant model in scene with scale based on `mature_height_meters`.
9. User drags placed model on plane to fine-tune position.
10. User repeats with more cards.

### Failure flow
1. If plane not detected after timeout (e.g., 8 seconds), show `No plane yet - placing in front of camera`.
2. Drop still succeeds using fallback fixed-distance placement.
3. User can continue placing without interruption.

### Exit flow
1. User navigates to other tabs.
2. On return to Scan tab, placements are restored from in-memory store (default behavior for session).

## 5. Technical Flow (Detailed)
### 5.1 Data source and normalization
1. Use `buildDummyDeck(6)` from `lib/recommendations/deckBuilder.ts`.
2. Store normalized plant list in new AR store as catalog.
3. Keep catalog immutable during demo session.

### 5.2 Gesture to placement event pipeline
1. Reuse card lift gesture pattern from `app/recommendations.tsx` + `components/plants/PlantCard.tsx`.
2. On drag start:
   - capture card rect (`x, y, width, height`) and active plant id.
3. On drag move:
   - update overlay translation with `react-native-reanimated`.
   - set `isOverDropZone` boolean when finger y is above navbar threshold.
4. On drag end:
   - if valid drop, dispatch `queuePlacement({ plantId, dropX, dropY, screenWidth, screenHeight })`.
   - if invalid drop, spring card back.

### 5.3 AR scene consumption pipeline
1. AR scene listens to placement queue in store.
2. On new queue item:
   - resolve plant from catalog by `plantId`.
   - map `model_archetype` to local 3D model source.
   - compute scale from `mature_height_meters`.
   - compute initial position:
     - preferred: via plane hit test / plane selector result.
     - fallback: fixed distance in front of camera.
3. Push `ARPlacedPlant` into `placedPlants`.
4. Render `Viro3DObject` for each placed plant.
5. Enable model drag with plane-locked movement and persist new position via store update.

### 5.4 Rendering and UX polish
1. Scene lighting:
   - one ambient light,
   - one directional/spot light.
2. Shadow:
   - render soft `ViroQuad` below each model.
3. Placement animation:
   - scale-in from `0.01` to target scale over ~200ms.
4. Instructions:
   - overlay text states:
     - `finding_plane`,
     - `plane_ready`,
     - `fallback_mode`.

## 6. Required Architecture Changes
### New files
1. `types/ar.ts`
2. `lib/store/arStore.ts`
3. `lib/ar/archetypeMap.ts`
4. `lib/ar/scale.ts` (optional if kept separate)

### Modified files
1. `app/(tabs)/scan.tsx`
2. `components/ar/PlantARScene.tsx`
3. `components/plants/PlantCard.tsx` (if drag callbacks need extension)
4. `app/recommendations.tsx` (source of drag cards for AR placement)
5. `package.json` and lockfile for Viro package migration
6. `app.json` only if plugin config changes are required

### Route behavior
- `Scan` tab is the primary AR workspace.
- `recommendations` remains active and is the visible card source for drag-to-AR.
- `app/ar/[id].tsx` can remain for later detail-mode AR entry, but is not required for this demo path.

## 7. Store and Type Contracts
### `types/ar.ts`
```ts
export interface ARDropPayload {
  plantId: string;
  dropX: number;
  dropY: number;
  screenWidth: number;
  screenHeight: number;
}

export interface ARPlacedPlant {
  id: string;
  plantId: string;
  position: [number, number, number];
  scale: [number, number, number];
  modelKey: string;
  createdAt: number;
}
```

### `lib/store/arStore.ts`
```ts
interface ARStore {
  catalog: RecommendationDeckItem[];
  placementQueue: ARDropPayload[];
  placedPlants: ARPlacedPlant[];
  setCatalog: (plants: RecommendationDeckItem[]) => void;
  queuePlacement: (payload: ARDropPayload) => void;
  consumeNextPlacement: () => ARDropPayload | null;
  addPlacedPlant: (plant: ARPlacedPlant) => void;
  movePlacedPlant: (id: string, position: [number, number, number]) => void;
  removePlacedPlant: (id: string) => void;
  resetSession: () => void;
}
```

## 8. AR Asset and Scaling Rules
### Asset strategy for demo
- Add 4-6 lightweight `.glb` models:
  - `small_tree.glb`
  - `flowering_shrub.glb`
  - `ornamental_grass.glb`
  - `groundcover.glb`
  - `perennial_flower.glb`
  - `fallback_plant.glb`

### Archetype mapping
- map `model_archetype` to one of the above files.
- if unknown archetype, use `fallback_plant.glb`.

### Scale mapping
- base rule: `targetScale = clamp(mature_height_meters * 0.12, 0.08, 0.45)`.
- apply uniformly on xyz for first demo iteration.

## 9. Demo Interaction Rules
1. Card is not consumed on place; user can place duplicates.
2. Maximum placed instances: 20 per session (performance cap).
3. If cap reached, show toast: `Plant limit reached for demo`.
4. Placement-only is valid MVP; delete/remove is a post-MVP enhancement.
5. If remove is implemented, it deletes only the selected placed instance.

## 10. Error Handling and Fallbacks
1. AR unsupported device:
   - show non-AR fallback message and a static placement preview area.
2. Model load failure:
   - place a fallback primitive marker and continue.
3. Plane detection timeout:
   - enter fallback fixed-distance placement mode automatically.
4. Store mismatch (missing plant id):
   - ignore placement event and log warning.

## 11. Performance Targets
1. Initial AR scene ready in < 2.5s on demo phone.
2. Placement response in < 500ms after drop.
3. Stable at >= 30 FPS with 6 placed models.
4. No crash during 5-minute continuous demo interaction.

## 12. Platform Strategy (Resolved)
1. Demo target is Android-only (ARCore).
2. iOS ARKit support is explicitly out of this demo-critical scope.
3. Keep fallback mode in case of weak plane detection even on Android.

## 13. Implementation Sequence (Engineering Order)
1. Migrate Viro dependency to supported package.
2. Add AR types/store and seed catalog from dummy deck.
3. Add assets/models and archetype-scale utilities.
4. Refactor `PlantARScene` to read store and render placed models.
5. Keep `app/recommendations.tsx` as a transparent modal overlay on top of the AR Scan screen and use it as the only drag source.
6. Wire drag-drop events from recommendations cards into AR placement queue.
7. Add fallback mode and user guidance overlays.
8. Add move behavior and placement cap.
9. Add optional remove behavior if time remains.
10. Run Android device tests and tune scale/position constants.

## 14. Test Scenarios
1. Launch Scan tab and verify AR loads with plant navbar.
2. Place one plant of each archetype.
3. Place same plant 3 times.
4. Move each placed plant.
5. (Optional) Remove a placed plant.
6. Force no-plane scenario and verify fallback placement.
7. Force model failure and verify fallback marker behavior.
8. Leave Scan tab and return; verify session persistence behavior.

## 15. Incremental Checkpoints (Must Pass In Order)
### Checkpoint 1: AR runtime boots on Android
Implementation slice:
- Viro package migration complete.
- AR view renders on Scan tab without crash.

Pass conditions:
1. App launches on physical Android dev build.
2. Opening Scan tab shows camera AR session within 2.5s.
3. No red screen or native crash after 60 seconds idle on Scan.

### Checkpoint 2: Recommendations overlay is visible over AR
Implementation slice:
- `app/recommendations.tsx` presented as transparent modal over Scan.
- Card deck renders from dummy data.

Pass conditions:
1. Recommendations UI is visible over live AR camera.
2. Swipe between cards works while AR remains active behind.
3. Dismissing and reopening recommendations does not reset AR session.

### Checkpoint 3: Drag gesture pipeline works (UI-only)
Implementation slice:
- Drag/lift from recommendation cards.
- Ghost card overlay tracks touch.

Pass conditions:
1. Long-press + drag starts reliably on active card.
2. Dragging upward crosses drop threshold and toggles drop-zone visual.
3. Invalid drop springs card back with no stuck drag state.

### Checkpoint 4: Drop event reaches AR store queue
Implementation slice:
- `queuePlacement` and `consumeNextPlacement` wired.

Pass conditions:
1. Valid drop enqueues exactly one placement payload.
2. Payload contains correct `plantId` and screen coordinates.
3. Queue drains correctly without duplicate consumption.

### Checkpoint 5: First plant placement renders in AR
Implementation slice:
- AR scene consumes queue and spawns `Viro3DObject`.

Pass conditions:
1. First valid drop creates one visible 3D plant model.
2. Unknown archetype falls back to default model.
3. Placement appears within 500ms of drop.

### Checkpoint 6: Scale and positioning rules are correct
Implementation slice:
- Mature height -> scale mapping and initial position logic.

Pass conditions:
1. Short plant and tall plant appear with visibly different sizes.
2. Scale stays within clamp range (`0.08..0.45`).
3. Initial spawn appears on detected plane, or in front of camera fallback mode.

### Checkpoint 7: Multi-placement stability
Implementation slice:
- Multiple instances and duplicate placement enabled.

Pass conditions:
1. User can place at least 6 plants in one session.
2. Duplicates of same plant place correctly each time.
3. AR scene stays responsive (target >= 30 FPS subjective smoothness).

### Checkpoint 8: In-scene manipulation
Implementation slice:
- Drag placed model on plane and persist position updates.

Pass conditions:
1. Placed model can be dragged to a new position.
2. Releasing model keeps it anchored at new location.
3. Moving camera around does not reset model positions.

### Checkpoint 9: Fallback behavior hardening
Implementation slice:
- No-plane mode + model-load failure fallback.

Pass conditions:
1. If plane not detected after timeout, user still can place plants.
2. Fallback instruction text appears clearly.
3. If model load fails, fallback marker/model appears and app continues.

### Checkpoint 10: Demo readiness gate
Implementation slice:
- Full happy path polish and regression pass.

Pass conditions:
1. End-to-end demo run works for 5 minutes without crash.
2. User can place, duplicate, and move plants repeatedly.
3. Navigating away and back to Scan keeps session state (in-memory).
4. All prior checkpoints remain green after final code merge.

## 16. Resolved Decisions (From Product Direction)
1. Placed plants persist only for current app session (no cross-restart persistence).
2. Unlimited duplicate placements are allowed.
3. Placement-only is acceptable MVP; deletion is a bonus if time permits.
4. Recommendations section remains active/open as the drag source.
5. Demo target is iPhone-only.

## 17. Assumptions (Default Until You Override)
1. Primary demo device is one Android phone with ARCore support.
2. In-memory session persistence is enough for the demo.
3. Duplicate placements are allowed.
4. Delete action may be omitted for MVP without blocking demo success.
5. Scan pipeline is intentionally bypassed but not deleted from codebase.

## 18. Sources
- Viro install and integration docs: https://viro-community.readme.io/docs/installation-instructions
- Viro integration with existing apps: https://viro-community.readme.io/docs/integrating-with-existing-apps
- Viro AR plane selector docs: https://viro-community.readme.io/docs/viroarplaneselector
- Viro 3D object docs: https://viro-community.readme.io/docs/viro3dobject
- Deprecated package notice: https://www.npmjs.com/package/%40viro-community/react-viro
- Maintained package listing: https://www.npmjs.com/package/%40reactvision/react-viro
- Expo development build requirement: https://docs.expo.dev/develop/development-builds/introduction/
- Using development builds: https://docs.expo.dev/develop/development-builds/use-development-builds/
