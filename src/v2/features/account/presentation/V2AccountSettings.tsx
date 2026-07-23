import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Check,
  FileText,
  HelpCircle,
  LockKeyhole,
  LogOut,
  Moon,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
  Sun,
  Trash2,
  Undo2,
  UserRound,
  UserX,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2Skeleton,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextField,
  type V2ThemeName,
} from "@/v2/design-system";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  formatAccountDate,
  validateAccountDeletionConfirmation,
  type AccountCommand,
  type AccountLifecycle,
  type AccountOperationError,
} from "../domain/account";

export type AccountNavigationTarget =
  | "profile"
  | "verification"
  | "blocked"
  | "notifications"
  | "support"
  | "manual"
  | "terms";

export interface V2AccountSettingsProps {
  readonly lifecycle: AccountLifecycle | null;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isEmpty: boolean;
  readonly isOnline: boolean;
  readonly queryError: AccountOperationError | null;
  readonly mutationError: AccountOperationError | null;
  readonly pendingCommand: AccountCommand["type"] | null;
  readonly successMessage: string;
  readonly theme: V2ThemeName;
  readonly onThemeChange: (theme: V2ThemeName) => void;
  readonly onNavigate: (target: AccountNavigationTarget) => void;
  readonly onRetry: () => void;
  readonly onExecute: (command: AccountCommand) => void;
  readonly logoutLoading: boolean;
  readonly onLogout: () => void | Promise<void>;
}

const NAVIGATION_ITEMS = [
  {
    target: "profile",
    label: "Perfil e dados pessoais",
    description: "Edite as informações exibidas no seu perfil.",
    icon: UserRound,
  },
  {
    target: "verification",
    label: "Verificação",
    description: "Acompanhe a verificação da sua identidade.",
    icon: ShieldCheck,
  },
  {
    target: "blocked",
    label: "Pessoas bloqueadas",
    description: "Revise os bloqueios aplicados à sua conta.",
    icon: UserX,
  },
  {
    target: "notifications",
    label: "Notificações",
    description: "Abra sua central de atividades e preferências do navegador.",
    icon: Bell,
  },
] as const;

const SUPPORT_ITEMS = [
  { target: "support", label: "Ajuda e suporte", icon: HelpCircle },
  { target: "manual", label: "Manual do app", icon: BookOpen },
  { target: "terms", label: "Termos de uso", icon: FileText },
] as const;

function AccountLoading() {
  return (
    <div className="vdn-v2-account__stack" aria-label="Carregando configurações da conta">
      <V2Surface className="vdn-v2-account__summary" elevation="one">
        <V2Skeleton width="7rem" height="1.5rem" />
        <V2Skeleton width="min(100%, 25rem)" height="1rem" />
      </V2Surface>
      <V2Surface className="vdn-v2-account__section">
        <V2Skeleton width="11rem" height="1.25rem" />
        <V2Skeleton width="100%" height="8rem" />
      </V2Surface>
    </div>
  );
}

function ErrorState({
  error,
  isOnline,
  onRetry,
}: {
  readonly error: AccountOperationError;
  readonly isOnline: boolean;
  readonly onRetry: () => void;
}) {
  return (
    <V2Surface className="vdn-v2-account__state" elevation="one" role="alert">
      <LockKeyhole aria-hidden="true" />
      <V2Heading level={2} size="small">
        Não foi possível carregar sua conta
      </V2Heading>
      <V2Text tone="secondary">{error.message}</V2Text>
      {error.retryable && isOnline ? (
        <V2Button variant="secondary" leadingIcon={<RefreshCw />} onClick={onRetry}>
          Tentar novamente
        </V2Button>
      ) : null}
    </V2Surface>
  );
}

function LifecycleSummary({ lifecycle }: { readonly lifecycle: AccountLifecycle }) {
  const scheduledDate = formatAccountDate(lifecycle.deletionScheduledFor);
  const badge =
    lifecycle.status === "active"
      ? { tone: "success" as const, label: "Conta ativa" }
      : lifecycle.status === "deactivated"
        ? { tone: "warning" as const, label: "Conta desativada" }
        : { tone: "danger" as const, label: "Exclusão agendada" };

  return (
    <V2Surface className="vdn-v2-account__summary" elevation="one">
      <div>
        <V2StatusBadge tone={badge.tone} icon={<Check />}>
          {badge.label}
        </V2StatusBadge>
        <V2Heading level={2} size="medium">
          Controle claro sobre sua conta
        </V2Heading>
        <V2Text tone="secondary">
          {lifecycle.status === "active" &&
            "Seu acesso está ativo. Você pode revisar preferências ou pausar a conta quando precisar."}
          {lifecycle.status === "deactivated" &&
            "Seu perfil está invisível, mas seus dados legítimos permanecem preservados para reativação."}
          {lifecycle.status === "deletion-pending" &&
            `A exclusão está agendada${scheduledDate ? ` para ${scheduledDate}` : ""}. Você ainda pode cancelar dentro do prazo.`}
        </V2Text>
      </div>
    </V2Surface>
  );
}

function NavigationSection({
  title,
  items,
  onNavigate,
}: {
  readonly title: string;
  readonly items: ReadonlyArray<{
    target: AccountNavigationTarget;
    label: string;
    description?: string;
    icon: typeof UserRound;
  }>;
  readonly onNavigate: (target: AccountNavigationTarget) => void;
}) {
  return (
    <V2Surface as="section" className="vdn-v2-account__section">
      <V2Heading level={2} size="small">
        {title}
      </V2Heading>
      <div className="vdn-v2-account__link-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.target}
              type="button"
              className="vdn-v2-account__link"
              onClick={() => onNavigate(item.target)}
            >
              <span className="vdn-v2-account__link-icon" aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{item.label}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
            </button>
          );
        })}
      </div>
    </V2Surface>
  );
}

function AppearanceSection({
  theme,
  onThemeChange,
}: Pick<V2AccountSettingsProps, "theme" | "onThemeChange">) {
  return (
    <V2Surface as="section" className="vdn-v2-account__section">
      <V2Heading level={2} size="small">
        Aparência
      </V2Heading>
      <V2Text tone="secondary">Esta preferência é salva somente neste navegador.</V2Text>
      <div className="vdn-v2-account__theme" role="group" aria-label="Tema do aplicativo">
        <V2Button
          variant={theme === "light" ? "primary" : "outline"}
          leadingIcon={<Sun />}
          aria-pressed={theme === "light"}
          onClick={() => onThemeChange("light")}
        >
          Claro
        </V2Button>
        <V2Button
          variant={theme === "dark" ? "primary" : "outline"}
          leadingIcon={<Moon />}
          aria-pressed={theme === "dark"}
          onClick={() => onThemeChange("dark")}
        >
          Escuro
        </V2Button>
      </div>
    </V2Surface>
  );
}

function DangerZone({
  lifecycle,
  pendingCommand,
  isOnline,
  onExecute,
}: Pick<V2AccountSettingsProps, "lifecycle" | "pendingCommand" | "isOnline" | "onExecute">) {
  const [confirmation, setConfirmation] = useState<"deactivate" | "delete" | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const confirmationRef = useRef<HTMLDivElement>(null);
  const validation = validateAccountDeletionConfirmation(confirmationText);
  const pending = pendingCommand !== null;

  useEffect(() => {
    if (confirmation) confirmationRef.current?.focus();
  }, [confirmation]);

  useEffect(() => {
    setConfirmation(null);
    setConfirmationText("");
  }, [lifecycle?.status]);

  if (!lifecycle) return null;

  return (
    <V2Surface
      as="section"
      className="vdn-v2-account__section vdn-v2-account__danger"
      aria-labelledby="vdn-v2-account-danger-title"
    >
      <div>
        <V2Heading id="vdn-v2-account-danger-title" level={2} size="small">
          Controle da conta
        </V2Heading>
        <V2Text tone="secondary">
          Estas ações usam os contratos reais já existentes. Nenhum dado é apagado imediatamente.
        </V2Text>
      </div>

      {lifecycle.status === "deletion-pending" ? (
        <div className="vdn-v2-account__danger-row">
          <div>
            <strong>Cancelar exclusão</strong>
            <small>Restaura o estado ativo da conta dentro do prazo existente.</small>
          </div>
          <V2Button
            variant="secondary"
            leadingIcon={<Undo2 />}
            loading={pendingCommand === "cancel-deletion"}
            disabled={!isOnline || pending}
            onClick={() => onExecute({ type: "cancel-deletion" })}
          >
            Cancelar exclusão
          </V2Button>
        </div>
      ) : (
        <>
          <div className="vdn-v2-account__danger-row">
            <div>
              <strong>
                {lifecycle.status === "deactivated" ? "Reativar conta" : "Desativar conta"}
              </strong>
              <small>
                {lifecycle.status === "deactivated"
                  ? "Volta a tornar seu perfil disponível conforme as regras atuais."
                  : "Oculta seu perfil sem apagar conversas ou histórico."}
              </small>
            </div>
            {lifecycle.status === "deactivated" ? (
              <V2Button
                variant="secondary"
                leadingIcon={<RefreshCw />}
                loading={pendingCommand === "request-reactivation"}
                disabled={!isOnline || pending}
                onClick={() => onExecute({ type: "request-reactivation" })}
              >
                Reativar
              </V2Button>
            ) : (
              <V2Button
                variant="outline"
                leadingIcon={<PauseCircle />}
                disabled={!isOnline || pending}
                onClick={() => setConfirmation("deactivate")}
              >
                Desativar
              </V2Button>
            )}
          </div>

          <div className="vdn-v2-account__danger-row">
            <div>
              <strong>Solicitar exclusão</strong>
              <small>
                Agenda a exclusão para o prazo definido pelo serviço e encerra sua sessão.
              </small>
            </div>
            <V2Button
              variant="destructive"
              leadingIcon={<Trash2 />}
              disabled={!isOnline || pending}
              onClick={() => {
                setConfirmationText("");
                setConfirmation("delete");
              }}
            >
              Excluir conta
            </V2Button>
          </div>
        </>
      )}

      {!isOnline ? (
        <V2Text className="vdn-v2-account__offline" role="status">
          Você está offline. Reconecte-se para alterar o estado da conta.
        </V2Text>
      ) : null}

      {confirmation === "deactivate" ? (
        <div
          ref={confirmationRef}
          className="vdn-v2-account__confirmation"
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="vdn-v2-deactivate-title"
          tabIndex={-1}
        >
          <V2Heading id="vdn-v2-deactivate-title" level={3} size="small">
            Confirmar desativação?
          </V2Heading>
          <V2Text tone="secondary">
            Seu perfil ficará invisível. Conversas e dados legítimos serão preservados.
          </V2Text>
          <div className="vdn-v2-account__actions">
            <V2Button variant="ghost" onClick={() => setConfirmation(null)}>
              Voltar
            </V2Button>
            <V2Button
              variant="secondary"
              loading={pendingCommand === "request-deactivation"}
              onClick={() => onExecute({ type: "request-deactivation" })}
            >
              Confirmar desativação
            </V2Button>
          </div>
        </div>
      ) : null}

      {confirmation === "delete" ? (
        <div
          ref={confirmationRef}
          className="vdn-v2-account__confirmation"
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="vdn-v2-delete-title"
          tabIndex={-1}
        >
          <V2Heading id="vdn-v2-delete-title" level={3} size="small">
            Confirmação de exclusão
          </V2Heading>
          <V2Text tone="secondary">
            A solicitação desativa sua conta e inicia o prazo de cancelamento existente. Digite
            {` ${ACCOUNT_DELETION_CONFIRMATION} `}para continuar.
          </V2Text>
          <V2TextField
            label="Texto de confirmação"
            value={confirmationText}
            autoComplete="off"
            inputMode="text"
            error={confirmationText.length > 0 && !validation.ok ? validation.message : undefined}
            onChange={(event) => setConfirmationText(event.currentTarget.value)}
          />
          <div className="vdn-v2-account__actions">
            <V2Button variant="ghost" onClick={() => setConfirmation(null)}>
              Voltar
            </V2Button>
            <V2Button
              variant="destructive"
              loading={pendingCommand === "request-deletion"}
              disabled={!validation.ok || pending}
              onClick={() => {
                if (!validation.ok) return;
                onExecute({ type: "request-deletion", confirmation: validation.value });
              }}
            >
              Agendar exclusão
            </V2Button>
          </div>
        </div>
      ) : null}
    </V2Surface>
  );
}

export function V2AccountSettings(props: V2AccountSettingsProps) {
  if (props.isLoading) return <AccountLoading />;
  if (props.queryError) {
    return (
      <ErrorState error={props.queryError} isOnline={props.isOnline} onRetry={props.onRetry} />
    );
  }
  if (props.isEmpty || !props.lifecycle) {
    return (
      <V2Surface className="vdn-v2-account__state" elevation="one">
        <UserRound aria-hidden="true" />
        <V2Heading level={2} size="small">
          Conta ainda não disponível
        </V2Heading>
        <V2Text tone="secondary">
          Não encontramos o registro necessário. Nenhuma ação foi executada.
        </V2Text>
        <V2Button variant="secondary" leadingIcon={<RefreshCw />} onClick={props.onRetry}>
          Atualizar
        </V2Button>
      </V2Surface>
    );
  }

  return (
    <div className="vdn-v2-account__stack">
      <div className="vdn-v2-account__announcements" aria-live="polite" aria-atomic="true">
        {!props.isOnline ? "Você está offline. As alterações estão pausadas." : ""}
        {props.isFetching && !props.isLoading ? " Atualizando dados da conta." : ""}
        {props.successMessage ? ` ${props.successMessage}` : ""}
      </div>
      {props.mutationError ? (
        <V2Surface className="vdn-v2-account__inline-error" role="alert">
          <V2Text>{props.mutationError.message}</V2Text>
        </V2Surface>
      ) : null}
      <LifecycleSummary lifecycle={props.lifecycle} />
      <div className="vdn-v2-account__columns">
        <NavigationSection
          title="Identidade e privacidade"
          items={NAVIGATION_ITEMS}
          onNavigate={props.onNavigate}
        />
        <AppearanceSection theme={props.theme} onThemeChange={props.onThemeChange} />
      </div>
      <NavigationSection
        title="Suporte e documentos"
        items={SUPPORT_ITEMS}
        onNavigate={props.onNavigate}
      />
      <V2Surface as="section" className="vdn-v2-account__section">
        <V2Heading level={2} size="small">
          Sessão
        </V2Heading>
        <V2Text tone="secondary">
          Encerre o acesso neste dispositivo. O cache privado é removido na troca de conta.
        </V2Text>
        <div>
          <V2Button
            variant="outline"
            leadingIcon={<LogOut />}
            loading={props.logoutLoading}
            onClick={props.onLogout}
          >
            Sair da conta
          </V2Button>
        </div>
      </V2Surface>
      <DangerZone
        lifecycle={props.lifecycle}
        pendingCommand={props.pendingCommand}
        isOnline={props.isOnline}
        onExecute={props.onExecute}
      />
    </div>
  );
}
