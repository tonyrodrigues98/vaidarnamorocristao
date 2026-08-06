import type { ReactNode } from "react";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  UserX,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { StaleDataNotice } from "@/components/ui/StaleDataNotice";

import { NativeSettingsGroup } from "./NativeSettingsGroup";
import { NativeSettingsItem } from "./NativeSettingsItem";

export type NativeAccountViewProps = {
  displayName?: string;
  email?: string;
  avatar?: string;
  initial: string;
  isStaff: boolean;
  isOnline: boolean;
  signingOut: boolean;
  onSignOut(): void;
  themeControl: ReactNode;
  dangerZone: ReactNode;
};

export function NativeAccountView({
  displayName,
  email,
  avatar,
  initial,
  isStaff,
  isOnline,
  signingOut,
  onSignOut,
  themeControl,
  dangerZone,
}: NativeAccountViewProps) {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie sua conta, privacidade e preferências.
        </p>
      </header>

      {!isOnline ? (
        <StaleDataNotice message="Você está offline. Algumas ações de conta ficam disponíveis somente online." />
      ) : null}

      <Link
        to="/perfil"
        className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Abrir perfil"
      >
        <span className="grid aspect-square h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-muted font-semibold text-primary">
          {avatar ? (
            <img src={avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-foreground">
            {displayName ?? "Sua conta"}
          </span>
          {email ? (
            <span className="block truncate text-sm text-muted-foreground">{email}</span>
          ) : null}
        </span>
      </Link>

      {isStaff ? (
        <NativeSettingsGroup title="Equipe">
          <NativeSettingsItem
            icon={LayoutDashboard}
            title="Painel administrativo"
            description="Acesse o painel de gestão"
            to="/admin"
          />
        </NativeSettingsGroup>
      ) : null}

      <NativeSettingsGroup title="Conta e perfil">
        <NativeSettingsItem icon={User} title="Perfil e dados pessoais" to="/perfil" />
        <NativeSettingsItem icon={BadgeCheck} title="Verificação de perfil" to="/verificacao" />
      </NativeSettingsGroup>

      <NativeSettingsGroup title="Privacidade e segurança">
        <NativeSettingsItem icon={UserX} title="Pessoas bloqueadas" to="/bloqueados" />
        <NativeSettingsItem icon={ShieldCheck} title="Termos de uso" to="/termos" />
      </NativeSettingsGroup>

      <NativeSettingsGroup title="Preferências">
        <NativeSettingsItem icon={Bell} title="Notificações" to="/notificacoes" />
        <div className="px-4 py-4">{themeControl}</div>
      </NativeSettingsGroup>

      <NativeSettingsGroup title="Ajuda e documentos">
        <NativeSettingsItem icon={HelpCircle} title="Ajuda e suporte" to="/suporte" />
        <NativeSettingsItem icon={BookOpen} title="Manual do app" to="/manual" />
        <NativeSettingsItem icon={FileText} title="Termos de uso" to="/termos" />
      </NativeSettingsGroup>

      <NativeSettingsGroup title="Sessão">
        <NativeSettingsItem
          icon={LogOut}
          title={signingOut ? "Saindo..." : "Sair da conta"}
          description="Encerrar a sessão neste dispositivo"
          onClick={onSignOut}
          disabled={signingOut}
          showChevron={false}
        />
      </NativeSettingsGroup>

      <NativeSettingsGroup title="Zona de perigo" tone="danger">
        <div className={!isOnline ? "pointer-events-none p-3 opacity-60" : "p-3"}>
          {!isOnline ? (
            <p className="mb-3 text-sm text-destructive">
              Reconecte-se para alterar dados de segurança ou excluir a conta.
            </p>
          ) : null}
          {dangerZone}
        </div>
      </NativeSettingsGroup>
    </main>
  );
}
