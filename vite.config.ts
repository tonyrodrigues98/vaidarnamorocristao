// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        manifestFilename: "manifest.webmanifest",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "offline.html",
          "sw.js",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/icon-maskable-192.png",
          "icons/icon-maskable-512.png",
        ],
        manifest: {
          name: "VaiDarNamoro",
          short_name: "VaiDarNamoro",
          description: "Plataforma cristã de relacionamentos com propósito.",
          lang: "pt-BR",
          start_url: "/inicio",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#fff7f8",
          theme_color: "#ff4f68",
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icons/icon-maskable-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/icons/icon-maskable-512.png",
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
