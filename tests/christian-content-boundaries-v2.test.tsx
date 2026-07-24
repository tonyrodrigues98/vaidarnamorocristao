import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import type { ChristianContentRepository } from "../src/v2/features/content/contracts";
import { V2ChristianContentFeature } from "../src/v2/features/content/V2ChristianContentFeature";

const root = process.cwd();
const featureRoot = join(root, "src", "v2", "features", "content");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const candidate = join(directory, entry);
    return statSync(candidate).isDirectory() ? walk(candidate) : [candidate];
  });
}

const repository: ChristianContentRepository = {
  async loadHub() {
    return {
      devotionals: [],
      versions: [],
      notes: [],
      bookmarkPassageIds: [],
      gates: {
        licensedBibleAvailable: false,
        conversationalExploration: false,
        offlineDownload: false,
        socialProgress: false,
      },
    };
  },
  async loadChapter() {
    throw new Error("not_called");
  },
  async saveNote() {
    throw new Error("not_called");
  },
  async toggleBookmark() {
    throw new Error("not_called");
  },
};

describe("V2-018 Christian content boundaries", () => {
  it("is SSR-safe and does not mount private data before loading", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <V2ThemeScope>
          <V2ChristianContentFeature userId="user-a" repository={repository} />
        </V2ThemeScope>
      </QueryClientProvider>,
    );
    expect(html).toContain("Carregando conteúdo cristão");
    expect(html).not.toContain("Minha anotação");
  });

  it("loads the Bible reader lazily and not as a runtime root dependency", () => {
    const hub = readFileSync(join(featureRoot, "V2ChristianContentHub.tsx"), "utf8");
    expect(hub).toContain('lazy(() => import("./V2VerboReader"))');
    expect(hub).toContain('tab === "verbo"');
  });

  it("confines Supabase to the repository and keeps presentation independent", () => {
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

  it("keeps every CSS selector inside the V2 scope", () => {
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

  it("does not simulate persistence, rankings or implicit sharing", () => {
    const presentation = walk(featureRoot)
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(presentation).not.toMatch(/localStorage|sessionStorage/);
    expect(presentation).not.toMatch(/\b(alert|confirm|prompt)\s*\(/);
    expect(presentation).not.toMatch(/leaderboard|faith_rank|public_score/i);
    expect(presentation).toContain("Sem ranking espiritual");
    expect(presentation).toContain("Nada é compartilhado automaticamente");
  });

  it("publishes executable repository boundaries", async () => {
    const { christianContentRepositoryBoundaries } =
      await import("../src/v2/features/content/repository");
    expect(christianContentRepositoryBoundaries).toEqual({
      editorialAuthorityServerSide: true,
      licenseGateFailsClosed: true,
      privateNotebookOwnerOnly: true,
      presentationReceivesSession: false,
      externalBibleApiCanonical: false,
      aiConversationEnabled: false,
    });
  });
});
