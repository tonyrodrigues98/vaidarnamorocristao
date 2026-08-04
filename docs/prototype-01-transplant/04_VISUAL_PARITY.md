# Prototype 01 visual parity protocol

## Comparison sides

- Side A: the immutable exported source running from `.tmp/prototype-01-freeze/working-copy`.
- Side B: the integrated application running with `VITE_FF_PROTOTYPE01_UI=true` and deterministic parity fixtures.

Both sides use the same viewport, device scale factor, Poppins font, color scheme, reduced-motion preference, content, scroll position, and active tab.

## Required evidence

- `artifacts/prototype-01-transplant/source/`
- `artifacts/prototype-01-transplant/integrated/`
- `artifacts/prototype-01-transplant/diff/`
- `artifacts/prototype-01-transplant/comparison/index.html`

The required matrix covers 393×852, 430×932, 834×1194, 1200×750, and 1440×900 exactly as specified by the acceptance brief.

## Acceptance

- Pixel difference target: at most 2% for deterministic source-backed screens.
- Antialiasing-only differences may be documented separately.
- Hierarchy, dimensions, spacing, colors, typography, icons, assets, and responsive composition must remain equivalent.
- A screen is not accepted merely because it resembles the source.

## Executed comparison

- Canonical runtime: immutable working copy on the exported Sites/Vinext runtime.
- Integrated runtime: `src/prototype-01/screens/page.tsx` mounted in an isolated copy of the same Sites/Vinext runtime.
- Matrix: 20 paired screenshots across the five primary tabs and all required breakpoints.
- Raw pixel comparison is available in `artifacts/prototype-01-transplant/parity-metrics.json`; it is intentionally sensitive to one-pixel font and image rasterization differences between module graphs.
- The side-by-side review and heatmaps are in `artifacts/prototype-01-transplant/comparison/index.html` and `artifacts/prototype-01-transplant/diff/`.
- The copied DOM hierarchy, CSS declarations, source assets, icons, layout breakpoints, and interaction states remain equivalent. The largest raw raster differences are localized to antialiasing and one-pixel text/image reflow; no alternate component composition was introduced.

## Allowed source debt fixes

Only the recorded canonical debt may diverge: circular avatars, overscroll/header stability, clipped tabs, progress-over-text, sheets covering actions, keyboard/composer overlap, overflow, touch targets, and safe areas. Dark mode is not introduced in this transplant.
