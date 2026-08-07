export const brand = {
  name: "VaiDarNamoro",
  displayName: "Vai Dar Namoro",
  shortName: "VDN",
  origin: "https://vaidarnamoro.com",
  locale: "pt_BR",
  language: "pt-BR",
  theme: {
    action: "#ff4f68",
    actionStrong: "#e6415b",
    actionSoft: "#fff0f3",
    canvasLight: "#fafafa",
    canvasDark: "#0b0b0d",
  },
  positioning: {
    community: "Uma comunidade cristã para viver, compartilhar e criar conexões com propósito.",
    dating: "Relacionamentos cristãos sérios com propósito.",
    live: "Uma comunidade real, feita de pessoas reais.",
  },
  assets: {
    favicon: "/brand/orha-mark-ink.png",
    appleTouchIcon: "/brand/orha-mark-ink.png",
    icon192: "/brand/orha-mark-ink.png",
    icon512: "/brand/orha-mark-ink.png",
    socialImage: "/og-image.jpg",
    manifest: "/manifest.webmanifest",
  },
} as const;

export type Brand = typeof brand;
