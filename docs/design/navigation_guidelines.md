# Navigation Module UI Guidelines

## 1. Global Navigation Philosophy
*   **Immersive & Premium:** The app UI should feel bespoke, native, and immersive. Eliminate heavy "app chrome" (full-width solid background nav bars) in favor of floating elements and contextual headers.
*   **Camera is Home Base:** The UI should support the camera being the primary, continuous experience.
*   **No Redundancy:** Do not label tabs and screens with the exact same text simultaneously. Rely on icons for global navigation and titles for page-specific context.

## 2. Bottom Navigation: Functional Tab Bar
*(BACKLOGGED: The Floating Pill Tab Bar is currently backlogged. The current implementation relies on the standard functional navigation bar.)*

The global bottom navigation currently uses a standard functional tab bar. Future iterations will replace this with a floating, detached pill shape.

### Current Implementation (Functional Nav Bar)
*   **Layout:** Standard bottom attached tab bar, fully functional.
*   **Styling:** Native feel, ensuring basic navigation works without complex styling or z-index layering issues.
*   **Active/Inactive:** Distinguishable active and inactive states.

### Backlogged Implementation (Floating Pill Tab Bar)
The global bottom navigation is a floating, detached pill shape that sits above the content.

*   **Structure & Dimensions:**
    *   **Layout:** Centered horizontally at the bottom of the screen.
    *   **Height:** `64px`
    *   **Border Radius:** `32px` (fully rounded pill).
    *   **Spacing:** Content inside scroll views must have adequate bottom padding (e.g., `100px`) so the lowest items are not permanently covered by the floating tab bar.
*   **Styling:**
    *   **Background:** `#18201D` (Surface Color).
    *   **Content:** Icons **only**. No text labels.
    *   **Active State:** Forest Green icon (`#2F6B4F`).
    *   **Inactive State:** Muted icon (`#9FAFAA`).
    *   **Effects:** Subtle backdrop blur (if supported by the framework) or a soft drop shadow to separate it from the `#0F1412` app background.

## 3. Top Navigation: Contextual Headers (Hybrid Approach)
The solid white top bar is **removed entirely**. The app background color (`#0F1412`) extends to the top edge of the screen (under the native status bar).

*   **Rule:** Top headers only appear when necessary for contextual actions or clear data hierarchy.
*   **Screen-by-Screen Rules:**
    *   **Scan (Camera):** `NO HEADER`. Full-screen immersive camera experience.
    *   **Impact:** `NO HEADER`. The dashboard layout and large gauges dominate the screen structure.
    *   **My Plants:** `LARGE HEADER`. Uses Sora (e.g., `28px`) for the title "My Plants". Hosts contextual actions like "Sort" or "Filter" icons on the right side.
    *   **Care:** *(BACKLOGGED - Do not implement or change unless explicitly approved)*.

## 4. Stacking Context (Z-Index Rules)
To maintain a premium feel and logical focus, the z-axis layers must strictly follow this hierarchy (from back to front):

1.  **Layer 0 (Background):** App Base (`#0F1412`).
2.  **Layer 1 (Content):** Scrollable page content, camera view, grids, etc.
3.  **Layer 2 (Floating Nav):** The standard functional Tab Bar (in future: Floating Pill Tab Bar).
4.  **Layer 3 (Modals & Bottom Sheets):** Result sheets (like **Plant Recommendations**), detail modals, and full-screen overlays. **Crucially, bottom sheets must slide up *over/above* the tab bar**, temporarily covering it so the user is entirely focused on the plant data result.
