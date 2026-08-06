import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import {
  PROTOTYPE_01_FEATURE_ENV,
  PROTOTYPE_01_REVIEW_DEFAULT,
  parsePrototype01FeatureFlag,
  resolvePrototype01FeatureFlag,
  shouldRenderPrototype01Shell,
} from "../src/config/prototype-01-feature";

describe("Prototype 01 feature flag", () => {
  it.each([
    [undefined, false],
    [false, false],
    [true, true],
    ["true", true],
    ["false", false],
    ["TRUE", false],
    ["1", false],
  ] as const)("parses %s as %s", (value, expected) => {
    expect(parsePrototype01FeatureFlag(value)).toBe(expected);
  });

  it("uses only the dedicated flag and defaults to the isolated review channel", () => {
    expect(PROTOTYPE_01_REVIEW_DEFAULT).toBe(true);
    expect(resolvePrototype01FeatureFlag({})).toBe(true);
    expect(resolvePrototype01FeatureFlag({ [PROTOTYPE_01_FEATURE_ENV]: "true" })).toBe(true);
    expect(resolvePrototype01FeatureFlag({ [PROTOTYPE_01_FEATURE_ENV]: true })).toBe(true);
    expect(resolvePrototype01FeatureFlag({ [PROTOTYPE_01_FEATURE_ENV]: "false" })).toBe(false);
    expect(resolvePrototype01FeatureFlag({ VITE_FF_TOTAL_REDESIGN: "true" })).toBe(true);
  });

  it("requires an authenticated eligible destination", () => {
    const behavior = getDestinationBehavior("/inicio");
    expect(
      shouldRenderPrototype01Shell({
        featureEnabled: true,
        behavior,
        loading: false,
        authenticated: true,
      }),
    ).toBe(true);
    expect(
      shouldRenderPrototype01Shell({
        featureEnabled: false,
        behavior,
        loading: false,
        authenticated: true,
      }),
    ).toBe(false);
    expect(
      shouldRenderPrototype01Shell({
        featureEnabled: true,
        behavior,
        loading: false,
        authenticated: false,
      }),
    ).toBe(false);
  });
});
