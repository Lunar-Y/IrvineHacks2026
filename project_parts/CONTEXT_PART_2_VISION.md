# LawnLens Part 2: Lawn Detection & Vision

## Role: Computer Vision Specialist
**Goal:** Implement real-time lawn detection, camera interface, and initial visual scene analysis.

### Scope & Tasks:
1. **Camera Interface:**
   - Open camera within 1 second of app launch.
   - Create animated guide ring: "Point at your lawn."
2. **On-device Segmentation:**
   - Integrate `@react-native-ml-kit/subject-segmentation`.
   - Process camera frames at 3fps to avoid device heat.
   - Render a green tint overlay locally on detected ground/grass regions.
3. **Confidence Logic & Capture:**
   - Build confidence meter bottom UI. 
   - When confidence > 40%: animate "Looks good — tap to scan" button.
   - On tap: freeze frame, play brief flash effect, save frame as base64, and trigger haptic feedback.
4. **Vision Analysis (LLM Step 1):**
   - Create Supabase Edge Function to pass the base64 frame to Claude.
   - **Prompt Requirements:** Request JSON structure containing `detected_existing_plants`, `detected_yard_features`, `estimated_microclimate`, `visible_soil_clues`, `estimated_sun_exposure`.
   - Start AR plane detection simultaneously to figure out bounds/orientation.

### Key Files & Interfaces:
- `components/camera/LawnDetectionOverlay.tsx`
- `components/camera/ScanConfirmButton.tsx`
- `components/camera/ScanningAnimation.tsx`
- `lib/llm/visionAnalysis.ts`
- `supabase/functions/analyze-frame/index.ts`

### Acceptance Criteria:
- Camera feed shows live, performant green overlay on grass.
- Scan button strictly dependent on 40% confidence threshold.
- Tapping scan freezes frame with appropriate UI polishing (grid animation, data points populating).
- Edge Function reliably returns structured JSON for the analyzed frame.
