---
name: Obsidian Violet Forensics
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#cec2d4'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#978d9d'
  outline-variant: '#4c4452'
  surface-tint: '#dcb8ff'
  primary: '#dcb8ff'
  on-primary: '#480082'
  primary-container: '#783bb7'
  on-primary-container: '#e5c9ff'
  inverse-primary: '#7b3eba'
  secondary: '#c4c0ff'
  on-secondary: '#2000a4'
  secondary-container: '#3621cc'
  on-secondary-container: '#b0adff'
  tertiary: '#ffabf1'
  on-tertiary: '#5c005a'
  tertiary-container: '#91368a'
  on-tertiary-container: '#ffc0f2'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#efdbff'
  primary-fixed-dim: '#dcb8ff'
  on-primary-fixed: '#2b0052'
  on-primary-fixed-variant: '#6221a0'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c4c0ff'
  on-secondary-fixed: '#100069'
  on-secondary-fixed-variant: '#3621cc'
  tertiary-fixed: '#ffd7f4'
  tertiary-fixed-dim: '#ffabf1'
  on-tertiary-fixed: '#380037'
  on-tertiary-fixed-variant: '#781f74'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 4.25rem
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Manrope
    fontSize: 2.5rem
    fontWeight: '600'
    lineHeight: 3rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Manrope
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Manrope
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies high-tier digital intelligence, sovereign data integrity, and cyber-forensic precision. It merges the gravitas of deep-space minimalism with the luminous authority of rich violet optics. Designed for forensic analysts, security executives, and intelligence operators, the interface evokes calm authority, uncompromising fidelity, and focused luxury.

Visual tension is achieved through stark contrasts: obsidian canvas surfaces layered against ethereal, ribbon-like radial illuminations in royal violet and electric indigo. Interactions feel weighted, fluid, and intentional—delivering clarity amidst dense data streams without visual clutter or unnecessary embellishment.

## Colors

The palette operates on absolute values to guarantee maximum depth and luminous contrast:

- **Primary Background (`#08090B`)**: Deep void canvas; anchors the entire viewport to minimize visual fatigue during critical investigation.
- **Secondary Background (`#101114`)**: Subtle elevation for navigation bars, side rails, and systemic grouping.
- **Card Background (`#18191D`)**: Distinct surface tier for forensic modules, tables, and data containers.
- **Border (`#303038`)**: Architectural hairline boundary separating cards, dividers, and inputs without harsh geometric interruption.
- **Accent Chromatics**:
  - **Royal Violet (`#783BB7`)**: Core brand anchor, status illumination, and high-priority indicators.
  - **Electric Indigo (`#5145E5`)**: Active computational signals, secondary paths, and interactive highlights.
  - **Dark Purple (`#32174D`)**: Deep luminous under-glows, badges, and selected-state backdrops.
  - **Magenta (`#AD4FA4`) & Soft Pink (`#CE8ABC`)**: Anomaly detection, cryptographic verification alerts, and precision data flags.
- **Typography & Icons**:
  - **Primary Text (`#FFFFFF`)**: High-contrast, crystal-clear readability for critical metrics and headers.
  - **Secondary Text (`#B5B3C0`)**: Softened neutral for body prose, metadata labels, and analytical context.

## Typography

Typography establishes an immediate hierarchy of intelligence. Headlines employ `Manrope` for its geometric weight, architectural openness, and confident presence at scale. Body copy and operational data leverage `Inter` to deliver neutral, highly legible tabular and forensic data across extended viewing sessions.

Numbers, hashes, and cryptographic telemetry within labels or tables must activate tabular lining (`tnum`) to maintain structural alignment across vertically stacked readouts.

## Layout & Spacing

The layout model is governed by a 12-column fluid grid system bounded by generous negative space, reinforcing an editorial, luxury-grade software presence. 

- **Desktop (1200px+)**: 12-column layout with `2.5rem` outer margins and `1.5rem` gutters. High-density forensic panels should align to structured modules (spans of 3, 4, 6, or 12).
- **Tablet (768px - 1199px)**: 8-column layout with `1.5rem` margins and `1.25rem` gutters. Multi-column cards collapse gracefully into binary split views.
- **Mobile (<768px)**: 4-column layout with `1rem` margins and `1rem` gutters. Complex data tables convert into vertically stacked forensic log cards.

Content flows using strict tokenized intervals: tight groupings (icon to text) use `space-xs` and `space-sm`, interior container breathing space scales from `space-md` to `space-lg`, and inter-section distances demand `space-xl` to maintain distinction.

## Elevation & Depth

Visual hierarchy uses physical depth rather than harsh artificial borders, using a blend of tonal layering, soft ambient violet underglows, and crisp structural edges:

- **Level 0 (Canvas)**: `#08090B` solid field, occasionally infused with subtle, fixed radial gradients of `#32174D` and `#5145E5` at 8%–15% opacity to evoke flowing ambient currents.
- **Level 1 (Sub-Navigation & Sidebars)**: `#101114` with a 1px border of `#303038` along separating axes.
- **Level 2 (Forensic Cards & Modules)**: `#18191D` with an all-around 1px `#303038` stroke. Cards hover to reveal a delicate exterior drop shadow: `0 8px 32px -4px rgba(120, 59, 183, 0.15)`.
- **Level 3 (Modals, Overlays & Inspection Trays)**: `#18191D` elevated with `0 24px 64px -12px rgba(8, 9, 11, 0.85)` accompanied by a 1px stroke of `#783BB7` at 40% opacity to denote active modal capture.

## Shapes

The design system implements a pill-forward silhouette (`roundedness: 3`) for all action items and system chips, balanced by structured, moderately curved container surfaces (`rounded-lg` / `rounded-xl`). 

Interactive buttons, status pills, and search inputs feature full pill curvature (`9999px` / `rounded-xl`), creating a tactile, aerodynamic counterpoint to the rigid, tabular analytical modules. Rectangular panels and forensic cards use `1.5rem` (`rounded-lg`) corner radii to maintain an architectural frame for high-density forensic logs.

## Components

### Buttons
- **Primary**: Full pill silhouette (`rounded-full`), solid high-contrast white `#FFFFFF` fill with deep dark text `#08090B`. Font: `Inter` SemiBold (weight 600). Hover triggers a subtle outer halo: `0 0 20px rgba(255, 255, 255, 0.25)`.
- **Secondary**: Full pill silhouette, transparent background, bounded by a 1px `#303038` border with primary text `#FFFFFF`. Hover transitions the border to `#783BB7` with a background tint of `rgba(120, 59, 183, 0.08)`.
- **Tertiary / Ghost**: Borderless pill with `#B5B3C0` text, transitioning to `#FFFFFF` and `rgba(255, 255, 255, 0.05)` fill on hover.

### Chips & Threat Badges
- Encapsulated pills (`py-1 px-3`) with uppercase `label-sm` tracking.
- **Verified / Safe**: Background `rgba(81, 69, 229, 0.12)`, text `#FFFFFF`, border `1px solid rgba(81, 69, 229, 0.3)`.
- **Threat Detected**: Background `rgba(173, 79, 164, 0.15)`, text `#CE8ABC`, border `1px solid rgba(173, 79, 164, 0.4)`.

### Input Fields
- Fully pill-shaped or smoothed `1rem` corner containers with `#101114` fill and a 1px `#303038` border.
- Text renders in `#FFFFFF`, with placeholder values in `#B5B3C0` at 50% opacity.
- Focus state: Border transitions to `#783BB7` with a focused box-shadow: `0 0 0 3px rgba(120, 59, 183, 0.2)`.

### Cards & Telemetry Panels
- Background `#18191D`, corner radius `1.5rem` (`rounded-lg`), hairline border `#303038`.
- Section titles render in `headline-sm` with `Manrope` 600 weight. Internal padding conforms strictly to `space-lg` (`1.5rem`).

### Checkboxes & Radios
- Checkboxes maintain a tight `0.375rem` radius; radios are circular.
- Unselected: Hairline border `#303038` over `#101114`.
- Selected: Solid `#783BB7` fill with crisp white `#FFFFFF` interior checkmark or center pip.

### Forensic Waveforms & Timeline Graphs
- Data curves utilize glowing strokes (`#5145E5` blending to `#783BB7` and `#AD4FA4`).
- Base gridlines use `#303038` at 40% opacity with tabular numbers rendered in `label-sm` using `#B5B3C0`.