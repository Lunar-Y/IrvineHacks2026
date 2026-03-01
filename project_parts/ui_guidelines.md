# LawnLens — Global UI Guidelines

**Version 1.0 (Wireframe & Baseline Styling Phase)**

## Overview

This document serves as the single source of truth for all foundational UI elements, layout rules, and aesthetic constraints across the LawnLens application. Any new screens or components should strictly inherit from this system.

---

## 1. Color System (Active: Option 2 — Forest & Sage Base)

LawnLens uses a cool, nature-inspired dark mode palette. To ensure accessibility and visual hierarchy, components must adhere exactly to these token values.

### Surfaces & Structural
- **Background:** `#0F1412` (Page root background)
- **Card Surface / Elevated Elements:** `#18201D` (Rounded containers, dialogs)
- **Divider (10%):** `#FFFFFF1A` (Subtle strokes, borders, or list separators)

### Accents & Data Visualization
- **Primary / Forest Green:** `#2F6B4F` (Emphasized data, primary buttons, icons)
- **Secondary / Moss:** `#4C8B6B` (Secondary data visualization, mid-level accents)
- **Tertiary / Soft Sage:** `#B7D3C0` (Subtle fills, graph backgrounds)
- **Positive:** `#2F6B4F` (Success states, positive delta)
- **Neutral:** `#C7A23A` (Warnings, pending/idle states)
- **Negative:** `#B24A3A` (Errors, failed scans, negative delta)

### Typography Colors
- **Primary Text:** `#F5F7F6` (Main headings, titles, active nav)
- **Muted Text:** `#9FAFAA` (Subtitles, labels, descriptions)

---

## 2. Typography System (Locked)

LawnLens relies on two font families to separate data/hero elements from readable interface text. 

- **Primary Font:** Inter (Functional text, labels, reading)
- **Accent Font:** Sora (Large metrics, scores, display numbers)

### Allowed Font Sizes
| Usage Focus | Size | Weight | Font Family | Example |
| --- | --- | --- | --- | --- |
| Hero Metric / Score | 52px | Bold | Sora | Dashboard Gauge |
| Large Data Points | 32px | SemiBold | Sora | Main values inside cards |
| Mid-Size Metrics | 28px | SemiBold | Sora | Values inside grid components |
| Section Titles | 18px | SemiBold | Inter | Card headers |
| Labels / Paragraphs | 14px | Medium | Inter | Descriptive text, icon labels |
| Micro / Subtext | 12px | Medium | Inter | Bottom-line descriptors |

*Constraint: Do not introduce additional font sizes outside of this scale without updating this document.*

---

## 3. Global Layout & Spacing Rules

To maintain vertical rhythm and horizontal alignment, the application adheres to a strict spacing system.

### Canvas Padding
- **Horizontal Screen Padding:** 20px (Safe areas apply)
- **Bottom Safe Area Clearance:** 40px (For scrollable lists extending behind tab bars)

### Component Constraints
- **Card Corner Radius:** 16px
- **Standard Card Padding:** 16px
- **Large Container Padding:** 20px

### Component Spacing
- **Major Block Vertical Gap:** 32px (Distance between entirely separate vertical sections)
- **Minor Element Vertical Gap:** 16px (Distance between a title and its content block)
- **Grid Gutter:** 16px (Distance between items in rows/columns)

### Aesthetics (Wireframe Phase)
- ❌ **No drop shadows**
- ❌ **No borders** on standard cards (unless defined as separators)
- ❌ **No gradients** (except in future approved components)
