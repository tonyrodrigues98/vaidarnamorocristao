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
    canvasLight: "#fff7f8",
    canvasDark: "#0b0b0d",
  },
  positioning: {
    community: "Uma comunidade cristã para viver, compartilhar e criar conexões com propósito.",
    dating: "Relacionamentos cristãos sérios com propósito.",
    live: "Uma comunidade real, feita de pessoas reais.",
  },
  assets: {
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    socialImage: "/og-image.jpg",
    manifest: "/manifest.webmanifest",
  },
} as const;

export type Brand = typeof brand;
