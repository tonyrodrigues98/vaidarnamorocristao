// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        injectRegister: "auto",
        registerType: "autoUpdate",
        manifestFilename: "manifest.webmanifest",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "icon-192.png",
          "icon-512.png",
          "offline.html",
          "sw.js",
        ],
        manifest: {
          name: "VaiDarNamoro",
          short_name: "VaiDarNamoro",
          description: "Plataforma crista de relacionamentos com proposito.",
          lang: "pt-BR",
          start_url: "/inicio",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#fff7f8",
          theme_color: "#ff4f68",
          categories: ["lifestyle", "social"],
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  },
});
