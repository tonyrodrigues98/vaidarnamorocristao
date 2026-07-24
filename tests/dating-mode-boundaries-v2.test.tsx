import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { DatingRepository } from "../src/v2/features/dating/contracts";
import { V2DatingMode } from "../src/v2/features/dating/V2DatingMode";

const root = process.cwd();
const featureRoot = join(root, "src", "v2", "features", "dating");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const repository: DatingRepository = {
  loadMembership: async () => ({ state: "inactive", receiveAnonymous: false }),
  loadDiscovery: async () => ({
    items: [],
    nextCursor: null,
    hasMore: false,
    eligibilityRule: "legacy-opposite-sex-v1",
  }),
  expressInterest: async () => ({ state: "sent", matchId: null }),
  pause: async () => ({ state: "paused", receiveAnonymous: false }),
  deactivate: async () => ({ state: "inactive", receiveAnonymous: false }),
  block: async () => undefined,
  report: async () => undefined,
};

describe("V2-014 dating presentation boundaries", () => {
  it("is SSR-safe and fails closed while membership is unresolved", () => {
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <V2DatingMode
          userId="user-a"
          repository={repository}
          onReviewPreferences={() => undefined}
          onMembershipExit={async () => undefined}
          onOpenConversations={() => undefined}
        />
      </QueryClientProvider>,
    );
    expect(markup).toContain("Carregando modo Namoro");
    expect(markup).not.toContain("Descoberta com propósito");
  });

  it("confines Supabase to the repository adapter", () => {
    for (const file of walk(featureRoot).filter((path) => /\.(ts|tsx)$/.test(path))) {
      const source = readFileSync(file, "utf8");
      if (file.endsWith("repository.ts")) {
        expect(source).toContain("@/integrations/supabase/client");
      } else {
        expect(source, relative(root, file)).not.toContain("@/integrations/supabase");
      }
    }
  });

  it("does not couple presentation to auth, router, environment or session objects", () => {
    for (const file of walk(featureRoot).filter((path) => /\.(ts|tsx)$/.test(path))) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(root, file)).not.toContain("@/lib/auth");
      expect(source, relative(root, file)).not.toContain("@tanstack/react-router");
      expect(source, relative(root, file)).not.toMatch(/import\.meta\.env|process\.env/);
      expect(source, relative(root, file)).not.toMatch(/\b(access_token|refresh_token)\b/);
    }
  });

  it("keeps every public style selector inside the V2 theme boundary", () => {
    const css = readFileSync(join(featureRoot, "styles.css"), "utf8");
    const withoutKeyframes = css.replace(/@keyframes[\s\S]*?}\s*}/g, "");
    const selectors = withoutKeyframes
      .split("{")
      .slice(0, -1)
      .map((part) => part.slice(part.lastIndexOf("}") + 1).trim())
      .filter((part) => part && !part.startsWith("@"));
    expect(selectors.length).toBeGreaterThan(10);
    for (const group of selectors) {
      for (const selector of group.split(",")) {
        expect(selector.trim()).toMatch(/^\.vdn-v2\[data-vdn-v2\](?:\.|\s)/);
      }
    }
    expect(css).not.toMatch(/(^|\s)(:root|html|body)(?=[\s,{])/);
  });

  it("keeps safety actions explicit and does not simulate persistence", () => {
    const source = readFileSync(join(featureRoot, "V2DatingMode.tsx"), "utf8");
    expect(source).toContain("Confirmar bloqueio");
    expect(source).toContain("Nenhuma sanção é aplicada pelo navegador");
    expect(source).not.toMatch(/\b(alert|confirm)\s*\(/);
    expect(source).not.toMatch(/localStorage|sessionStorage/);
  });
});
