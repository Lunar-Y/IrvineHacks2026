# LawnLens Part 4: AR & User Experience

## Role: AR & UX Developer
**Goal:** Implement the interactive 3D placement and the post-scan experience.

### Scope:
1. **AR Visualization:** Use ViroReact to render 3D glTF models on detected planes.
2. **Gestures:** Implement drag-to-place and pinch-to-scale for 3D plants.
3. **Care Dashboard:** Generate a weekly care calendar based on weather and plant species.
4. **Impact Stats:** Calculate CO2 sequestration, water savings, and biodiversity scores.
5. **Share Card:** Use `react-native-view-shot` to generate a shareable "Yard Impact" image.

### Key Files & Interfaces:
- `components/ar/PlantARScene.tsx`
- `components/plants/PlantCardDragHandler.tsx`
- `components/plants/EnvironmentStats.tsx`
- `app/ar/[id].tsx`

### Acceptance Criteria:
- User can drag a plant card from the list and drop a 3D model into their yard.
- 3D models are scaled correctly to their mature size.
- Care Dashboard shows dynamic tasks that change if rain is forecast.
- Impact Dashboard correctly aggregates stats from all "placed" plants.
- Shareable impact card is generated and saved to the camera roll.
