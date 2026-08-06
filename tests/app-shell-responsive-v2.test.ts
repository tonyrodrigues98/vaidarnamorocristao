import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/v2/app-shell/styles.css", import.meta.url), "utf8");

describe("V2 App Shell responsive structure", () => {
  it("defines mobile, tablet, desktop and contextual-rail transitions", () => {
    expect(css).toContain("@media (min-width: 48rem)");
    expect(css).toContain("@media (min-width: 64rem)");
    expect(css).toContain("@media (min-width: 80rem)");
    expect(css).toContain("grid-template-columns: 5rem minmax(0, 1fr)");
    expect(css).toContain("grid-template-columns: 17rem minmax(0, 1fr)");
    expect(css).toContain("vdn-v2-shell-context-rail");
  });

  it("uses the design tokens for touch targets, safe areas and mobile content clearance", () => {
    expect(css).toContain("var(--v2-control-minimum-touch-target)");
    expect(css).toContain("var(--v2-layout-safe-area-top)");
    expect(css).toContain("var(--v2-layout-safe-area-bottom)");
    expect(css).toContain("calc(7rem + var(--v2-layout-safe-area-bottom))");
  });

  it("preserves reduced motion and avoids global selectors in the public stylesheet", () => {
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("var(--v2-motion-duration-reduced)");
    expect(css).not.toMatch(/(^|\n)\s*:root\b/);
    expect(css).not.toMatch(/(^|\n)\s*(html|body)\b/);
  });
});
