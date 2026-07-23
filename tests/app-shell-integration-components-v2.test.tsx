import { Bell } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { V2ProfileMenu } from "../src/v2/app-shell/V2ProfileMenu";
import { V2RuntimeShell } from "../src/v2/integration/V2RuntimeShell";
import { V2RuntimeState } from "../src/v2/integration/V2RuntimeState";
import { getV2RuntimeRoute } from "../src/v2/integration/route-registry";

const user = {
  displayName: "Pessoa da comunidade",
  supportingText: "Participante da comunidade",
  initials: "PC",
  status: "online" as const,
};

describe("V2 runtime integration components", () => {
  it("renders the integrated shell SSR-safe without exposing session-shaped data", () => {
    const markup = renderToStaticMarkup(
      <V2RuntimeShell
        route={getV2RuntimeRoute("comunidade")}
        user={user}
        theme="light"
        onNavigate={() => {}}
        onNavigateHome={() => {}}
        onBack={() => {}}
        onThemeChange={() => {}}
        onLogout={() => {}}
      />,
    );

    expect(markup).toContain("Comunidade");
    expect(markup).toContain("Em construção");
    expect(markup).toContain('href="/v2/inicio"');
    expect(markup).not.toMatch(/access_token|refresh_token|service_role/i);
  });

  it("renders a localized not-found state without selecting a navigation item", () => {
    const markup = renderToStaticMarkup(
      <V2RuntimeShell
        route={null}
        user={user}
        theme="dark"
        onNavigate={() => {}}
        onNavigateHome={() => {}}
        onBack={() => {}}
        onThemeChange={() => {}}
        onLogout={() => {}}
      />,
    );
    expect(markup).toContain("Esta área da V2 não existe");
    expect(markup).not.toContain('aria-current="page"');
  });

  it("keeps logout disabled in the showcase contract and enables a real callback", () => {
    const baseProps = {
      open: true,
      user,
      theme: "light" as const,
      returnFocusRef: { current: null },
      onClose: vi.fn(),
    };
    const showcase = renderToStaticMarkup(<V2ProfileMenu {...baseProps} />);
    const runtime = renderToStaticMarkup(
      <V2ProfileMenu {...baseProps} onLogout={vi.fn()} logoutLoading={false} />,
    );
    expect(showcase).toMatch(/<button[^>]*disabled[^>]*>.*Sair/s);
    expect(runtime).toMatch(/<button[^>]*>.*Sair/s);
  });

  it("renders session and runtime fallbacks without technical errors", () => {
    const loading = renderToStaticMarkup(<V2RuntimeState kind="loading" />);
    const error = renderToStaticMarkup(<V2RuntimeState kind="runtime-error" onRetry={() => {}} />);
    expect(loading).toContain("Restaurando sessão");
    expect(error).toContain("Não foi possível abrir esta área");
    expect(error).not.toContain("stack");
  });

  it("retains accessible icon contracts through the public shell components", () => {
    const icon = renderToStaticMarkup(<Bell aria-hidden="true" />);
    expect(icon).toContain('aria-hidden="true"');
  });
});
