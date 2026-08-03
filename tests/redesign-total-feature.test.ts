import { describe, expect, it } from "vitest";

import {
  TOTAL_REDESIGN_FEATURE_ENV,
  parseTotalRedesignFeatureFlag,
  resolveTotalRedesignFeatureFlag,
  shouldActivateTotalRedesign,
} from "../src/config/redesign-total-feature";

describe("total redesign feature", () => {
  it.each([
    [undefined, false],
    [false, false],
    [true, true],
    ["true", true],
    ["false", false],
    ["TRUE", false],
    ["1", false],
  ] as const)("parses %s as %s", (value, expected) => {
    expect(parseTotalRedesignFeatureFlag(value)).toBe(expected);
  });

  it("defaults off and honors only the dedicated environment key", () => {
    expect(resolveTotalRedesignFeatureFlag({})).toBe(false);
    expect(
      resolveTotalRedesignFeatureFlag({
        [TOTAL_REDESIGN_FEATURE_ENV]: "true",
      }),
    ).toBe(true);
    expect(
      resolveTotalRedesignFeatureFlag({
        [TOTAL_REDESIGN_FEATURE_ENV]: "false",
      }),
    ).toBe(false);
    expect(resolveTotalRedesignFeatureFlag({ VITE_FF_NATIVE_SHELL: true })).toBe(false);
  });

  it("requires the Native Shell and the visual flag", () => {
    expect(shouldActivateTotalRedesign(false, false)).toBe(false);
    expect(shouldActivateTotalRedesign(false, true)).toBe(false);
    expect(shouldActivateTotalRedesign(true, false)).toBe(false);
    expect(shouldActivateTotalRedesign(true, true)).toBe(true);
  });

  it("has no storage, URL, cookie or database override", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/config/redesign-total-feature.ts", "utf8"),
    );

    expect(source).not.toMatch(
      /localStorage|sessionStorage|document\.cookie|URLSearchParams|supabase/,
    );
  });
});
