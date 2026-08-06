export const V2_SEMANTIC_COLOR_NAMES = [
  "canvas",
  "surface",
  "surfaceElevated",
  "surfaceSubtle",
  "surfaceInverse",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "textInverse",
  "borderDefault",
  "borderStrong",
  "brand",
  "brandHover",
  "brandActive",
  "accent",
  "success",
  "warning",
  "danger",
  "info",
  "focusRing",
  "overlay",
  "disabled",
] as const;

export type V2SemanticColorName = (typeof V2_SEMANTIC_COLOR_NAMES)[number];
export type V2ThemeName = "light" | "dark";
export type V2ThemeColors = Readonly<Record<V2SemanticColorName, string>>;

const lightColors = {
  canvas: "#f7f7f5",
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceSubtle: "#eef1ef",
  surfaceInverse: "#202936",
  textPrimary: "#202936",
  textSecondary: "#465264",
  textMuted: "#667085",
  textInverse: "#ffffff",
  borderDefault: "#d9ddd8",
  borderStrong: "#78837d",
  brand: "#4c4f91",
  brandHover: "#41447e",
  brandActive: "#35386c",
  accent: "#a94660",
  success: "#176b51",
  warning: "#875000",
  danger: "#ad273f",
  info: "#245f9e",
  focusRing: "#4c4f91",
  overlay: "rgba(22, 28, 38, 0.62)",
  disabled: "#8a949f",
} satisfies V2ThemeColors;

const darkColors = {
  canvas: "#11151c",
  surface: "#181e27",
  surfaceElevated: "#202734",
  surfaceSubtle: "#252d3a",
  surfaceInverse: "#f7f7f5",
  textPrimary: "#f5f6f7",
  textSecondary: "#c8d0db",
  textMuted: "#a7b1bf",
  textInverse: "#171b24",
  borderDefault: "#354050",
  borderStrong: "#647286",
  brand: "#adb5ff",
  brandHover: "#c3c9ff",
  brandActive: "#919ceb",
  accent: "#f08ca0",
  success: "#62d3a8",
  warning: "#f3bd68",
  danger: "#ff91a4",
  info: "#7fb9f2",
  focusRing: "#adb5ff",
  overlay: "rgba(3, 6, 11, 0.76)",
  disabled: "#6f7a89",
} satisfies V2ThemeColors;

/**
 * Single source of truth for V2 token values. CSS receives these values through
 * createV2CssVariables; the stylesheet contains references, not a second palette.
 */
export const V2_TOKENS = {
  base: {
    typography: {
      fontFamily: '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      size: {
        caption: "0.75rem",
        label: "0.875rem",
        body: "1rem",
        bodyLarge: "1.125rem",
        headingSmall: "1.25rem",
        headingMedium: "1.5rem",
        headingLarge: "1.875rem",
        display: "2.25rem",
      },
      lineHeight: {
        tight: "1.2",
        heading: "1.3",
        body: "1.55",
        relaxed: "1.65",
      },
      weight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      letterSpacing: {
        tight: "-0.02em",
        normal: "0",
        wide: "0.02em",
      },
    },
    space: {
      none: "0",
      xxs: "0.125rem",
      xs: "0.25rem",
      sm: "0.5rem",
      md: "0.75rem",
      lg: "1rem",
      xl: "1.5rem",
      "2xl": "2rem",
      "3xl": "3rem",
      "4xl": "4rem",
    },
    layout: {
      contentNarrow: "40rem",
      contentStandard: "64rem",
      contentWide: "80rem",
      gutterCompact: "1rem",
      gutterFluid: "clamp(1rem, 3vw, 2rem)",
      densityComfortable: "1rem",
      safeAreaTop: "env(safe-area-inset-top, 0px)",
      safeAreaRight: "env(safe-area-inset-right, 0px)",
      safeAreaBottom: "env(safe-area-inset-bottom, 0px)",
      safeAreaLeft: "env(safe-area-inset-left, 0px)",
    },
    control: {
      minimumTouchTarget: "44px",
      minimumHeight: "44px",
      inputFontSize: "16px",
      compactHeight: "44px",
      defaultHeight: "48px",
      spaciousHeight: "52px",
    },
    shape: {
      radiusSmall: "0.5rem",
      radiusMedium: "0.75rem",
      radiusLarge: "1rem",
      radiusPill: "999px",
    },
    border: {
      widthDefault: "1px",
      widthStrong: "2px",
    },
    shadow: {
      none: "none",
      levelOne: "0 1px 2px rgba(22, 28, 38, 0.05), 0 6px 18px rgba(22, 28, 38, 0.05)",
      levelTwo: "0 2px 6px rgba(22, 28, 38, 0.07), 0 14px 32px rgba(22, 28, 38, 0.08)",
      focus: "0 0 0 3px color-mix(in srgb, var(--v2-color-focus-ring) 28%, transparent)",
    },
    zIndex: {
      base: "0",
      raised: "10",
      sticky: "20",
      overlay: "40",
      modal: "50",
      toast: "60",
    },
    motion: {
      durationInstant: "80ms",
      durationFast: "140ms",
      durationBase: "220ms",
      durationSlow: "320ms",
      durationReduced: "0.01ms",
      easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
      easingEnter: "cubic-bezier(0.16, 1, 0.3, 1)",
      easingExit: "cubic-bezier(0.4, 0, 1, 1)",
    },
    icon: {
      sizeSmall: "1rem",
      sizeMedium: "1.25rem",
      sizeLarge: "1.5rem",
      strokeWidth: "2",
    },
  },
  themes: {
    light: { colors: lightColors },
    dark: { colors: darkColors },
  },
} as const;

type TokenLeaf = string | number;
interface TokenTree {
  readonly [key: string]: TokenLeaf | TokenTree;
}
export type V2CssVariables = Record<`--v2-${string}`, TokenLeaf>;

function toKebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function flattenTokens(
  target: V2CssVariables,
  prefix: string[],
  value: TokenLeaf | TokenTree,
): void {
  if (typeof value === "string" || typeof value === "number") {
    target[`--v2-${prefix.map(toKebabCase).join("-")}`] = value;
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    flattenTokens(target, [...prefix, key], nestedValue);
  }
}

export function createV2CssVariables(theme: V2ThemeName): V2CssVariables {
  const variables = {} as V2CssVariables;
  flattenTokens(variables, [], V2_TOKENS.base);
  flattenTokens(variables, ["color"], V2_TOKENS.themes[theme].colors);
  return variables;
}

export const V2_CSS_VARIABLE_NAMES = Object.freeze(
  Object.keys(createV2CssVariables("light")) as Array<keyof V2CssVariables>,
);
