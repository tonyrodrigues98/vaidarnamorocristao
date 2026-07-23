import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const integrationRoot = join(projectRoot, "src", "v2", "integration");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("V2 runtime integration boundaries", () => {
  it("keeps provisional pages free from backend, session and environment access", () => {
    const presentationFiles = walk(integrationRoot).filter(
      (path) =>
        /\.(ts|tsx)$/.test(path) &&
        !path.endsWith("V2ShellRuntimeRoute.tsx") &&
        !path.endsWith("index.ts"),
    );
    const forbidden = [
      /@\/integrations\/supabase/,
      /@\/lib\/auth/,
      /@tanstack\/react-router/,
      /\b(fetch|axios)\s*\(/,
      /import\.meta\.env/,
      /process\.env/,
      /service_role/i,
    ];
    for (const file of presentationFiles) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(source, `${relative(projectRoot, file)} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("confines concrete auth and router imports to the narrow runtime adapter and route files", () => {
    const adapter = readFileSync(join(integrationRoot, "V2ShellRuntimeRoute.tsx"), "utf8");
    expect(adapter).toContain('from "@/lib/auth"');
    expect(adapter).toContain('from "@tanstack/react-router"');
    expect(adapter).not.toMatch(/const\s*\{[^}]*\bsession\b[^}]*\}\s*=\s*useAuth/);
    expect(adapter).not.toMatch(/\bsession\s*=\s*\{/);
    expect(adapter).not.toContain("supabase");
    expect(adapter).not.toContain("VITE_");
  });

  it("creates real child routes without intercepting the legacy router", () => {
    const parent = readFileSync(join(projectRoot, "src", "routes", "v2.tsx"), "utf8");
    const index = readFileSync(join(projectRoot, "src", "routes", "v2.index.tsx"), "utf8");
    const child = readFileSync(join(projectRoot, "src", "routes", "v2.$section.tsx"), "utf8");
    expect(parent).toContain('createFileRoute("/v2")');
    expect(index).toContain('createFileRoute("/v2/")');
    expect(index).toContain('section: "inicio"');
    expect(child).toContain('createFileRoute("/v2/$section")');
    expect(child).not.toMatch(/\b(fetch|supabase)\b/i);
  });

  it("gates /v2 at the root while preserving the canonical auth boundary", () => {
    const root = readFileSync(join(projectRoot, "src", "routes", "__root.tsx"), "utf8");
    expect(root).toContain("isV2RuntimePath(location.pathname)");
    expect(root).toContain("!v2FeatureFlags.appShell");
    expect(root).toContain('<Navigate to="/inicio" replace />');
    expect(root).toContain("<RouteProtectionBoundary");
    expect(root).toMatch(/isV2Route\s*\?\s*<Outlet\s*\/>/);
    expect(root).not.toContain("VITE_FF_V2_APP_SHELL");
  });

  it("keeps integration styles scoped and dependencies unchanged", () => {
    const css = readFileSync(join(integrationRoot, "styles.css"), "utf8");
    const selectors = css
      .split("{")
      .slice(0, -1)
      .map((part) => part.slice(part.lastIndexOf("}") + 1).trim())
      .filter((part) => part && !part.startsWith("@"));
    expect(selectors.length).toBeGreaterThan(10);
    for (const selectorGroup of selectors) {
      for (const selector of selectorGroup.split(",")) {
        expect(selector.trim()).toMatch(/^\.vdn-v2\[data-vdn-v2\](?:\.|\s)/);
      }
    }
    expect(css).not.toMatch(/(^|\s)(:root|html|body)(?=[\s,{])/);

    const changedDependencyFiles = ["package.json", "bun.lock"].filter((file) => {
      const source = readFileSync(join(projectRoot, file), "utf8");
      return source.includes("v2-005-shell-integration");
    });
    expect(changedDependencyFiles).toEqual([]);
  });
});
