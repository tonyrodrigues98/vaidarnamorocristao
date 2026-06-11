import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { AccountDangerZone } from "@/components/AccountDangerZone";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Switch } from "@/components/ui/switch";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import {
  ChevronRight,
  User as UserIcon,
  BadgeCheck,
  Bell,
  ShieldCheck,
  HelpCircle,
  FileText,
  BookOpen,
  UserX,
  LogOut,
  AlertTriangle,
  Moon,
  LayoutDashboard,
} from "lucide-react";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Conta — VaiDarNamoro" },
      {
        name: "description",
        content:
          "Ajustes da sua conta: perfil, segurança, notificações, privacidade, suporte e exclusão.",
      },
    ],
  }),
  component: ContaPage,
});

type LucideIcon = typeof UserIcon;

type ItemBase = {
  icon: LucideIcon;
  title: string;
  description?: string;
  rightContent?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
};

type SettingsItemProps =
  | (ItemBase & { to: string; onClick?: never })
  | (ItemBase & { onClick: () => void; to?: never })
  | (ItemBase & { to?: undefined; onClick?: undefined });

function SettingsGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      {title ? (
        <h2 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-sm divide-y divide-border/60">
        {children}
      </div>
    </section>
  );
}

function SettingsItem(props: SettingsItemProps) {
  const {
    icon: Icon,
    title,
    description,
    rightContent,
    danger,
    disabled,
    showChevron = true,
  } = props;

  const iconTone = danger
    ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"
    : "bg-[var(--petal)]/60 text-[var(--rose)]";
  const titleTone = danger
    ? "text-red-700 dark:text-red-300"
    : "text-foreground";

  const inner = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconTone}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={`block text-[15px] font-medium leading-tight ${titleTone}`}>
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {rightContent ? (
        <span className="shrink-0 text-xs text-muted-foreground">{rightContent}</span>
      ) : null}
      {showChevron && (props.to || props.onClick) ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : null}
    </>
  );

  const baseClass =
    "app-pressable flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60";

  if (props.to) {
    return (
      <Link to={props.to} className={baseClass}>
        {inner}
      </Link>
    );
  }
  if (props.onClick) {
    return (
      <button type="button" onClick={props.onClick} disabled={disabled} className={baseClass}>
        {inner}
      </button>
    );
  }
  return <div className={baseClass}>{inner}</div>;
}

function ContaPage() {
  const { user, signOut, role } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { isOnline } = useNetworkStatus();
  const isStaff = role !== "user";
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Sessão encerrada.");
    } catch {
      toast.error("Não foi possível sair agora.");
    } finally {
      setSigningOut(false);
    }
  };

  const metadata = (user?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    display_name?: string;
    avatar_url?: string;
    picture?: string;
  };
  const displayName =
    metadata.full_name || metadata.display_name || metadata.name || user?.email?.split("@")[0];
  const avatar = metadata.avatar_url || metadata.picture;
  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--app-bg,theme(colors.background))]">
      <Header />
      <MobileAppHeader title="Conta" subtitle="Segurança e preferências" />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
        {!isOnline && (
          <StaleDataNotice
            className="mb-4"
            message="Você está offline. Algumas ações de conta ficam disponíveis somente online."
          />
        )}
        {/* Mini profile card */}
        {user ? (
          <Link
            to="/perfil"
            className="app-card-interactive mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-sm"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--petal)]/60 text-base font-semibold text-[var(--rose)]">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">
                {displayName ?? "Sua conta"}
              </span>
              {user.email ? (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              ) : null}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ) : null}

        <div className="space-y-6">
          {isStaff && (
            <SettingsGroup title="Equipe">
              <SettingsItem
                icon={LayoutDashboard}
                title="Painel administrativo"
                description="Acesse o painel de gestão"
                to="/admin"
              />
            </SettingsGroup>
          )}

          <SettingsGroup title="Perfil e segurança">
            <SettingsItem
              icon={UserIcon}
              title="Perfil e dados pessoais"
              description="Edite suas informações públicas"
              to="/perfil"
            />
            <SettingsItem
              icon={BadgeCheck}
              title="Verificação de perfil"
              description="Aumente sua credibilidade na comunidade"
              to="/verificacao"
            />
            <SettingsItem
              icon={UserX}
              title="Pessoas bloqueadas"
              description="Gerencie quem você bloqueou"
              to="/bloqueados"
            />
          </SettingsGroup>

          <SettingsGroup title="Preferências">
            <SettingsItem
              icon={Bell}
              title="Notificações"
              description="Veja e gerencie suas novidades"
              to="/notificacoes"
            />
            <SettingsItem
              icon={Moon}
              title="Tema do app"
              description={theme === "dark" ? "Modo escuro ativado" : "Modo claro ativado"}
              showChevron={false}
              rightContent={
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  aria-label="Alternar tema claro e escuro"
                />
              }
            />
          </SettingsGroup>

          <SettingsGroup title="Suporte e documentos">
            <SettingsItem
              icon={HelpCircle}
              title="Ajuda e suporte"
              description="Fale com nossa equipe"
              to="/suporte"
            />
            <SettingsItem
              icon={BookOpen}
              title="Manual do app"
              description="Como usar o VaiDarNamoro"
              to="/manual"
            />
            <SettingsItem
              icon={FileText}
              title="Termos de uso"
              to="/termos"
            />
          </SettingsGroup>

          <SettingsGroup title="Sessão">
            <SettingsItem
              icon={LogOut}
              title={signingOut ? "Saindo..." : "Sair da conta"}
              description="Encerrar a sessão neste dispositivo"
              onClick={handleSignOut}
              disabled={signingOut}
              showChevron={false}
            />
          </SettingsGroup>

          {/* Danger zone — keeps real deactivate/delete logic */}
          <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-300">
              <AlertTriangle className="h-3.5 w-3.5" /> Zona de perigo
            </h2>
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-3 dark:border-red-400/40 dark:bg-red-950/30">
              <AccountDangerZone />
            </div>
          </section>

          {/* Optional: shield reassurance */}
          <p className="px-3 pb-6 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            Seus dados estão protegidos. VaiDarNamoro.
          </p>
        </div>
      </main>
    </div>
  );
}
