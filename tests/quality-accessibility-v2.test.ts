import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveBudget, V2_QUALITY_METRICS } from "../scripts/check-v2-quality-budget.mjs";

const shellCss = readFileSync(new URL("../src/v2/app-shell/styles.css", import.meta.url), "utf8");
const designCss = readFileSync(
  new URL("../src/v2/design-system/styles.css", import.meta.url),
  "utf8",
);
const tokens = readFileSync(new URL("../src/v2/design-system/tokens.ts", import.meta.url), "utf8");
const updateCss = readFileSync(
  new URL("../src/v2/platform/resilience/styles.css", import.meta.url),
  "utf8",
);
const shell = readFileSync(new URL("../src/v2/app-shell/V2AppShell.tsx", import.meta.url), "utf8");
const budget = JSON.parse(
  readFileSync(
    new URL("../docs/reestruturacao-v2/audit/v2-quality-budget.json", import.meta.url),
    "utf8",
  ),
) as {
  headroomPercent: number;
  metrics: Record<string, { observedBytes: number; budgetBytes: number }>;
};

describe("V2-022 performance and accessibility guardrails", () => {
  it("derives explicit budgets from observed production bytes", () => {
    expect(V2_QUALITY_METRICS.map((metric) => metric.id)).toEqual([
      "runtime-route-js",
      "v2-css",
      "v2-lazy-js-total",
    ]);
    expect(budget.headroomPercent).toBe(15);
    for (const metric of Object.values(budget.metrics)) {
      expect(metric.observedBytes).toBeGreaterThan(0);
      expect(metric.budgetBytes).toBe(deriveBudget(metric.observedBytes, 15));
    }
  });

  it("keeps V2 styles scoped and reduced-motion aware", () => {
    expect(updateCss).toContain(".vdn-v2[data-vdn-v2] .vdn-v2-update-notice");
    expect(updateCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(updateCss).not.toMatch(/(^|[},]\s*)(:root|html|body)(?=[\s,{])/m);
    expect(shellCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(designCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("preserves keyboard and semantic shell foundations", () => {
    expect(shell).toContain('className="vdn-v2-shell-skip-link"');
    expect(shell).toContain('href="#vdn-v2-main-content"');
    expect(shell).toContain("V2BottomNavigation");
    expect(shell).toContain("V2DesktopSidebar");
    expect(shellCss).toContain(".vdn-v2-shell-skip-link:focus");
  });

  it("preserves touch and mobile input contracts", () => {
    expect(designCss).toContain("var(--v2-control-minimum-touch-target)");
    expect(designCss).toContain("font-size: var(--v2-control-input-font-size)");
    expect(tokens).toMatch(/inputFontSize:\s*"16px"/);
    expect(tokens).toContain("env(safe-area-inset-bottom, 0px)");
  });
});
