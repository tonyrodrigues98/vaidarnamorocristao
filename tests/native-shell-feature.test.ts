import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import {
  NATIVE_SHELL_FEATURE_ENV,
  isNativeShellEligibleDestination,
  nativeShellInitialDestinationIds,
  parseNativeShellFeatureFlag,
  resolveNativeShellFeatureFlag,
} from "../src/config/native-shell-feature";

describe("native shell feature flag", () => {
  it.each([
    [undefined, false],
    [false, false],
    [true, true],
    ["true", true],
    ["false", false],
    ["1", false],
    ["TRUE", false],
    [" true ", false],
  ] as const)("parses %s as %s", (value, expected) => {
    expect(parseNativeShellFeatureFlag(value)).toBe(expected);
  });

  it("is disabled by default and reads only its explicit build environment key", () => {
    expect(resolveNativeShellFeatureFlag({})).toBe(false);
    expect(resolveNativeShellFeatureFlag({ [NATIVE_SHELL_FEATURE_ENV]: "true" })).toBe(true);
    expect(resolveNativeShellFeatureFlag({ VITE_FF_V2_APP_SHELL: "true" })).toBe(false);
  });

  it("does not implement storage, query-string, cookie or hidden overrides", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/config/native-shell-feature.ts", "utf8"),
    );

    expect(source).not.toMatch(/localStorage|sessionStorage|document\.cookie|URLSearchParams/);
    expect(source).not.toContain("VITE_FF_V2_APP_SHELL");
  });
});

describe("native shell initial rollout", () => {
  it("has only the app home destination in its typed allowlist", () => {
    expect(nativeShellInitialDestinationIds).toEqual(["app-home"]);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/inicio"))).toBe(true);
  });

  it.each([
    "/conversas",
    "/conversas/abc",
    "/perfil",
    "/",
    "/admin",
    "/comunidade",
    "/v2",
    "/api/public/runtime-config",
    "/rota-desconhecida",
  ])("does not enable %s", (pathname) => {
    expect(isNativeShellEligibleDestination(getDestinationBehavior(pathname))).toBe(false);
  });
});
