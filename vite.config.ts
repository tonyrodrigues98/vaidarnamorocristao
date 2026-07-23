// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execFileSync } from "node:child_process";

function resolveBuildCommit() {
  const environmentCommit =
    process.env.GITHUB_SHA ?? process.env.CF_PAGES_COMMIT_SHA ?? process.env.LOVABLE_GIT_COMMIT_SHA;

  if (environmentCommit && /^[a-f0-9]{7,40}$/i.test(environmentCommit.trim())) {
    return environmentCommit.trim().toLowerCase();
  }

  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  vite: {
    define: {
      __VDN_BUILD_COMMIT__: JSON.stringify(resolveBuildCommit()),
      __VDN_BUILD_CHANNEL__: JSON.stringify("community-platform-v2"),
    },
  },
});
