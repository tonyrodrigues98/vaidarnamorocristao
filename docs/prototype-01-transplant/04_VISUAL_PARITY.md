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

## Allowed source debt fixes

Only the recorded canonical debt may diverge: circular avatars, overscroll/header stability, clipped tabs, progress-over-text, sheets covering actions, keyboard/composer overlap, overflow, touch targets, and safe areas. Dark mode is not introduced in this transplant.
