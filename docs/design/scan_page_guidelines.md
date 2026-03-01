# Scan Page UI Guidelines

## 1. Overview & Core Philosophy
The Scan Page serves as the primary home base for the application. It is an immersive, full-screen camera experience that feels like a professional AR tool rather than a standard web app.
This document defines the strict UI and aesthetic rules for the Scan Page based on the global `ui_guidelines.md` and `navigation_guidelines.md`.

---

## 2. Layout & Stacking Context
The Scan Page has a specific z-index hierarchy to maintain depth and readability.

- **Layer 1 (Background):** The live, full-screen Camera View.
- **Layer 1.5 (Overlay Gradient):** A dark gradient anchored to the bottom edge. It fades up from `#0F1412` (100% opacity) at the bottom to transparent. This ensures that the primary scanning button and text remain legible regardless of what the camera is pointing at.
- **Layer 2 (Foreground Elements):** The scanning viewfinder, guidance text, and action buttons. 
- **Layer 3 (Navigation):** The functional tab bar (future floating pill tab bar) sits at the very bottom, layered over the gradient.

*(Note: In accordance with global navigation rules, there is **NO TOP HEADER** on the Scan Page.)*

---

## 3. The Viewfinder
The current continuous circle overlay must be replaced with a more professional, technical indicator.

- **Design:** Instead of a circle, use **corner brackets (crop marks)** to delineate the focus area. This evokes a professional lens/drone aesthetic.
- **Active State:** The brackets should default to a subtle white (`#FFFFFF`) with reduced opacity.
- **Detected State:** When a valid lawn/surface is confidently detected, the brackets should snap to the **Primary Forest Green (`#2F6B4F`)**.

---

## 4. Bottom Controls & Action Button
The "Scan Lawn" interaction is the most critical button on the screen and must reflect the premium "LawnLens" aesthetic.

- **Placement:** Positioned within the dark gradient layer at the bottom of the screen, just above the navigation bar.
- **Container Shape:** A solid pill shape (fully rounded corners).
- **Styling constraints (Strict):**
  - **Background Fill:** **Primary Forest Green (`#2F6B4F`)**
  - **Text Color:** Primary Text (`#F5F7F6`)
  - ❌ **No borders**
  - ❌ **No transparency/opacity** on the button itself.
- **Typography:** The button text "Scan Lawn" must use **Inter SemiBold (18px)**.

---

## 5. Guidance & Status Text
Status text (e.g., "Capturing lawn...", "Finding your plants...") must be moved out of the center of the screen to avoid obstructing the camera view and to ensure readability.

- **Placement:** Centered directly above the "Scan Lawn" button, cleanly resting within the dark gradient layer.
- **Typography:** Use **Inter Medium (14px)**.
- **Color:** Use **Primary Text (`#F5F7F6`)** or **Muted Text (`#9FAFAA`)** depending on the emphasis required.

---

## 6. Permission & Fallback States
If camera or location permissions are missing, the UI must still look intentional and adhere to the global dark mode system.

- **Container:** Use a standard card surface (`#18201D`) centered on the dark app background (`#0F1412`).
- **Corner Radius:** `16px`.
- **Text:** Use **Inter Medium (14px)** with Primary Text (`#F5F7F6`) for headers and Muted Text (`#9FAFAA`) for body descriptions.
- **Buttons:** Follow the exact same solid pill design as the "Scan Lawn" button.

---

## 7. Results & Error Overlays
When a scan completes (Success or Failure), the result modal must adhere to the global system.

- **Container:** Standard card surface (`#18201D`), not pure white.
- **Corner Radius:** `16px`, with standard `16px` inner padding.
- **Typography Constraints:** 
  - Title: Inter SemiBold (18px).
  - Body: Inter Medium (14px).
- **Accents:** 
  - Success/Valid: Use **Positive Forest Green (`#2F6B4F`)**.
  - Error/Invalid: Use **Negative (`#B24A3A`)**. 
