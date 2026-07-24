import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import type { PetPlatformRepository } from "../src/v2/features/pets/contracts";
import { V2PetsFeature } from "../src/v2/features/pets/V2PetsFeature";

const root = process.cwd();
const featureRoot = join(root, "src", "v2", "features", "pets");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const candidate = join(directory, entry);
    return statSync(candidate).isDirectory() ? walk(candidate) : [candidate];
  });
}

const repository: PetPlatformRepository = {
  async loadHub() {
    return {
      serverNow: "2026-07-23T12:00:00Z",
      pet: null,
      careConfig: { decayPerHour: 2, energyRegenMinutesPerPoint: 6 },
      careState: [],
      careItems: [],
      careHistory: [],
      preservedFamilies: {
        userPetsCount: 0,
        userPetsEquippedCount: 0,
        userPetsV2Count: 0,
        userPetsV2EquippedCount: 0,
      },
    };
  },
  async applyCare() {
    throw new Error("not_called");
  },
  async loadArcade() {
    throw new Error("not_called");
  },
};

describe("V2-017 pet presentation boundaries", () => {
  it("is SSR-safe and mounts no private projection or arcade query while loading", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <V2ThemeScope>
          <V2PetsFeature userId="user-a" repository={repository} />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Sincronizando seu pet");
    expect(html).not.toContain("Arcade preservado");
  });

  it("loads the arcade component lazily and only from the explicit tab", () => {
    const hub = readFileSync(join(featureRoot, "V2PetsHub.tsx"), "utf8");
    expect(hub).toContain('lazy(() => import("./V2ArcadeCatalog"))');
    expect(hub).toContain('tab === "arcade"');
    expect(hub).not.toContain("get_pet_arcade_catalog");
  });

  it("confines Supabase to one adapter and excludes auth, router and environment from presentation", () => {
    for (const file of walk(featureRoot).filter((item) => /\.(ts|tsx)$/.test(item))) {
      const source = readFileSync(file, "utf8");
      if (file.endsWith("repository.ts")) {
        expect(source).toContain("@/integrations/supabase/client");
      } else {
        expect(source, relative(root, file)).not.toContain("@/integrations/supabase");
      }
      expect(source, relative(root, file)).not.toContain("@/lib/auth");
      expect(source, relative(root, file)).not.toContain("@tanstack/react-router");
      expect(source, relative(root, file)).not.toMatch(/import\.meta\.env|process\.env/);
      expect(source, relative(root, file)).not.toMatch(/\b(access_token|refresh_token)\b/);
    }
  });

  it("keeps every feature selector inside the V2 scope", () => {
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

  it("does not simulate persistence or calculate rewards in presentation", () => {
    const presentation = [
      readFileSync(join(featureRoot, "V2PetsHub.tsx"), "utf8"),
      readFileSync(join(featureRoot, "V2ArcadeCatalog.tsx"), "utf8"),
    ].join("\n");
    expect(presentation).not.toMatch(/localStorage|sessionStorage/);
    expect(presentation).not.toMatch(/\b(alert|confirm)\s*\(/);
    expect(presentation).not.toMatch(/Math\.random|new_balance|reward_coins/);
    expect(presentation).toMatch(/Nenhuma consolidação\s+ou exclusão automática/);
  });

  it("documents executable repository boundaries", async () => {
    const { petRepositoryBoundaries } = await import("../src/v2/features/pets/repository");
    expect(petRepositoryBoundaries).toEqual({
      serverOwnsTimeAndDecay: true,
      serverOwnsRewardsAndCosts: true,
      commandsRequireIdempotency: true,
      legacyAndV2PetTablesRemainSeparate: true,
      arcadeLoadsOnlyWhenRequested: true,
      presentationReceivesSession: false,
    });
  });
});
