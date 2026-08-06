# Brand identity design QA

- source visual truth: `Foto 1.jpg` and `Foto 2.jpg` from the user attachment
- implementation screenshot: `artifacts/brand-identity/auth-light.png`
- corrected mobile screenshot: `artifacts/brand-identity/auth-mobile-fixed-393x640.png`
- comparison: `artifacts/brand-identity/comparison-light.png`
- viewport: 1920 × 963 CSS pixels, device scale factor 1
- source pixels: 1280 × 853 each
- implementation pixels: 1920 × 963
- state: public authentication shell, light theme

## Full-view comparison evidence

The supplied black wordmark is reproduced from the source pixels, with its geometry, texture and proportions preserved. The application crops only the transparent canvas around it and uses `object-fit`-equivalent sizing without stretching. Its scale is intentionally adapted to the navigation/auth slot rather than reproducing the source image's large white artboard.

## Focused-region comparison evidence

The logo region was inspected at original resolution in both supplied files and in the browser-rendered authentication shell. The transparent matte has no visible white rectangle or clipping in the light implementation. The dark asset uses the supplied light/cream artwork and is selected by `.dark`, `[data-theme="dark"]`, or the system color scheme when no explicit light theme exists.

## Required fidelity surfaces

- Typography: the artwork remains raster source material; no font recreation or text approximation was introduced.
- Spacing/layout: the wordmark keeps its source aspect ratio and is sized per shell slot without distortion.
- Colors/tokens: black artwork is used in light mode; the supplied cream artwork is used in dark mode.
- Image quality: original JPEGs are retained as provenance and production PNGs preserve the supplied geometry with transparent backgrounds.
- Copy/content: product, legal and accessibility naming remains VaiDarNamoro; only the visual lockup changed.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- P3 test gap: the dark selection is covered structurally and by automated tests; the browser-rendered evidence captured in this pass is the light authentication state.

## Comparison history

- Initial extraction of the dark source used an overly broad white matte and removed too much of the cream fill.
- The matte thresholds were corrected against the original source before integration.
- The final browser capture confirms correct crop, scale, alpha and placement for the light wordmark.
- A physical iPhone capture exposed excessive vertical spacing around the mobile login card. The Auth shell was changed to use the small viewport unit, guaranteed vertical overflow, a smaller mobile lockup, compact mobile padding and responsive heading size.
- The corrected production build was captured at 393 × 852 and at a reduced 393 × 640 Safari-like viewport. The complete login form remains visible at 393 × 640, horizontal overflow is absent, and the document remains scroll-safe when browser chrome further reduces usable height.

## Implementation checklist

- Shared theme-aware wordmark component: complete.
- Public, Auth, Native, Admin, Prototype 01 and splash lockups: complete.
- Automated identity coverage: complete.
- Square PWA launcher icons: intentionally unchanged because the supplied source is a horizontal wordmark and no square mark was provided.

final result: passed
