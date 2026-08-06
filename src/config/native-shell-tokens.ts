export const nativeShellTokens = {
  referenceStatus: "partially-frozen",
  darkStatus: "not-frozen",
  brand: {
    action: "#EB4F68",
    actionStrong: "#D93F59",
    actionSoft: "#FDE8EC",
    violet: {
      strong: "#6554D9",
      base: "#7462E8",
      soft: "#EEEAFE",
    },
  },
  light: {
    canvas: "#FAFAFA",
    surfacePrimary: "#FFFFFF",
    surfaceSecondary: "#F6F6F6",
    surfaceSoft: "#F8F8F8",
    textPrimary: "#1A1A1D",
    textSecondary: "#696B73",
    border: "#E6E7EA",
  },
  dark: {
    canvas: "#101114",
    surfacePrimary: "#17181C",
    surfaceSecondary: "#1E2025",
    surfaceSoft: "#24262C",
    textPrimary: "#F4F4F5",
    textSecondary: "#B7B9C0",
    border: "#30323A",
    actionSoft: "#3A2028",
  },
  motion: {
    touch: "100ms",
    simple: "190ms",
    depth: "260ms",
    sheet: "280ms",
    easeEnter: "cubic-bezier(0.22, 1, 0.36, 1)",
    easeExit: "cubic-bezier(0.4, 0, 1, 1)",
  },
  layout: {
    rail: "72px",
    sidebar: "244px",
    contextPanel: "300px",
    touchTarget: "44px",
    mobileInputFont: "16px",
  },
} as const;

export type NativeShellTokens = typeof nativeShellTokens;
export type NativeShellReferenceStatus = NativeShellTokens["referenceStatus"];
export type NativeShellDarkStatus = NativeShellTokens["darkStatus"];
