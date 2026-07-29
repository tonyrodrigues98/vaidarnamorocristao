import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import {
  NATIVE_SHELL_FEATURE_ENV,
  isNativeShellEligibleDestination,
  nativeShellInitialDestinationIds,
  parseNativeShellFeatureFlag,
  resolveNativeShellFeatureFlag,
  shouldExposeNativeRootDestination,
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

describe("flagged native roots", () => {
  it.each([
    ["/comunidade", false, false],
    ["/comunidade", true, true],
    ["/explorar", false, false],
    ["/explorar", true, true],
    ["/inicio", true, false],
    ["/conversas/comunidade", true, false],
    ["/admin", true, false],
    ["/rota-desconhecida", true, false],
  ] as const)("resolves %s with feature=%s as %s", (pathname, featureEnabled, expected) => {
    expect(shouldExposeNativeRootDestination(pathname, featureEnabled)).toBe(expected);
  });

  it("normalizes query, hash and trailing slash without expanding the allowlist", () => {
    expect(shouldExposeNativeRootDestination("/comunidade/?tab=agora#top", true)).toBe(true);
    expect(shouldExposeNativeRootDestination("/explorar/", true)).toBe(true);
    expect(nativeShellInitialDestinationIds).toEqual(["app-home"]);
  });
});
