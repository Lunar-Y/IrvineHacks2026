# LawnLens — Impact Dashboard Design Constraints

**Version 1.0 (Wireframe Mode — No Data Populated)**

## Overview

This document defines the visual structure, layout constraints, and design rules for the Impact Dashboard / Statistics Page of LawnLens.

> **⚠️ Important:**
> All statistic components will initially render as empty placeholders. No numerical data, graphs, or values are shown in this phase.
> 
> This document governs layout, spacing, and hierarchy only.
> 
> The statistics page exists within the broader LawnLens architecture defined in the core project context `lawnlens_context`.

## Page Structure (Strict Order)

The statistics page must follow this exact vertical order:
1. Overall Score (no container box)
2. CO₂ Sequestered (wide rectangular box)
3. Four square statistic components arranged in a 2×2 grid

*No additional sections allowed.*

## Canvas & Global Layout Rules

- **Target Device Frame:** iPhone 15 Pro — 393 × 852
- **Background Color:** `#0E1111`
- **Horizontal Padding:** 20px
- **Section Spacing (Major Blocks):** 32px
- **Grid Gutter (between square cards):** 16px
- **Card Corner Radius:** 16px
- **Card Background Color:** `#161B1B`

*No drop shadows. No borders. No gradients (except share card in future phase).*

---

## 1. Overall Score (No Box)

The Overall Impact Score is the dominant visual element on the page. It must feel modern, clean, and data-driven—similar to high-end analytics or fitness dashboards. 

This component sits directly on the page background and must **NOT** be contained within a card or rounded box.

### Layout & Appearance
- **Shape:** Semi-open "horseshoe" arc (spanning approximately 240–270 degrees).
- **Gap:** A deliberate 90–120 degree empty space centered exactly at the bottom.
- **Stroke Caps:** Fully rounded ends to provide a soft, premium aesthetic.
- **Aesthetics:** Minimal noise. 
  - ❌ No segmented markings.
  - ❌ No tick lines.
  - ❌ No background tracks in wireframe phase.

### Dimensions
- **Gauge Diameter:** `240px`
- **Stroke Width:** `16px` (substantial and prominent against the diameter)
- **Section top spacing from header:** `24px`
- **Section bottom spacing:** `32px`

### Typography (Centered in Gauge)
- **Score Value (0-100):**
  - Font: Sora
  - Size: 52px
  - Weight: Bold
- **Label (Below Score):**
  - Font: Inter
  - Size: 14px
  - Weight: Medium
  - Color: (Use Muted Text from active palette)

### Placeholder Behavior (Wireframe Phase)
- **Gauge Color:** Single-color static stroke (use Elevated Surface/Accent depending on active palette). 
  - *Note: Gradients are allowed for the stroke, but they will not be implemented until a later phase.*
- **Text:** Score text defaults to a placeholder like `--`.
- **Note:** Do NOT apply score-based dynamic coloring or animations in this phase. (These are reserved for a future update).

---

## 2. CO₂ Sequestered (Wide Rectangle)

This is the only wide statistic component.

### Container
- **Width:** 353px (393 − 40 padding)
- **Height:** 180px
- **Border Radius:** 16px
- **Padding:** 20px
- **Background:** `#161B1B`
- **Spacing from Overall Score:** 32px
- **Spacing below:** 32px

### Internal Layout
- **Top Row:**
  - Icon placeholder (20px)
  - Title text
- **Title Typography:**
  - Font: Inter
  - Size: 18px
  - Weight: SemiBold
- **Spacing below title:** 16px
- **Main Number Placeholder:**
  - Font: Sora
  - Size: 32px
  - Weight: SemiBold
- **Graph Area Placeholder:**
  - Height: 60px
  - Full width inside padding
  - No axes
  - No labels
  - Simple empty block for now
- **Subtext Placeholder:**
  - Font: Inter
  - Size: 13px
  - Weight: Medium
  - Color: `#8FA3A3`

*No real graph data in this phase.*

---

## 3. Four Square Statistic Components (2×2 Grid)

Below CO₂ section.

### Grid Math
- **Spacing above grid:** 32px
- **Available width:** 353px
- **Gutter:** 16px
- **Each square width:** (353 − 16) / 2 = 168.5px (*Rounded to: `168px`*)
- **Height:** `168px`

### Square Component Constraints
- **Width:** 168px
- **Height:** 168px
- **Border Radius:** 16px
- **Padding:** 16px
- **Background:** `#161B1B`
- **Spacing between columns:** 16px
- **Spacing between rows:** 16px

### Internal Layout Structure (Inside Each Square)
Must follow 3-section vertical structure:

- **Top Section:**
  - Icon (20px)
  - Label (14px Inter SemiBold)
- **Middle Section:**
  - Large metric placeholder
  - 28px Sora SemiBold
- **Bottom Section:**
  - Descriptor placeholder
  - 12px Inter Medium
  - Color: `#8FA3A3`

*Content must not be vertically centered as a block. Maintain visual hierarchy (top → middle → bottom).*

### The Four Square Slots (Placeholders Only)
1. Water Savings
2. Biodiversity
3. Urban Cooling
4. Soil Health

*No reordering allowed.*

---

## Typography System (Locked)

- **Primary Font:** Inter
- **Accent Font:** Sora

### Allowed Font Sizes
| Usage | Size | Weight |
| --- | --- | --- |
| Hero Score | 52px | Bold |
| Large Metrics | 32px | SemiBold |
| Square Metrics | 28px | SemiBold |
| Section Titles | 18px | SemiBold |
| Labels | 14px | Medium |
| Micro | 12px | Medium |

*Maximum 5 font sizes total.*

---

## Color System (Palette Options)

### Option 1 (Green & Teal Base)
**Surfaces & Structural**
- **Background:** `#0E1111`
- **Card Surface:** `#161B1B`
- **Elevated Surface:** `#1C2222`
- **Divider (10%):** `#FFFFFF1A`

**Accents & Data**
- **Primary Green:** `#1E6F4C`
- **Primary Hover:** `#238B63`
- **Soft Green Fill:** `#1E6F4C33`
- **Light Mint:** `#A8D5BA`
- **Muted Teal:** `#3E6F6F`

**Typography**
- **Primary Text:** `#FFFFFF`
- **Muted Text:** `#8FA3A3`
- **Subtle Label:** `#6E7F7F`

### Option 2 (Forest & Sage Base)
**Surfaces & Structural**
- **Background:** `#0F1412`
- **Card Surface:** `#18201D`

**Accents & Data**
- **Forest Green:** `#2F6B4F`
- **Moss:** `#4C8B6B`
- **Soft Sage:** `#B7D3C0`
- **Positive:** `#2F6B4F`
- **Neutral:** `#C7A23A`
- **Negative:** `#B24A3A`

**Typography**
- **Primary:** `#F5F7F6`
- **Muted:** `#9FAFAA`

### Option 3 (Deep Cyan Base)
**Surfaces & Structural**
- **Background:** `#0C1114`
- **Card Surface:** `#141B1F`

**Accents & Data**
- **Teal Green:** `#0F766E`
- **Bright Teal:** `#14B8A6`
- **Light Aqua:** `#99F6E4`
- **Deep Cyan:** `#164E63`
- **Positive:** `#10B981`
- **Warning:** `#F59E0B`
- **Negative:** `#EF4444`

---

## Visual Hierarchy Intent

The layout must communicate priority through size:
1. Overall Score (largest, no box)
2. CO₂ Section (wide emphasis)
3. 2×2 Grid (equal weight metrics)

*This hierarchy must be preserved.*

### Explicit Restrictions
- ❌ No extra statistic sections
- ❌ No charts beyond CO₂ placeholder
- ❌ No additional rows below 2×2 grid
- ❌ No inconsistent card heights
- ❌ No shadows
- ❌ No gradients
- ❌ No emojis in titles
- ❌ No additional fonts

---

## Vertical Rhythm Summary

```text
Header
↓ 24px
Overall Score (no box)
↓ 32px
CO₂ Wide Rectangle
↓ 32px
2×2 Grid
↓ 40px
Bottom Safe Area
```

*Spacing must remain consistent.*

---

## Future Phase Notes (Not Implemented Yet)

The following will be implemented later:
- Dynamic score coloring
- Animated number transitions
- Live graph rendering
- Share card generation
- Environmental comparison math
- Haptic feedback interactions

*Those are outside scope of this wireframe-only constraint document.*
