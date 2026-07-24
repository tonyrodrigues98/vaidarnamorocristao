import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { V2ThemeScope } from "../src/v2/design-system";
import { V2CommunityHome } from "../src/v2/features/home/V2CommunityHome";
import { V2PeopleDiscovery } from "../src/v2/features/home/V2PeopleDiscovery";
import type { CommunityHomeRepository } from "../src/v2/features/home/contracts";

const presentationFiles = [
  "../src/v2/features/home/V2CommunityHome.tsx",
  "../src/v2/features/home/V2PeopleDiscovery.tsx",
  "../src/v2/features/home/contracts.ts",
  "../src/v2/features/home/styles.css",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));
const repositorySource = readFileSync(
  new URL("../src/v2/features/home/repository.ts", import.meta.url),
  "utf8",
);
const runtimeSource = readFileSync(
  new URL("../src/v2/integration/V2ShellRuntimeRoute.tsx", import.meta.url),
  "utf8",
);
const membersSource = readFileSync(new URL("../src/routes/membros.tsx", import.meta.url), "utf8");

function repository(): CommunityHomeRepository {
  return {
    loadHome: vi.fn().mockResolvedValue({
      posts: [],
      statuses: [],
      daily: [],
      suggestions: [],
      relationshipSummary: { connections: 0, following: 0, pending: 0 },
      hasMorePosts: false,
      nextCursor: null,
    }),
    loadPeople: vi.fn().mockResolvedValue([]),
    publishPost: vi.fn().mockResolvedValue(undefined),
    toggleReaction: vi.fn().mockResolvedValue(true),
    publishStatus: vi.fn().mockResolvedValue(undefined),
    deleteStatus: vi.fn().mockResolvedValue(true),
    recordStatusView: vi.fn().mockResolvedValue(true),
    requestRelationship: vi.fn().mockResolvedValue("request_sent"),
  };
}

function render(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <V2ThemeScope>{ui}</V2ThemeScope>
    </QueryClientProvider>,
  );
}

describe("V2-010 home boundaries", () => {
  it("keeps Supabase and media moderation in the repository adapter only", () => {
    for (const source of presentationFiles) {
      expect(source).not.toContain("@/integrations/supabase");
      expect(source).not.toContain("@/lib/auth");
      expect(source).not.toContain("@tanstack/react-router");
    }
    expect(repositorySource).toContain("@/integrations/supabase/client");
    expect(repositorySource).toContain('verifyProfilePhoto(normalized, "extra")');
  });

  it("renders the home and discovery imports safely during SSR", () => {
    expect(
      render(<V2CommunityHome userId="user-a" datingEnabled={false} repository={repository()} />),
    ).toContain("Carregando a comunidade");
    expect(render(<V2PeopleDiscovery userId="user-a" repository={repository()} />)).toContain(
      "Buscando pessoas da comunidade",
    );
  });

  it("mounts real community data only behind the canonical community flag", () => {
    expect(runtimeSource).toMatch(/v2FeatureFlags\.community && route\?*\.slug ===/);
    expect(runtimeSource).toContain("<V2CommunityHomeFeature");
    expect(runtimeSource).toContain("<V2PeopleDiscoveryFeature");
  });

  it("resolves the historical /membros destination without using Pretendentes", () => {
    expect(membersSource).toContain('createFileRoute("/membros")');
    expect(membersSource).toContain('section: "explorar-pessoas"');
    expect(membersSource).not.toContain("/pretendentes");
  });

  it("scopes every public feature selector below the V2 theme boundary", () => {
    const css = presentationFiles.at(-1) ?? "";
    const selectors = css
      .split("{")
      .slice(0, -1)
      .map((chunk) => chunk.slice(chunk.lastIndexOf("}") + 1).trim())
      .filter((chunk) => chunk.startsWith("."));
    expect(selectors.length).toBeGreaterThan(20);
    expect(selectors.every((selector) => selector.startsWith(".vdn-v2[data-vdn-v2]"))).toBe(true);
    expect(css).not.toMatch(/(^|[},]\s*)(:root|html|body)(?=[\s,{])/m);
  });
});
