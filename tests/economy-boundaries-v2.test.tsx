import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import type { EconomyRepository } from "../src/v2/features/economy/contracts";
import { V2EconomyFeature } from "../src/v2/features/economy/V2EconomyFeature";

const root = process.cwd();
const featureRoot = join(root, "src", "v2", "features", "economy");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const candidate = join(directory, entry);
    return statSync(candidate).isDirectory() ? walk(candidate) : [candidate];
  });
}

const repository: EconomyRepository = {
  async loadHub() {
    return {
      balance: 0,
      xpTotal: 0,
      level: 1,
      catalog: [],
      inventory: [],
      ledger: [],
      receipts: [],
      reconciliation: {
        status: "baseline-unverified",
        latestLedgerBalance: null,
        balanceDelta: null,
        invalidEquippedCount: 0,
      },
      preservedFamilies: {
        badges: 0,
        giftsReceived: 0,
        avatarLegacyItems: 0,
        petBackgrounds: 0,
        petAlbumStickers: 0,
      },
      riskGates: [],
    };
  },
  async purchase() {
    throw new Error("not_called");
  },
  async setEquipped() {
    throw new Error("not_called");
  },
};

describe("V2-016 economy presentation boundaries", () => {
  it("is SSR-safe and mounts no private projection before loading completes", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <V2ThemeScope>
          <V2EconomyFeature userId="user-a" repository={repository} />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando loja e inventário");
    expect(html).not.toContain("Últimas movimentações");
  });

  it("confines the concrete Supabase client to the repository adapter", () => {
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

  it("keeps every feature selector inside the V2 theme boundary", () => {
    const css = readFileSync(join(featureRoot, "styles.css"), "utf8");
    const selectors = css
      .split("{")
      .slice(0, -1)
      .map((part) => part.slice(part.lastIndexOf("}") + 1).trim())
      .filter((part) => part && !part.startsWith("@"));
    expect(selectors.length).toBeGreaterThan(20);
    for (const group of selectors) {
      for (const selector of group.split(",")) {
        expect(selector.trim()).toMatch(/^\.vdn-v2\[data-vdn-v2\](?:\.|\s)/);
      }
    }
    expect(css).not.toMatch(/(^|\s)(:root|html|body)(?=[\s,{])/);
  });

  it("does not simulate persistence, trust a client price or use browser confirmation APIs", () => {
    const presentation = readFileSync(join(featureRoot, "V2EconomyHub.tsx"), "utf8");
    expect(presentation).not.toMatch(/localStorage|sessionStorage/);
    expect(presentation).not.toMatch(/\b(alert|confirm)\s*\(/);
    expect(presentation).not.toMatch(/purchase\([^)]*price/);
    expect(presentation).toContain("Prévia sem alterar equipamento");
  });

  it("documents the authority boundaries as executable constants", async () => {
    const { economyRepositoryBoundaries } = await import("../src/v2/features/economy/repository");
    expect(economyRepositoryBoundaries).toEqual({
      serverOwnsPriceAndBalanceMutation: true,
      commandsRequireIdempotency: true,
      presentationReceivesSession: false,
      catalogsRemainSeparate: true,
      chanceBasedBoxesDefaultEnabled: false,
    });
  });
});
