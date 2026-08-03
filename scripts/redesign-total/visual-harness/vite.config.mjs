import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../../public", import.meta.url)),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../../src", import.meta.url)),
    },
  },
  server: { strictPort: true },
  define: { "process.env.NODE_ENV": JSON.stringify("test") },
});
