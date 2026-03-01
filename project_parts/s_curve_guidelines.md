# LawnLens — CO₂ S-Curve Sparkline Constraints
**Version 1.0 (Draft Mode)**

## Overview
This document specifies the design, sizing, and styling constraints for the CO₂ sequestered graph, taking the form of an S-curve (logistic function). 

The S-curve acts as a pure "sparkline." It abstractly models the biological reality of plant growth and carbon capture (slow establishment, rapid exponential growth, gradual maturity) while remaining extremely clean, reducing cognitive load on the dashboard.

## 1. Spatial Constraints 
The graph must adhere strictly to the boundaries defined inside the CO₂ Sequestered wide rectangle card on the impact dashboard.

*   **Available Height:** `60px` maximum.
*   **Available Width:** Full width of the card's internal padding space.
*   **Margins/Padding:** The S-curve should span the full 60px height (bottom inflection at `y=60`, top inflection at `y=0`).

## 2. Structural Integrity (The "Sparkline" Rule)
To maintain a high-end, premium aesthetic, the space around the curve must remain completely uncluttered.

*   ❌ **No X or Y Axes**
*   ❌ **No gridlines or tick marks**
*   ❌ **No text labels or numbers on the graph line**
*   ❌ **No bounding box or borders around the 60px area**

## 3. Visual Styling & Stroke
*   **Curve Line Style:** A single, continuous smooth SVG path.
*   **Stroke Width:** `2.5px` (Thick enough to feel deliberate, thin enough to remain elegant).
*   **Color:** `Secondary / Moss (#4C8B6B)` or `Primary / Forest (#2F6B4F)` (Pending final test against the `#18201D` card surface). 
*   **Caps & Joins:** `round`. (Must match the soft, rounded aesthetic of the Overall Score horseshoe).
*   **Gradients:** Solid color only. (No stroke gradients in the wireframe phase).

## 4. Visual Anchoring
To prevent the sparkline from feeling like it is "floating" without context, two minimal anchors are applied:

1.  **The "Current Status" Dot:**
    *   **Position:** The absolute end of the curve (Top-Right).
    *   **Shape:** Solid circle.
    *   **Size:** `6px` to `8px` diameter.
    *   **Color:** Same as the line stroke color.
    *   **Purpose:** Subtly communicates that this dot corresponds with the large metric (e.g., "142 kg") centered above the graph.
2.  **The Baseline (Optional):**
    *   A single, 1-pixel dashed line at the exact bottom of the 60px container to provide a visual floor.
    *   **Color:** `#FFFFFF` at `10%` opacity (`#FFFFFF1A`).

## 5. Future Phase Behaviors (Not Implemented Yet)
While outside the scope of Phase 1, the curve must be built as a single SVG path to support the following upcoming behaviors:
*   **Path Tracing Animation:** The curve will "draw" itself from left to right on page load using `stroke-dasharray`.
*   **Opacity Fade:** A subtle gradient fade (10% opacity) filling the space below the curve to ground it.
*   **Scrubbing State:** Press-and-hold interactions to reveal text labels/axes temporarily.
