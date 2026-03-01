# Current Plant Info Card UI Layout

## Scope
This document describes the current recommendation plant card UI rendered in:
- `components/plants/PlantCard.tsx`
- `components/recommendations/RecommendationsOverlay.tsx`

## Where It Appears
- The card appears inside a bottom sheet-like recommendations panel.
- The panel is rendered as an overlay above the scan camera screen.
- Cards are shown in a horizontal, snapping `FlatList`.

## Panel Layout (Card Container Context)
- Panel position:
  - Starts at `top = 48%` of screen height.
  - Ends above bottom safe area + tab bar visual height (`49`).
- Panel states:
  - `expanded` (full panel visible)
  - `minimized` (only drag-handle area visible)
- Header content:
  - Title: `Your Recommendations`
  - Zone pill: `🗺 Zone X`
- Supporting copy:
  - Interaction hint above cards.
  - Recommendation count text below cards.

## Card Rail Layout
- Card width:
  - `min(330, screenWidth * 0.66)`
- Separator between cards: `14`
- Horizontal centering:
  - FlatList content is inset so one card is centered in viewport.
- Scroll behavior:
  - Horizontal
  - Snap interval = `cardWidth + 14`
  - Fast deceleration

## Plant Card Structure
Card root (`height: 232`) contains two vertical regions:

1. Hero region (`height: 118`)
- Full-width image (`plant.image_url`) with `cover` mode.
- If no image: centered cactus emoji placeholder (`🌵`).
- Top-left rank badge:
  - Text format: `#<rank>`
  - Rounded dark green pill.

2. Body region
- Common name:
  - Large, bold, dark green
  - Single line
- Scientific name:
  - Smaller, gray, italic
  - Single line
- Tags row (wraps):
  - Water requirement tag (`Water: High|Medium|Low`)
  - Height tag (`Height: Xm`)
  - Conditional warning tag if toxic to pets (`Not pet-safe`)

## Visual Styling (Current)
- Card shell:
  - White background
  - Radius: `18`
  - Border: `1px` brown (`#8b5a2b`)
  - Elevated shadow
- Hero background fallback tint: light green (`#dcfce7`)
- Text tones:
  - Primary title green (`#14532d`)
  - Secondary gray (`#6b7280`)
- Tag styles:
  - Neutral tags: gray chip (`#f3f4f6`)
  - Warning tag: red chip (`#fee2e2`) with dark red text

## Interactions
- Tap card:
  - Navigates to plant detail route (`/plant/<matchingRecommendationIndex>`), when matching recommendation data is found.
- Lift gesture plumbing exists in `PlantCard`:
  - Long-press + pan callbacks are implemented.
  - In recommendations overlay, lift gesture is currently disabled (`enableLiftGesture={false}`).

## Data Fields Shown On Card
- `rank`
- `image_url`
- `common_name`
- `scientific_name`
- `water_requirement`
- `mature_height_meters`
- `is_toxic_to_pets`
