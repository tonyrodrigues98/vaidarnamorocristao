import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("iOS Liquid Glass visual foundation", () => {
  const globalCss = read("src/styles/ios-liquid-glass.css");
  const root = read("src/routes/__root.tsx");
  const bottomNavigation = read("src/components/native-shell/NativeBottomNavigation.tsx");

  it("uses the Apple system font without a remote font dependency", () => {
    expect(globalCss).toContain("-apple-system");
    expect(globalCss).toContain("SF Pro Display");
    expect(root).not.toContain("fonts.googleapis.com");
    expect(root).not.toContain("fonts.gstatic.com");
  });

  it("reserves Liquid Glass for functional chrome", () => {
    expect(globalCss).toContain(".ios-functional-glass");
    expect(globalCss).toContain(".vdn-native-shell-frame__top-bar");
    expect(globalCss).toContain(".vdn-native-shell-frame__bottom-navigation");
    expect(globalCss).toContain(".vdn-admin-topbar");
    expect(globalCss).toContain('[role="menu"]');
    expect(globalCss).toContain('[data-slot="drawer"]');
  });

  it("keeps content on solid grouped surfaces", () => {
    expect(globalCss).toContain("--ios-group: #ffffff");
    expect(globalCss).toContain('[data-slot="card"]');
    expect(globalCss).toContain("background: var(--ios-group)");
  });

  it("uses the GodUI Liquid Glass implementation in the persistent tab bar", () => {
    expect(bottomNavigation).toContain('from "@/components/godui/liquid-glass-card"');
    expect(bottomNavigation).toContain("<LiquidGlassCard");
    expect(bottomNavigation).toContain("data-native-bottom-navigation");
  });

  it("preserves iOS accessibility preferences", () => {
    expect(globalCss).toContain("min-height: 44px");
    expect(globalCss).toContain("env(safe-area-inset-bottom)");
    expect(globalCss).toContain("prefers-reduced-motion: reduce");
    expect(globalCss).toContain("prefers-contrast: more");
    expect(globalCss).toContain("prefers-reduced-transparency: reduce");
  });
});
