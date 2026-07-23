import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const featureRoot = join(projectRoot, "src", "v2", "features", "account");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("V2 account architecture boundaries", () => {
  it("keeps Supabase isolated in the concrete adapter", () => {
    const files = walk(featureRoot).filter((file) => /\.(ts|tsx)$/.test(file));
    const supabaseImporters = files
      .filter((file) => /integrations\/supabase/.test(readFileSync(file, "utf8")))
      .map((file) => relative(projectRoot, file).replaceAll("\\", "/"));

    expect(supabaseImporters).toEqual([
      "src/v2/features/account/data/supabase-account-repository.ts",
    ]);
  });

  it("keeps presentation free from auth, router, environment and backend imports", () => {
    const presentation = readFileSync(
      join(featureRoot, "presentation", "V2AccountSettings.tsx"),
      "utf8",
    );
    expect(presentation).not.toMatch(/@\/lib\/auth|@tanstack\/react-router/);
    expect(presentation).not.toMatch(/supabase|import\.meta\.env|process\.env/i);
  });

  it("keeps the account route on the existing V2 flag and canonical auth boundary", () => {
    const root = readFileSync(join(projectRoot, "src", "routes", "__root.tsx"), "utf8");
    const runtime = readFileSync(
      join(projectRoot, "src", "v2", "integration", "V2ShellRuntimeRoute.tsx"),
      "utf8",
    );
    expect(root).toContain("v2FeatureFlags.appShell");
    expect(root).toContain("<RouteProtectionBoundary");
    expect(runtime).toContain('route?.slug === "configuracoes"');
    expect(runtime).toContain("<V2AccountRuntimeFeature");
    expect(runtime).not.toContain("getSession");
  });

  it("preserves the legacy account route and four real RPC contracts", () => {
    expect(readFileSync(join(projectRoot, "src", "routes", "conta.tsx"), "utf8")).toContain(
      'createFileRoute("/conta")',
    );
    const adapter = readFileSync(
      join(featureRoot, "data", "supabase-account-repository.ts"),
      "utf8",
    );
    for (const rpc of [
      "request_account_deactivation",
      "request_account_reactivation",
      "request_account_deletion",
      "cancel_account_deletion",
    ]) {
      expect(adapter).toContain(rpc);
    }
  });

  it("keeps feature styles scoped to the V2 theme boundary", () => {
    const css = readFileSync(join(featureRoot, "styles.css"), "utf8");
    const selectors = css
      .split("{")
      .slice(0, -1)
      .map((part) => part.slice(part.lastIndexOf("}") + 1).trim())
      .filter((selector) => selector && !selector.startsWith("@"));
    for (const selector of selectors) {
      for (const group of selector.split(",")) {
        expect(group.trim(), group).toMatch(/^\.vdn-v2\[data-vdn-v2\]/);
      }
    }
    expect(css).not.toMatch(/(^|[,{]\s*)(:root|html|body)(?=[\s,{])/m);
  });

  it("keeps the visual showcase isolated from runtime and backend adapters", () => {
    const showcaseRoot = join(featureRoot, "showcase");
    const source = walk(showcaseRoot)
      .filter((file) => /\.(ts|tsx|css|html)$/.test(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(source).toContain("<V2AppShell");
    expect(source).toContain("<V2AccountSettings");
    expect(source).not.toMatch(
      /integrations\/supabase|supabase-account-repository|@\/lib\/auth|import\.meta\.env|process\.env/i,
    );
  });
});
