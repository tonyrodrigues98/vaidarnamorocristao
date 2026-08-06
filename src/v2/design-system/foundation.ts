import { V2_TOKENS } from "./tokens";

/**
 * Stable acceptance constraints shared by V2 UI work. Values are derived from
 * the token source and do not mutate the active legacy theme.
 */
export const V2_DESIGN_FOUNDATION = Object.freeze({
  fontFamily: "Poppins",
  fontFamilyStack: V2_TOKENS.base.typography.fontFamily,
  iconLibrary: "lucide-react",
  iconStrokeWidth: Number(V2_TOKENS.base.icon.strokeWidth),
  surfaceBackground: "off-white",
  canvasLight: V2_TOKENS.themes.light.colors.canvas,
  mobileInputMinFontSizePx: Number.parseInt(V2_TOKENS.base.control.inputFontSize, 10),
  minimumTouchTargetPx: Number.parseInt(V2_TOKENS.base.control.minimumTouchTarget, 10),
  minimumControlHeightPx: Number.parseInt(V2_TOKENS.base.control.minimumHeight, 10),
  respectsReducedMotion: true,
  respectsSafeAreas: true,
  scopedSelector: "[data-vdn-v2]",
  defaultTheme: "light",
});
