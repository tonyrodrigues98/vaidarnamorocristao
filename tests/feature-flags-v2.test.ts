import { describe, expect, it } from "vitest";
import {
  parseFeatureFlag,
  resolveV2FeatureFlags,
  V2_FEATURE_FLAG_ENV,
} from "../src/v2/platform/feature-flags";

describe("V2 feature flags", () => {
  it("keeps every V2 feature disabled when no flag is configured", () => {
    const flags = resolveV2FeatureFlags({});

    expect(Object.keys(flags)).toEqual(Object.keys(V2_FEATURE_FLAG_ENV));
    expect(Object.values(flags).every((enabled) => enabled === false)).toBe(true);
  });

  it("treats missing and invalid values as false", () => {
    expect(parseFeatureFlag(undefined)).toBe(false);
    expect(parseFeatureFlag(false)).toBe(false);
    expect(parseFeatureFlag("")).toBe(false);
    expect(parseFeatureFlag("TRUE")).toBe(false);
    expect(parseFeatureFlag(" true ")).toBe(false);
    expect(parseFeatureFlag("1")).toBe(false);
  });

  it("enables only the exact boolean or string value true", () => {
    expect(parseFeatureFlag(true)).toBe(true);
    expect(parseFeatureFlag("true")).toBe(true);
  });
});
