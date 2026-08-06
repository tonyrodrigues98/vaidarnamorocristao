import { useMemo, useState } from "react";
import { V2AppShell, type V2CreateAction, type V2ShellNavigationItem } from "@/v2/app-shell";
import { V2Heading, V2Surface, V2Text, type V2ThemeName } from "@/v2/design-system";
import type { V2ShellUser } from "@/v2/app-shell";
import {
  V2_RUNTIME_PRIMARY_NAVIGATION,
  V2_RUNTIME_SECONDARY_NAVIGATION,
  type V2RuntimeRouteDescriptor,
} from "./route-registry";
import { V2RuntimePage } from "./V2RuntimePage";

export interface V2RuntimeShellProps {
  readonly route: V2RuntimeRouteDescriptor | null;
  readonly user: V2ShellUser;
  readonly theme: V2ThemeName;
  readonly logoutLoading?: boolean;
  readonly statusMessage?: string;
  readonly onNavigate: (item: V2ShellNavigationItem) => void;
  readonly onNavigateHome: () => void;
  readonly onBack: () => void;
  readonly onThemeChange: (theme: V2ThemeName) => void;
  readonly onLogout: () => void | Promise<void>;
}

export function V2RuntimeShell({
  route,
  user,
  theme,
  logoutLoading,
  statusMessage,
  onNavigate,
  onNavigateHome,
  onBack,
  onThemeChange,
  onLogout,
}: V2RuntimeShellProps) {
  const [announcement, setAnnouncement] = useState("");
  const unavailable = (label: string) => {
    setAnnouncement(`${label} estará disponível em breve. Nenhum dado foi enviado.`);
  };
  const page = useMemo(
    () => ({
      title: route?.title ?? "Área não encontrada",
      subtitle:
        route?.subtitle ??
        "Este endereço não corresponde a uma área disponível da Community Platform V2.",
      eyebrow: route?.eyebrow ?? "Community Platform V2",
      width: route?.width ?? ("standard" as const),
      onBack: route?.slug === "inicio" ? undefined : onBack,
      breadcrumbs: route
        ? [{ label: "V2", href: "/v2/inicio", onSelect: onNavigateHome }, { label: route.label }]
        : [{ label: "V2", href: "/v2/inicio", onSelect: onNavigateHome }],
      contextRail: (
        <div className="vdn-v2-runtime-context">
          <V2Heading level={2} size="small">
            Integração segura
          </V2Heading>
          <V2Text tone="secondary">
            O shell recebe apenas nome, avatar seguro e ações explícitas. A sessão completa
            permanece fora da camada visual.
          </V2Text>
          <V2Text variant="caption" tone="muted">
            Preview protegido por feature flag
          </V2Text>
        </div>
      ),
    }),
    [onBack, onNavigateHome, route],
  );

  return (
    <V2AppShell
      page={page}
      activeNavigationId={route?.navigationId ?? null}
      navigation={V2_RUNTIME_PRIMARY_NAVIGATION}
      secondaryNavigation={V2_RUNTIME_SECONDARY_NAVIGATION}
      user={user}
      theme={theme}
      logoutLoading={logoutLoading}
      onNavigate={onNavigate}
      onThemeChange={onThemeChange}
      onLogout={onLogout}
      onSearch={() => unavailable("A busca")}
      onCreateAction={(action: V2CreateAction) => unavailable(action.label)}
    >
      <div className="vdn-v2-runtime-announcement" role="status" aria-live="polite">
        {statusMessage || announcement}
      </div>
      {route ? (
        <V2RuntimePage route={route} />
      ) : (
        <V2Surface className="vdn-v2-runtime-not-found" elevation="one">
          <V2Heading level={2} size="medium">
            Esta área da V2 não existe
          </V2Heading>
          <V2Text tone="secondary">
            Use a navegação para voltar a uma área disponível. Nenhuma rota legada foi afetada.
          </V2Text>
        </V2Surface>
      )}
    </V2AppShell>
  );
}
