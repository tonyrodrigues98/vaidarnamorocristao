import { useState } from "react";
import { CircleUserRound, Home, MessageCircle, Settings, UsersRound } from "lucide-react";
import { V2AppShell, type V2ShellNavigationItem } from "@/v2/app-shell";
import { V2Text, type V2ThemeName } from "@/v2/design-system";
import { V2AccountSettings, type AccountNavigationTarget } from "../presentation/V2AccountSettings";
import type { AccountCommand } from "../domain/account";

const navigation = [
  { id: "home", label: "Início", href: "/v2/inicio", icon: Home },
  { id: "community", label: "Comunidade", href: "/v2/comunidade", icon: UsersRound },
  { id: "conversations", label: "Conversas", href: "/v2/conversas", icon: MessageCircle },
  { id: "profile", label: "Perfil", href: "/v2/perfil", icon: CircleUserRound },
] satisfies readonly V2ShellNavigationItem[];

const secondaryNavigation = [
  {
    id: "settings",
    label: "Configurações",
    href: "/v2/configuracoes",
    icon: Settings,
  },
] satisfies readonly V2ShellNavigationItem[];

export function V2AccountShowcase() {
  const [theme, setTheme] = useState<V2ThemeName>("light");
  const [announcement, setAnnouncement] = useState(
    "Showcase isolado: nenhum backend ou dado real foi carregado.",
  );

  const explain = (label: string) => {
    setAnnouncement(`${label}: navegação demonstrativa, sem envio de dados.`);
  };

  return (
    <V2AppShell
      page={{
        title: "Configurações",
        subtitle: "Controle sua experiência, privacidade e estado da conta.",
        eyebrow: "Conta V2",
      }}
      activeNavigationId="settings"
      navigation={navigation}
      secondaryNavigation={secondaryNavigation}
      user={{
        displayName: "Pessoa da comunidade",
        supportingText: "Showcase local",
        initials: "PC",
        status: "online",
      }}
      theme={theme}
      onThemeChange={setTheme}
      onNavigate={(item) => explain(item.label)}
      onSearch={() => explain("Busca")}
      onCreateAction={(action) => explain(action.label)}
      onLogout={() => explain("Sair da conta")}
    >
      <V2Text role="status" aria-live="polite">
        {announcement}
      </V2Text>
      <V2AccountSettings
        lifecycle={{
          status: "active",
          deactivatedAt: null,
          deletionRequestedAt: null,
          deletionScheduledFor: null,
        }}
        isLoading={false}
        isFetching={false}
        isEmpty={false}
        isOnline
        queryError={null}
        mutationError={null}
        pendingCommand={null}
        successMessage=""
        theme={theme}
        onThemeChange={setTheme}
        onNavigate={(target: AccountNavigationTarget) => explain(target)}
        onRetry={() => explain("Atualizar conta")}
        onExecute={(command: AccountCommand) => explain(command.type)}
        logoutLoading={false}
        onLogout={() => explain("Sair da conta")}
      />
    </V2AppShell>
  );
}
