import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { brand } from "../src/config/brand";
import { nativeShellTokens } from "../src/config/native-shell-tokens";

const css = readFileSync(resolve("src/styles/native-shell.tokens.css"), "utf8");
const freezeDocument = readFileSync(
  resolve("docs/native-shell-integration/12-visual-reference-freeze.md"),
  "utf8",
);

describe("native shell visual reference and tokens", () => {
  it("records the verified hashes and the partially frozen status", () => {
    expect(freezeDocument).toContain(
      "203d761b049073c0a809ec62365a02729ec76f80550ed4b78e6efcbf3a9180dd",
    );
    expect(freezeDocument).toContain(
      "3513a0e7c50e37018688af7511499b1de792f9af1a2031d328a80971eda0c2c5",
    );
    expect(freezeDocument).toContain(
      "c3a3c2e6de12d55120b859fc6febbb4f1993a8812cec88758b321a29d15f7d02",
    );
    expect(freezeDocument).toContain("PARCIALMENTE CONGELADA");
    expect(freezeDocument).toContain("Tema escuro: não congelado");
  });

  it("keeps the canonical token values exact without replacing legacy brand values", () => {
    expect(nativeShellTokens.brand).toEqual({
      action: "#EB4F68",
      actionStrong: "#D93F59",
      actionSoft: "#FDE8EC",
      violet: {
        strong: "#6554D9",
        base: "#7462E8",
        soft: "#EEEAFE",
      },
    });
    expect(nativeShellTokens.light).toEqual({
      canvas: "#FAFAFA",
      surfacePrimary: "#FFFFFF",
      surfaceSecondary: "#F6F6F6",
      surfaceSoft: "#F8F8F8",
      textPrimary: "#1A1A1D",
      textSecondary: "#696B73",
      border: "#E6E7EA",
    });
    expect(brand.theme.action).toBe("#ff4f68");
    expect(brand.theme.action).not.toBe(nativeShellTokens.brand.action);
  });

  it("marks dark values as planned and not visually frozen", () => {
    expect(nativeShellTokens.darkStatus).toBe("not-frozen");
    expect(nativeShellTokens.dark).toEqual({
      canvas: "#101114",
      surfacePrimary: "#17181C",
      surfaceSecondary: "#1E2025",
      surfaceSoft: "#24262C",
      textPrimary: "#F4F4F5",
      textSecondary: "#B7B9C0",
      border: "#30323A",
      actionSoft: "#3A2028",
    });
  });

  it("preserves the frozen motion and reference-only layout contracts", () => {
    expect(nativeShellTokens.motion).toEqual({
      touch: "100ms",
      simple: "190ms",
      depth: "260ms",
      sheet: "280ms",
      easeEnter: "cubic-bezier(0.22, 1, 0.36, 1)",
      easeExit: "cubic-bezier(0.4, 0, 1, 1)",
    });
    expect(nativeShellTokens.layout).toEqual({
      rail: "72px",
      sidebar: "244px",
      contextPanel: "300px",
      touchTarget: "44px",
      mobileInputFont: "16px",
    });
  });

  it("keeps every CSS rule inside the native shell boundary", () => {
    const selectors = css
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.endsWith("{"))
      .map((line) => line.slice(0, -1).trim());

    expect(selectors).toHaveLength(2);
    expect(selectors.every((selector) => selector.startsWith("[data-vdn-native-shell]"))).toBe(
      true,
    );
    expect(css).not.toMatch(/(^|})\s*:root\s*\{/m);
    expect(css).not.toMatch(/(^|})\s*(html|body|\.dark)\b[^{]*\{/m);
    expect(css).toContain('[data-vdn-native-shell][data-theme="dark"]');
    expect(css).not.toMatch(/@import/);
  });
});
