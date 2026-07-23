import { describe, expect, it } from "vitest";
import {
  V2_PRIMARY_NAVIGATION,
  V2_SECONDARY_NAVIGATION,
  formatV2NavigationBadge,
  isV2NavigationItemActive,
  resolveV2OverlayKeyboardAction,
  resolveV2OverlayState,
} from "../src/v2/app-shell";
import { resolveV2FeatureFlags } from "../src/v2/platform/feature-flags";

describe("V2 App Shell interaction contracts", () => {
  it("keeps the five mobile destinations with create as a dedicated action", () => {
    expect(V2_PRIMARY_NAVIGATION.map((item) => item.id)).toEqual([
      "home",
      "community",
      "conversations",
      "profile",
    ]);
    expect(V2_PRIMARY_NAVIGATION.map((item) => item.label)).toEqual([
      "Início",
      "Comunidade",
      "Conversas",
      "Perfil",
    ]);
  });

  it("keeps optional and shared experiences in secondary navigation", () => {
    expect(V2_SECONDARY_NAVIGATION.map((item) => item.id)).toEqual([
      "dating",
      "explore",
      "shop",
      "avatar",
      "pets",
      "settings",
    ]);
    expect(V2_SECONDARY_NAVIGATION.find((item) => item.id === "dating")?.label).toBe(
      "Pretendentes",
    );
  });

  it("resolves active state by stable id instead of route-name conditionals", () => {
    expect(isV2NavigationItemActive("community", { id: "community" })).toBe(true);
    expect(isV2NavigationItemActive("community", { id: "dating" })).toBe(false);
  });

  it("formats finite navigation badges predictably", () => {
    expect(formatV2NavigationBadge(0)).toBe("0");
    expect(formatV2NavigationBadge(8)).toBe("8");
    expect(formatV2NavigationBadge(112)).toBe("99+");
    expect(formatV2NavigationBadge("Novo")).toBe("Novo");
  });

  it("opens one overlay at a time and toggles the same trigger closed", () => {
    expect(resolveV2OverlayState(null, "create")).toBe("create");
    expect(resolveV2OverlayState("create", "notifications")).toBe("notifications");
    expect(resolveV2OverlayState("notifications", "notifications")).toBeNull();
  });

  it("closes on Escape and traps focus at both tab boundaries", () => {
    expect(
      resolveV2OverlayKeyboardAction({
        key: "Escape",
        shiftKey: false,
        activeIndex: 1,
        focusableCount: 3,
      }),
    ).toBe("close");
    expect(
      resolveV2OverlayKeyboardAction({
        key: "Tab",
        shiftKey: true,
        activeIndex: 0,
        focusableCount: 3,
      }),
    ).toBe("focus-last");
    expect(
      resolveV2OverlayKeyboardAction({
        key: "Tab",
        shiftKey: false,
        activeIndex: 2,
        focusableCount: 3,
      }),
    ).toBe("focus-first");
  });

  it("does not intercept ordinary keyboard input", () => {
    expect(
      resolveV2OverlayKeyboardAction({
        key: "ArrowDown",
        shiftKey: false,
        activeIndex: 0,
        focusableCount: 2,
      }),
    ).toBe("none");
  });

  it("keeps the production App Shell flag fail-closed", () => {
    expect(resolveV2FeatureFlags({}).appShell).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_APP_SHELL: "TRUE" }).appShell).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_APP_SHELL: "true" }).appShell).toBe(true);
  });
});
