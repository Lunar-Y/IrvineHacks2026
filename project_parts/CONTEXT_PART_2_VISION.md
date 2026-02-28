# LawnLens Part 2: Lawn Detection & Vision

## Role: Computer Vision Specialist
**Goal:** Implement real-time lawn detection and visual scene analysis.

### Scope:
1. **ML Kit Integration:** Integrate `@react-native-ml-kit/subject-segmentation`.
2. **Real-time Processing:** Process camera frames at 3fps to detect "ground" or "grass".
3. **Overlay UI:** Render a green tint on detected lawn areas.
4. **Confidence Logic:** Implement a "Tap to Scan" button that appears only when > 40% of the frame is a detected lawn.
5. **Vision API:** Implement the `analyzeFrameWithClaude` Supabase Edge Function to analyze a frozen frame for microclimate and features.

### Key Files & Interfaces:
- `components/camera/LawnDetectionOverlay.tsx`
- `components/camera/ScanConfirmButton.tsx`
- `lib/llm/visionAnalysis.ts`
- `supabase/functions/analyze-frame/index.ts`

### Acceptance Criteria:
- Camera feed shows a live green overlay on grass.
- "Scan" button only appears when the camera is pointed at a sufficient lawn area.
- Tapping scan freezes the frame and triggers the Vision Analysis Edge Function.
- Edge Function returns structured JSON for existing plants and features.
