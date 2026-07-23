import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccountOperationError, V2AccountSettings } from "../src/v2/features/account";
import { V2ThemeScope } from "../src/v2/design-system";

const lifecycle = {
  status: "active" as const,
  deactivatedAt: null,
  deletionRequestedAt: null,
  deletionScheduledFor: null,
};

function render(overrides: Partial<React.ComponentProps<typeof V2AccountSettings>> = {}) {
  return renderToStaticMarkup(
    <V2ThemeScope>
      <V2AccountSettings
        lifecycle={lifecycle}
        isLoading={false}
        isFetching={false}
        isEmpty={false}
        isOnline
        queryError={null}
        mutationError={null}
        pendingCommand={null}
        successMessage=""
        theme="light"
        onThemeChange={vi.fn()}
        onNavigate={vi.fn()}
        onRetry={vi.fn()}
        onExecute={vi.fn()}
        logoutLoading={false}
        onLogout={vi.fn()}
        {...overrides}
      />
    </V2ThemeScope>,
  );
}

describe("V2 account presentation", () => {
  it("renders real destinations, appearance and lifecycle controls", () => {
    const html = render();
    expect(html).toContain("Perfil e dados pessoais");
    expect(html).toContain("Pessoas bloqueadas");
    expect(html).toContain("Tema do aplicativo");
    expect(html).toContain("Desativar conta");
    expect(html).toContain("Solicitar exclusão");
    expect(html).not.toContain("email");
    expect(html).not.toContain("access_token");
  });

  it("renders loading without private content", () => {
    const html = render({ isLoading: true, lifecycle: null });
    expect(html).toContain("Carregando configurações da conta");
    expect(html).not.toContain("Solicitar exclusão");
  });

  it("renders empty, recoverable error, offline and permission states", () => {
    expect(render({ lifecycle: null, isEmpty: true })).toContain("Conta ainda não disponível");
    expect(
      render({
        lifecycle: null,
        queryError: new AccountOperationError("network", "Sem conexão.", true),
      }),
    ).toContain("Tentar novamente");
    expect(render({ isOnline: false })).toContain("Você está offline");
    expect(
      render({
        lifecycle: null,
        isOnline: false,
        queryError: new AccountOperationError("network", "Você está offline.", true),
      }),
    ).not.toContain("Tentar novamente");
    expect(
      render({
        lifecycle: null,
        queryError: new AccountOperationError("forbidden", "Sem permissão.", false),
      }),
    ).not.toContain("Tentar novamente");
  });

  it("announces saving errors and success without technical detail", () => {
    const html = render({
      successMessage: "Conta reativada com segurança.",
      mutationError: new AccountOperationError(
        "unexpected",
        "Não foi possível concluir a ação agora.",
        true,
      ),
    });
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Conta reativada com segurança.");
    expect(html).toContain('role="alert"');
  });

  it("renders the pending deletion cancellation path", () => {
    const html = render({
      lifecycle: {
        status: "deletion-pending",
        deactivatedAt: "2026-07-23T18:00:00.000Z",
        deletionRequestedAt: "2026-07-23T18:00:00.000Z",
        deletionScheduledFor: "2026-08-22T18:00:00.000Z",
      },
    });
    expect(html).toContain("Exclusão agendada");
    expect(html).toContain("Cancelar exclusão");
    expect(html).not.toContain("Solicitar exclusão");
  });
});
