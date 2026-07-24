import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import type { RomanticContextRepository } from "../src/v2/features/romantic-context/contracts";
import { V2RomanticContextFeature } from "../src/v2/features/romantic-context/V2RomanticContextFeature";

const root = process.cwd();
const featureRoot = join(root, "src", "v2", "features", "romantic-context");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const candidate = join(directory, entry);
    return statSync(candidate).isDirectory() ? walk(candidate) : [candidate];
  });
}

const repository: RomanticContextRepository = {
  loadPurpose: async () => ({
    current: null,
    history: [],
    eligibleMatches: [],
    gifts: [],
    catalog: [],
    timeline: [],
    capsules: [],
    messageCount: 0,
    capsuleCount: 0,
  }),
  requestPurpose: async () => undefined,
  transitionPurpose: async () => undefined,
  sendPurposeGift: async () => "gift-1",
  loadAnonymousCenter: async () => ({
    accepting: false,
    notes: [],
    recipients: [],
    dailyUsed: 0,
    dailyFree: 3,
    extras: 0,
  }),
  setAnonymousOptIn: async () => undefined,
  sendAnonymousNote: async () => "note-1",
  actOnAnonymousNote: async () => undefined,
};

describe("V2-015 romantic presentation boundaries", () => {
  it("is SSR-safe and fails closed while purpose data is unresolved", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <V2ThemeScope>
          <V2RomanticContextFeature
            area="purpose"
            userId="user-a"
            repository={repository}
            onOpenConversations={() => undefined}
          />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando Propósito Firmado");
    expect(html).not.toContain("Fazer pedido");
  });

  it("is SSR-safe and fails closed while anonymous data is unresolved", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <V2ThemeScope>
          <V2RomanticContextFeature
            area="anonymous"
            userId="user-a"
            repository={repository}
            onOpenConversations={() => undefined}
          />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando recados anônimos");
    expect(html).not.toContain("Enviar recado");
  });

  it("confines Supabase to the repository adapter", () => {
    for (const file of walk(featureRoot).filter((item) => /\.(ts|tsx)$/.test(item))) {
      const source = readFileSync(file, "utf8");
      if (file.endsWith("repository.ts")) {
        expect(source).toContain("@/integrations/supabase/client");
      } else {
        expect(source, relative(root, file)).not.toContain("@/integrations/supabase");
      }
    }
  });

  it("keeps presentation independent from auth, router, environment and session objects", () => {
    for (const file of walk(featureRoot).filter((item) => /\.(ts|tsx)$/.test(item))) {
      const source = readFileSync(file, "utf8");
      expect(source, relative(root, file)).not.toContain("@/lib/auth");
      expect(source, relative(root, file)).not.toContain("@tanstack/react-router");
      expect(source, relative(root, file)).not.toMatch(/import\.meta\.env|process\.env/);
      expect(source, relative(root, file)).not.toMatch(/\b(access_token|refresh_token)\b/);
    }
  });

  it("keeps every public style selector inside the V2 theme boundary", () => {
    const css = readFileSync(join(featureRoot, "styles.css"), "utf8");
    const selectors = css
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

  it("does not simulate persistence or disclose identity in anonymous presentation", () => {
    const source = readFileSync(join(featureRoot, "V2AnonymousNotes.tsx"), "utf8");
    expect(source).toContain("nunca para moderação");
    expect(source).not.toMatch(/\b(alert|confirm)\s*\(/);
    expect(source).not.toMatch(/localStorage|sessionStorage/);
    expect(source).not.toMatch(/\bsender(Id|_id)\b/);
  });
});
