# Saved Plants — Screen Layout

This document details the UI layout for the Saved Plants screen, adapted to align with the global `ui_guidelines.md` dark mode system (Forest & Sage Base), locked typography, and strict spacing constraints.

## 0) Screen + Safe Areas

*   **Device frame:** iPhone 14/15 (390×844) or Android equivalent
*   **Safe area top padding:** 12
*   **Page horizontal padding:** 20 *(Matches Canvas Padding)*
*   **Background color:** `#0F1412` *(Page root background)*
*   **Bottom Safe Area Clearance:** 40 *(For scrollable lists extending behind tab bars)*

## 1) Top App Bar (sticky)

*   **Container Width/Height:** Full width, Height: 56
*   **Padding:** 20 horizontal
*   **Background:** `#0F1412` *(Matches root to keep it airy)*
*   **Left (Title):** “Saved Plants”
    *   **Font:** Sora / SemiBold *(or Inter SemiBold if treated purely as a section title)*
    *   **Size:** 28 *(Mid-Size Metrics)*
    *   **Color:** `#F5F7F6` *(Primary Text)*
*   **Right (Actions):**
    *   Icon button (Sort) 40×40
    *   Icon button (Filter) 40×40
    *   Icon color: `#9FAFAA` *(Muted Text)*
*   **Spacing Alignment:** Title ↔ icons: auto (icons aligned right)
*   **App bar bottom spacing to next section:** 16 *(Minor Element Vertical Gap)*

## 2) Search / Quick Actions Row

*   **Container:** Full width (respecting 20px page padding)
*   **Height:** 44
*   **Radius:** 16 *(Card Corner Radius)*
*   **Fill:** `#18201D` *(Card Surface)*
*   **Border:** None *(Strictly removed per ❌ No borders rule)*
*   **Left icon:** Magnifier (16)
*   **Placeholder text:** “Search saved plants”
    *   **Font:** Inter / Medium
    *   **Size:** 14 *(Labels / Paragraphs)*
    *   **Color:** `#9FAFAA` *(Muted Text)*
*   **Search row bottom spacing:** 16 *(Grid Gutter / Minor Gap)*

## 3) Grid of Saved Plant Cards (2 columns)

*   **Grid Container:**
    *   Page padding already provides left/right = 20
    *   Column count: 2
    *   Column gap: 16 *(Grid Gutter)*
    *   Row gap: 16 *(Grid Gutter)*
*   **Card Outer Boundaries:**
    *   **Card width:** ≈ 167 *(Calculated: (390 − 20 − 20 − 16) / 2)*
    *   **Card height:** 210
    *   **Radius:** 16 *(Card Corner Radius)*
    *   **Fill:** `#18201D` *(Card Surface)*
    *   **Border:** None *(Strictly removed per ❌ No borders rule)*
    *   **Shadow:** None *(Strictly removed per ❌ No drop shadows rule)*
*   **Card Internal Layout (Skeleton Placeholders):**
    *   **Card internal padding:** 16 *(Standard Card Padding)*
    *   **Image placeholder:** Full width × 96, Radius: 8, Fill: `#FFFFFF1A` *(Divider tone for subtle skeletal fills)*. Optional “leaf” icon watermark centered (20% opacity).
    *   **Plant name placeholder:** Height: 14, Width: 70%, Radius: 7, Fill: `#FFFFFF1A`
    *   **Scientific name placeholder:** Height: 12, Width: 55%, Radius: 6, Fill: `#FFFFFF1A`
    *   **Tags row (2 pills):** Each pill height 22, radius 11, Fill: `#4C8B6B` *(Secondary / Moss)* or `#2F6B4F` *(Primary / Forest Green)*.
    *   **Bottom meta bar:** Height 10, Width 40%, Fill: `#FFFFFF1A`
*   **Spacing Inside Card:**
    *   Image → name: 12
    *   Name → scientific: 8
    *   Scientific → pills: 12
    *   Pills → bottom meta: 12

## 4) Empty State Behavior

*   **Layout:** Show 4–6 skeleton placeholder cards in the grid structure.
*   **Empty Hint Banner (above grid):**
    *   **Height:** 64
    *   **Radius:** 16 *(Card Corner Radius)*
    *   **Fill:** `#18201D` *(Card Surface)*
    *   **Border/Shadow:** None
    *   **Text:** “Save plants from your recommendations to see them here.”
    *   **Font:** Inter / Medium
    *   **Size:** 14
    *   **Color:** `#9FAFAA` *(Muted Text)*
    *   **Padding:** 16 horizontal/vertical text centering

---

## 🎨 Color Token Map (GreenScape Forest & Sage)

*   **Page Background (`BG`):** `#0F1412` *(Page root background)*
*   **Surface/Cards (`Surface`):** `#18201D` *(Card Surface / Elevated Elements)*
*   **Skeletons/Placeholders (`SurfaceAlt`):** `#FFFFFF1A` *(Divider opacity used as a subtle fill block)*
*   **Accents/Tags (`Primary` / `PrimarySoft`):** `#2F6B4F` *(Forest Green)* & `#4C8B6B` *(Moss)*
*   **Primary Text (`TextPrimary`):** `#F5F7F6`
*   **Secondary Text (`TextSecondary` / `TextMuted` / `IconMuted`):** `#9FAFAA` *(Muted Text)*
*   **Borders / Shadows:** `None` *(Forbidden layer styles based on current wireframe aesthetics)*

## 📝 Typography Map

*   **Display/Title (Screen Header):** Sora SemiBold, 28
*   **Section/Card Titles:** Inter SemiBold, 18
*   **Body/Labels (Search, Descriptions):** Inter Medium, 14
*   **Micro/Subtext (Bottom Meta):** Inter Medium, 12
