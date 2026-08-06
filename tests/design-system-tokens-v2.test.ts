import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  V2_CSS_VARIABLE_NAMES,
  V2_DESIGN_FOUNDATION,
  V2_SEMANTIC_COLOR_NAMES,
  V2_TOKENS,
  createV2CssVariables,
  type V2ThemeColors,
} from "../src/v2/design-system";

const css = readFileSync(new URL("../src/v2/design-system/styles.css", import.meta.url), "utf8");
const V2_SCOPE_SELECTOR = ".vdn-v2[data-vdn-v2]";

function findClosingBrace(source: string, openingBrace: number): number {
  let depth = 1;
  let quote: '"' | "'" | null = null;

  for (let index = openingBrace + 1; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (quote) {
      if (character === "\\") {
        index += 1;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "/" && nextCharacter === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      if (commentEnd === -1) throw new Error("Unterminated CSS comment");
      index = commentEnd + 1;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Unterminated CSS block");
}

function splitSelectorList(selectorList: string): string[] {
  const selectors: string[] = [];
  let start = 0;
  let parenthesisDepth = 0;
  let bracketDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < selectorList.length; index += 1) {
    const character = selectorList[index];

    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'") quote = character;
    else if (character === "(") parenthesisDepth += 1;
    else if (character === ")") parenthesisDepth -= 1;
    else if (character === "[") bracketDepth += 1;
    else if (character === "]") bracketDepth -= 1;
    else if (character === "," && parenthesisDepth === 0 && bracketDepth === 0) {
      selectors.push(selectorList.slice(start, index).trim());
      start = index + 1;
    }
  }

  selectors.push(selectorList.slice(start).trim());
  return selectors.filter(Boolean);
}

function collectQualifiedSelectors(source: string): string[] {
  const selectors: string[] = [];
  let index = 0;

  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (source.startsWith("/*", index)) {
      const commentEnd = source.indexOf("*/", index + 2);
      if (commentEnd === -1) throw new Error("Unterminated CSS comment");
      index = commentEnd + 2;
      continue;
    }
    if (index >= source.length) break;

    const preludeStart = index;
    let parenthesisDepth = 0;
    let bracketDepth = 0;
    let quote: '"' | "'" | null = null;

    while (index < source.length) {
      const character = source[index];

      if (quote) {
        if (character === "\\") index += 1;
        else if (character === quote) quote = null;
      } else if (character === '"' || character === "'") quote = character;
      else if (character === "(") parenthesisDepth += 1;
      else if (character === ")") parenthesisDepth -= 1;
      else if (character === "[") bracketDepth += 1;
      else if (character === "]") bracketDepth -= 1;
      else if (
        (character === "{" || character === ";") &&
        parenthesisDepth === 0 &&
        bracketDepth === 0
      )
        break;

      index += 1;
    }

    if (index >= source.length) break;
    const prelude = source.slice(preludeStart, index).trim();
    if (source[index] === ";") {
      index += 1;
      continue;
    }

    const closingBrace = findClosingBrace(source, index);
    const block = source.slice(index + 1, closingBrace);

    if (/^@(media|supports|container|layer)\b/i.test(prelude)) {
      selectors.push(...collectQualifiedSelectors(block));
    } else if (!prelude.startsWith("@")) {
      selectors.push(...splitSelectorList(prelude));
    }

    index = closingBrace + 1;
  }

  return selectors;
}

function assertPublicStylesAreScoped(source: string): string[] {
  const selectors = collectQualifiedSelectors(source);
  for (const selector of selectors) {
    if (!selector.startsWith(V2_SCOPE_SELECTOR)) {
      throw new Error(`Unscoped public selector: ${selector}`);
    }
  }
  return selectors;
}

function assertNoUndefined(value: unknown, path = "tokens"): void {
  expect(value, `${path} is undefined`).not.toBeUndefined();
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assertNoUndefined(nested, `${path}.${key}`);
    }
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  if (value.length !== 6) throw new Error(`Expected six-digit hex, received ${hex}`);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  return hexToRgb(hex)
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function expectCriticalContrast(colors: V2ThemeColors) {
  const normalTextPairs: Array<[string, string]> = [
    [colors.textPrimary, colors.canvas],
    [colors.textSecondary, colors.canvas],
    [colors.textMuted, colors.canvas],
    [colors.textPrimary, colors.surface],
    [colors.textInverse, colors.brand],
    [colors.textInverse, colors.danger],
    [colors.success, colors.surface],
    [colors.warning, colors.surface],
    [colors.danger, colors.surface],
    [colors.info, colors.surface],
  ];

  for (const [foreground, background] of normalTextPairs) {
    expect(
      contrastRatio(foreground, background),
      `${foreground} on ${background} must satisfy WCAG AA`,
    ).toBeGreaterThanOrEqual(4.5);
  }

  expect(contrastRatio(colors.borderStrong, colors.surface)).toBeGreaterThanOrEqual(3);
  expect(contrastRatio(colors.focusRing, colors.surface)).toBeGreaterThanOrEqual(3);
}

describe("V2 design tokens", () => {
  it("defines every required semantic color in both complete themes", () => {
    for (const theme of ["light", "dark"] as const) {
      expect(Object.keys(V2_TOKENS.themes[theme].colors)).toEqual([...V2_SEMANTIC_COLOR_NAMES]);
      assertNoUndefined(V2_TOKENS.themes[theme]);
    }
  });

  it("keeps the foundation derived from the token source", () => {
    expect(V2_DESIGN_FOUNDATION).toMatchObject({
      fontFamily: "Poppins",
      iconLibrary: "lucide-react",
      canvasLight: "#f7f7f5",
      mobileInputMinFontSizePx: 16,
      minimumTouchTargetPx: 44,
      minimumControlHeightPx: 44,
      scopedSelector: "[data-vdn-v2]",
      defaultTheme: "light",
      respectsReducedMotion: true,
      respectsSafeAreas: true,
    });
  });

  it("creates complete CSS variables from the TypeScript source without undefined values", () => {
    const lightVariables = createV2CssVariables("light");
    const darkVariables = createV2CssVariables("dark");

    expect(Object.keys(lightVariables)).toEqual(Object.keys(darkVariables));
    expect(Object.keys(lightVariables)).toEqual([...V2_CSS_VARIABLE_NAMES]);
    assertNoUndefined(lightVariables);
    assertNoUndefined(darkVariables);
  });

  it("keeps every public selector inside the V2 theme boundary", () => {
    const selectors = assertPublicStylesAreScoped(css);

    expect(selectors).toContain(`${V2_SCOPE_SELECTOR} .vdn-v2-button`);
    expect(selectors).toContain(`${V2_SCOPE_SELECTOR} textarea.vdn-v2-field__control`);
    expect(selectors).toContain(`${V2_SCOPE_SELECTOR} .vdn-v2-skeleton`);
    expect(selectors).toContain(`${V2_SCOPE_SELECTOR} .vdn-v2-loading__spinner`);
    expect(selectors).toContain(`${V2_SCOPE_SELECTOR} .vdn-v2-visually-hidden`);
    expect(css).not.toMatch(/(^|\n)\s*:root\b/);
    expect(css).not.toMatch(/(^|\n)\s*(html|body)\b/);
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("detects unscoped grouped and media-query selectors without treating keyframes as selectors", () => {
    expect(() =>
      assertPublicStylesAreScoped(`${V2_SCOPE_SELECTOR} .valid, .global-leak { color: red; }`),
    ).toThrow(/\.global-leak/);
    expect(() =>
      assertPublicStylesAreScoped(
        `@media (prefers-reduced-motion: reduce) { .media-leak { animation: none; } }`,
      ),
    ).toThrow(/\.media-leak/);
    expect(() =>
      assertPublicStylesAreScoped(`
        @keyframes vdn-v2-safe {
          from { opacity: 0; }
          50% { opacity: 0.5; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          ${V2_SCOPE_SELECTOR} .vdn-v2-safe { animation: none; }
        }
      `),
    ).not.toThrow();
  });

  it("references only generated token variables", () => {
    const referencedVariables = [
      ...new Set(Array.from(css.matchAll(/var\((--v2-[a-z0-9-]+)/g), (match) => match[1])),
    ];
    for (const variable of referencedVariables) {
      expect(V2_CSS_VARIABLE_NAMES).toContain(variable);
    }
  });

  it("provides mobile controls, safe areas and reduced-motion behavior", () => {
    expect(V2_TOKENS.base.control.minimumTouchTarget).toBe("44px");
    expect(V2_TOKENS.base.control.minimumHeight).toBe("44px");
    expect(V2_TOKENS.base.control.inputFontSize).toBe("16px");
    expect(V2_TOKENS.base.layout.safeAreaTop).toContain("safe-area-inset-top");
    expect(V2_TOKENS.base.layout.safeAreaBottom).toContain("safe-area-inset-bottom");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none");
  });

  it("meets WCAG AA for critical light and dark combinations", () => {
    expectCriticalContrast(V2_TOKENS.themes.light.colors);
    expectCriticalContrast(V2_TOKENS.themes.dark.colors);
  });
});
