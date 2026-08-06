import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  V2AppShell,
  V2BottomNavigation,
  V2CreateSheet,
  V2NavigationItem,
  V2NotificationsPopover,
  V2PageHeader,
  V2_PRIMARY_NAVIGATION,
  V2_SECONDARY_NAVIGATION,
} from "../src/v2/app-shell";
import { V2AppShellShowcase } from "../src/v2/app-shell/showcase/V2AppShellShowcase";

const user = {
  displayName: "Marina Oliveira",
  supportingText: "Participa desde 2024",
  initials: "MO",
  status: "online" as const,
};

describe("V2 App Shell components", () => {
  it("renders the public barrel SSR-safe with semantic landmarks", () => {
    const markup = renderToStaticMarkup(
      <V2AppShell
        page={{ title: "Início", subtitle: "Resumo da comunidade" }}
        activeNavigationId="home"
        navigation={V2_PRIMARY_NAVIGATION}
        secondaryNavigation={V2_SECONDARY_NAVIGATION}
        user={user}
      >
        <p>Conteúdo privado futuro</p>
      </V2AppShell>,
    );

    expect(markup).toContain('data-vdn-v2-shell=""');
    expect(markup).toContain('href="#vdn-v2-main-content"');
    expect(markup).toContain("<main");
    expect(markup).toContain('aria-label="Navegação principal"');
    expect(markup).toContain('aria-label="Navegação da plataforma"');
    expect(markup).toContain("Conteúdo privado futuro");
  });

  it("marks only the active navigation destination", () => {
    const active = renderToStaticMarkup(
      <V2NavigationItem
        item={V2_PRIMARY_NAVIGATION[1]}
        activeId="community"
        presentation="sidebar"
      />,
    );
    const inactive = renderToStaticMarkup(
      <V2NavigationItem item={V2_PRIMARY_NAVIGATION[0]} activeId="community" />,
    );

    expect(active).toContain('aria-current="page"');
    expect(active).toContain('data-vdn-v2-navigation-id="community"');
    expect(inactive).not.toContain("aria-current");
  });

  it("renders the five mobile actions and exposes create state", () => {
    const markup = renderToStaticMarkup(
      <V2BottomNavigation
        items={V2_PRIMARY_NAVIGATION}
        activeId="home"
        createOpen
        onCreateOpen={() => undefined}
      />,
    );

    expect(markup.match(/data-vdn-v2-navigation-id=/g)).toHaveLength(4);
    expect(markup).toContain('aria-label="Criar"');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('aria-controls="vdn-v2-create-sheet"');
  });

  it("keeps overlay semantics, close control and realistic create actions", () => {
    const markup = renderToStaticMarkup(
      <V2CreateSheet open returnFocusRef={createRef<HTMLElement>()} onClose={() => undefined} />,
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("Criar publicação");
    expect(markup).toContain("Compartilhar reflexão");
    expect(markup).toContain("Iniciar Sala de Cinema");
    expect(markup).toContain("nada será publicado");
  });

  it("renders an honest empty notification state", () => {
    const markup = renderToStaticMarkup(
      <V2NotificationsPopover
        open
        notifications={[]}
        returnFocusRef={createRef<HTMLElement>()}
        onClose={() => undefined}
      />,
    );

    expect(markup).toContain("Tudo em dia");
    expect(markup).toContain("Novas conversas, convites e eventos");
  });

  it("keeps heading semantics separate from optional breadcrumbs and actions", () => {
    const markup = renderToStaticMarkup(
      <V2PageHeader
        page={{
          title: "Comunidade",
          breadcrumbs: [{ label: "Início", href: "/inicio" }, { label: "Comunidade" }],
          primaryAction: { label: "Participar", onSelect: () => undefined },
        }}
      />,
    );

    expect(markup).toContain("<h1");
    expect(markup).toContain('aria-label="Navegação estrutural"');
    expect(markup).toContain("Participar");
  });

  it("renders both sidebar modes through a typed shell contract", () => {
    const compact = renderToStaticMarkup(
      <V2AppShell
        page={{ title: "Início" }}
        activeNavigationId="home"
        navigation={V2_PRIMARY_NAVIGATION}
        user={user}
        sidebarMode="compact"
      >
        Conteúdo
      </V2AppShell>,
    );
    const expanded = renderToStaticMarkup(
      <V2AppShell
        page={{ title: "Início" }}
        activeNavigationId="home"
        navigation={V2_PRIMARY_NAVIGATION}
        user={user}
        sidebarMode="expanded"
      >
        Conteúdo
      </V2AppShell>,
    );

    expect(compact).toContain('data-sidebar-mode="compact"');
    expect(expanded).toContain('data-sidebar-mode="expanded"');
  });

  it("renders the showcase as a real consumer without pretending persistence", () => {
    const markup = renderToStaticMarkup(<V2AppShellShowcase />);

    expect(markup).toContain("Boa noite, Marina");
    expect(markup).toContain("Showcase local");
    expect(markup).toContain("nenhuma ação acessa backend");
    expect(markup).toContain('data-vdn-v2-theme="light"');
  });
});
