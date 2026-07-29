import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/native-shell.frame.css", "utf8");

function selectorsFromStylesheet(stylesheet: string) {
  return [...stylesheet.matchAll(/([^{}]+)\{/g)]
    .map((match) => (match[1] ?? "").trim())
    .filter((rule) => !rule.startsWith("@"))
    .flatMap((rule) => rule.split(","))
    .map((selector) => selector.trim())
    .filter(Boolean);
}

describe("native shell frame CSS boundary", () => {
  it("scopes every public selector to a native shell or local native root boundary", () => {
    const selectors = selectorsFromStylesheet(css);

    expect(selectors.length).toBeGreaterThan(0);
    expect(
      selectors.every(
        (selector) =>
          selector.startsWith("[data-vdn-native-shell]") ||
          selector.startsWith("[data-vdn-native-root]"),
      ),
    ).toBe(true);
  });

  it("does not introduce global, legacy or fixed outer-frame styling", () => {
    expect(css).not.toMatch(/(^|[,{]\s*)(:root|html|body|\.dark)(?=[\s,{:[.#>])/m);
    expect(css).not.toMatch(
      /\[data-vdn-native-shell\]\s*\.vdn-native-shell-frame\s*\{[^}]*position:\s*fixed/s,
    );
    expect(css).toMatch(
      /\[data-vdn-native-shell\]\s*\.vdn-native-shell-frame__bottom-navigation\s*\{[^}]*position:\s*fixed/s,
    );
    expect(css).not.toMatch(
      /\.vdn-native-shell-frame__primary-navigation\s*\{[^}]*position:\s*fixed/s,
    );
    expect(css).toMatch(
      /\.vdn-native-shell-frame__primary-navigation\s*\{[^}]*position:\s*sticky/s,
    );
    expect(css).not.toMatch(/\.vdn-native-shell-frame__top-bar\s*\{[^}]*position:\s*fixed/s);
    expect(css).toMatch(/\.vdn-native-shell-frame__top-bar\s*\{[^}]*position:\s*sticky/s);
    expect(css).not.toMatch(/\.mobile-app-shell|\.mobile-chat-shell|\.app-/);
  });

  it("keeps token imports isolated to the frame component", () => {
    const frame = readFileSync("src/components/native-shell/NativeShellFrame.tsx", "utf8");
    const globalStyles = readFileSync("src/styles.css", "utf8");

    expect(frame).toContain('import "@/styles/native-shell.tokens.css"');
    expect(frame).toContain('import "@/styles/native-shell.frame.css"');
    expect(globalStyles).not.toContain("native-shell.tokens.css");
    expect(globalStyles).not.toContain("native-shell.frame.css");
  });

  it("provides safe-area, responsive and reduced-motion preparation", () => {
    expect(css).toContain("env(safe-area-inset-top");
    expect(css).toContain("env(safe-area-inset-bottom");
    expect(css).toContain("env(safe-area-inset-left");
    expect(css).toContain("env(safe-area-inset-right");
    expect(css).toContain('[data-keyboard-open="true"]');
    expect(css).toContain("@media (min-width: 48rem)");
    expect(css).toContain("@media (min-width: 80rem)");
    expect(css).toContain("grid-template-columns: 72px minmax(0, 1fr)");
    expect(css).toContain("grid-template-columns: var(--vdn-native-sidebar-width) minmax(0, 1fr)");
    expect(css).toContain("height: 100dvh");
    expect(css).toContain("min-height: var(--vdn-native-visual-height, 100dvh)");
    const outerFrameRule =
      css.match(/\[data-vdn-native-shell\]\.vdn-native-shell-frame\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(outerFrameRule).not.toMatch(/(?:^|[;\s])height\s*:/);
    expect(css).toMatch(
      /\[data-keyboard-open="true"\]\s*>\s*\.vdn-native-shell-frame__bottom-navigation\s*\{\s*display:\s*none/s,
    );
    expect(css).not.toMatch(/\[data-keyboard-open="true"\][^{]*\.vdn-native-shell-frame__top-bar/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("min-width: 0");
  });
});
