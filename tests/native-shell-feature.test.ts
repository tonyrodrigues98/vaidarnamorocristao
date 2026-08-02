import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import {
  NATIVE_SHELL_FEATURE_ENV,
  isNativeShellEligibleDestination,
  nativeShellInitialDestinationIds,
  nativeShellPrimaryDestinationIds,
  nativeShellSecondaryDestinationIds,
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

describe("native shell primary rollout", () => {
  it("has exactly the five primary destination ids in its typed allowlist", () => {
    const expected = [
      "app-home",
      "compatibility-community",
      "app-explore",
      "app-conversations",
      "app-profile",
    ];
    expect(nativeShellPrimaryDestinationIds).toEqual(expected);
    expect(nativeShellInitialDestinationIds).toEqual(expected);
  });

  it.each([
    "/conversas/abc",
    "/conversas/comunidade",
    "/devocional",
    "/",
    "/admin",
    "/v2",
    "/api/public/runtime-config",
    "/rota-desconhecida",
  ])("does not enable %s", (pathname) => {
    expect(isNativeShellEligibleDestination(getDestinationBehavior(pathname))).toBe(false);
  });

  it("keeps secondary rollout separate from the five primary destinations", () => {
    expect(nativeShellSecondaryDestinationIds).toEqual([
      "app-account",
      "app-notifications",
      "app-store",
      "app-pet",
      "app-pet-arcade",
      "app-dating",
      "app-dating-profile",
      "app-interests",
      "app-matches",
      "app-anonymous-notes",
      "app-verification",
      "app-blocked-users",
      "app-dashboard",
      "app-purpose",
      "support-root",
      "support-help",
      "support-ticket",
    ]);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/conta"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/notificacoes"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/loja"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/meu-pet"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/pet-arcade"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/pretendentes"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/pretendentes/teste"))).toBe(
      true,
    );
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/interesses"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/matches"))).toBe(true);
    expect(isNativeShellEligibleDestination(getDestinationBehavior("/recados"))).toBe(true);
    expect(nativeShellPrimaryDestinationIds).toHaveLength(5);
  });

  it.each(["/inicio", "/comunidade", "/explorar", "/conversas", "/perfil"])(
    "enables the authenticated primary root %s",
    (pathname) => {
      expect(isNativeShellEligibleDestination(getDestinationBehavior(pathname))).toBe(true);
    },
  );
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
    expect(nativeShellInitialDestinationIds).toEqual(nativeShellPrimaryDestinationIds);
  });
});
