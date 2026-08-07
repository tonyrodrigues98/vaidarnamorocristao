import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NativeRootPlaceholder } from "../src/components/native-shell/NativeRootPlaceholder";
import { createPrivatePageMetadata } from "../src/lib/metadata";
import { ThemeProvider } from "../src/lib/theme";

const communitySource = readFileSync("src/routes/comunidade.tsx", "utf8");
const communityTabsSource = readFileSync("src/config/native-community-tabs.ts", "utf8");
const exploreSource = readFileSync("src/routes/explorar.tsx", "utf8");
const exploreRegistrySource = readFileSync("src/config/native-explore-registry.ts", "utf8");

describe("NativeRootPlaceholder", () => {
  it("renders accessible structural content without empty regions or fabricated data", () => {
    const markup = renderToStaticMarkup(
      <ThemeProvider>
        <NativeRootPlaceholder
          eyebrow="Estrutura em integração"
          title="Comunidade"
          description="Agora · Espaços · Eventos"
          sections={[
            { id: "agora", label: "Agora", description: "Conversas da comunidade." },
            { id: "espacos", label: "Espaços", description: "Grupos temáticos." },
            { id: "eventos", label: "Eventos", description: "Encontros online." },
          ]}
        />
      </ThemeProvider>,
    );

    expect(markup).toContain("<main");
    expect(markup).toContain("<h1");
    expect(markup.match(/<section/g)).toHaveLength(3);
    expect(markup).toContain("aria-describedby");
    expect(markup).toContain('aria-label="Áreas de Comunidade"');
    expect(markup).toContain("Estrutura em integração");
    expect(markup).toContain('data-theme="light"');
    expect(markup).toContain("--vdn-native-canvas:");
    expect(markup).not.toMatch(/perfil fictício|usuários online|\d+ membros|em breve/i);
    expect(markup).not.toContain("vdn-native-root__actions");
  });
});

describe("/comunidade safe root", () => {
  it("keeps the legacy replace redirect when the feature is not exposed", () => {
    expect(communitySource).toContain("nativeRootExposed");
    expect(communitySource).toContain("prototypeRootExposed");
    expect(communitySource).toContain("nativeShellFeatureEnabled");
    expect(communitySource).toContain("prototype01FeatureEnabled");
    expect(communitySource).toContain('<Navigate to="/conversas/comunidade" replace />');
  });

  it("uses the real approval gate and the three useful sections when exposed", () => {
    expect(communitySource).toContain("<RequireApproved>");
    expect(communitySource).toContain(">Comunidade</h1>");
    expect(communityTabsSource).toContain('label: "Agora"');
    expect(communityTabsSource).toContain('label: "Espaços"');
    expect(communityTabsSource).toContain('label: "Eventos"');
    expect(communitySource).toContain('to="/conversas/comunidade"');
    expect(communitySource).toContain('title="Chat geral"');
    expect(communitySource).not.toContain("NativeRootPlaceholder");
  });

  it("has private metadata and no backend dependency", () => {
    const metadata = createPrivatePageMetadata({
      title: "Comunidade",
      description: "Teste",
      path: "/comunidade",
    });

    expect(metadata.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
    expect(communitySource).toContain("createPrivatePageMetadata");
    expect(communitySource).not.toMatch(/supabase|fetch\(/i);
  });
});

describe("/explorar safe root", () => {
  it("uses a replace fallback to home and the real approval gate when exposed", () => {
    expect(exploreSource).toContain("nativeRootExposed");
    expect(exploreSource).toContain("prototypeRootExposed");
    expect(exploreSource).toContain("nativeShellFeatureEnabled");
    expect(exploreSource).toContain("prototype01FeatureEnabled");
    expect(exploreSource).toContain('<Navigate to="/inicio" replace />');
    expect(exploreSource).toContain("<RequireApproved>");
  });

  it("contains three functional sections and only established V1 links", () => {
    expect(exploreSource).toContain(">Explorar</h1>");
    expect(exploreSource).toContain('title="Continuar"');
    expect(exploreSource).toContain('title="Experiências"');
    expect(exploreSource).toContain('title="Descobertas"');

    const links = [...exploreRegistrySource.matchAll(/path: "([^"]+)"/g)].map((match) => match[1]);
    expect(links).toEqual([
      "/devocional",
      "/meu-pet",
      "/pet-arcade",
      "/quiz-biblico",
      "/loja",
      "/avatar",
      "/caixas",
      "/conquistas",
      "/noticias",
      "/oracoes",
      "/pretendentes",
      "/",
    ]);
    expect(links).not.toContain("/cinema");
    expect(links).not.toContain("/verbo");
    expect(links).not.toContain("/pessoas");
  });

  it("has private metadata and no backend dependency", () => {
    const metadata = createPrivatePageMetadata({
      title: "Explorar",
      description: "Teste",
      path: "/explorar",
    });

    expect(metadata.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
    expect(exploreSource).toContain("createPrivatePageMetadata");
    expect(exploreSource).not.toMatch(/supabase|fetch\(/i);
  });
});

describe("generated route coverage", () => {
  it("contains the generated /explorar route and 66 total full paths", () => {
    const routeTree = readFileSync("src/routeTree.gen.ts", "utf8");
    const fullPaths = [...routeTree.matchAll(/fullPath:\s*'([^']+)'/g)].map((match) => match[1]);

    expect(fullPaths).toContain("/explorar");
    expect(fullPaths).toHaveLength(66);
  });
});
