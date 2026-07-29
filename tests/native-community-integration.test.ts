import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  nativeCommunityTabs,
  normalizeNativeCommunityTab,
} from "../src/config/native-community-tabs";

const routeSource = readFileSync("src/routes/comunidade.tsx", "utf8");
const componentsSource = [
  "src/components/community/native/NativeCommunityTabs.tsx",
  "src/components/community/native/NativeCommunitySection.tsx",
  "src/components/community/native/NativeCommunityLinkCard.tsx",
]
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

describe("T46-12 native community integration", () => {
  it("preserves the legacy redirect and approved-user boundary", () => {
    expect(routeSource).toContain('<Navigate to="/conversas/comunidade" replace />');
    expect(routeSource).toContain("<RequireApproved>");
    expect(routeSource).toContain(
      'shouldExposeNativeRootDestination("/comunidade", nativeShellFeatureEnabled)',
    );
  });

  it("normalizes tab state without inventing a destination", () => {
    expect(nativeCommunityTabs.map((tab) => tab.id)).toEqual(["agora", "espacos", "eventos"]);
    expect(normalizeNativeCommunityTab(undefined)).toBe("agora");
    expect(normalizeNativeCommunityTab("invalid")).toBe("agora");
    expect(normalizeNativeCommunityTab("espacos")).toBe("espacos");
    expect(routeSource).toContain("validateSearch");
    expect(componentsSource).toContain("search={{ tab: tab.id }}");
  });

  it("uses only the approved real community links", () => {
    for (const path of ["/conversas/comunidade", "/oracoes", "/noticias", "/devocional", "/"]) {
      expect(routeSource).toContain(`to="${path}"`);
    }
    expect(routeSource).toContain('title="Chat geral"');
    expect(routeSource).toContain("conversa ao vivo");
    expect(routeSource).not.toMatch(/curtida|comentário|visualizaç|membros|post de usuário/i);
  });

  it("does not invent persistent spaces, physical events or Cinema", () => {
    expect(routeSource).toContain(
      "Novos espaços temáticos só serão exibidos quando tiverem contrato e dados reais.",
    );
    expect(routeSource).toContain("Nenhum evento online está agendado nos dados atuais.");
    expect(routeSource).not.toMatch(/cinema|endereço|ingresso|presença|mapa/i);
  });

  it("adds no backend, fetch, mocks, V2, or placeholder dependency", () => {
    expect(routeSource + componentsSource).not.toMatch(
      /supabase|\.from\(|\.rpc\(|\.channel\(|fetch\(|NativeRootPlaceholder|src\/v2|@\/v2|mock/i,
    );
  });

  it("keeps responsive, theme-safe and accessible presentation contracts", () => {
    expect(routeSource).toContain("max-w-[880px]");
    expect(componentsSource).toContain("bg-card");
    expect(routeSource).toContain("text-foreground");
    expect(componentsSource).toContain('aria-current={active ? "page" : undefined}');
    expect(componentsSource).toContain("min-h-11");
    expect(componentsSource).toContain('aria-label="Seções da comunidade"');
  });
});
