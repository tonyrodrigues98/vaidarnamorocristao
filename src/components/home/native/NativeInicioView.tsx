import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BookHeart,
  ClipboardList,
  Compass,
  MessageCircle,
  Send,
  UserRound,
  UsersRound,
} from "lucide-react";

import { MissionsTodayCard } from "@/components/pet/MissionsTodayCard";
import { NativeProgress } from "@/components/native-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AccountStatus = "pending" | "approved" | "rejected" | "banned";
type NativeAdminWarning = {
  id: string;
  message: string;
  severity: "amber" | "severe";
};
type NativeAdminRequest = {
  id: string;
  kind: "photo" | "bio" | "behavior" | "other";
  message: string;
  createdAt: string;
};
type NativeAppeal = {
  appealText: string;
  status: "pending" | "answered" | "ignored";
  responseText: string | null;
  createdAt: string;
};

export type NativeInicioViewModel = {
  status: AccountStatus;
  firstName: string;
  greeting: string;
  greetingDetail: string;
  bannedReason: string | null;
  rejectionReason: string | null;
  warnings: NativeAdminWarning[];
  requests: NativeAdminRequest[];
  latestAppeal: NativeAppeal | null;
  latestRejectionAppeal: NativeAppeal | null;
  canAppeal: boolean;
  canReverify: boolean;
  appealText: string;
  appealBusy: boolean;
  devotional: {
    title: string;
    bibleReference: string | null;
    bibleText: string | null;
  } | null;
  strength: number;
  strengthLabel: string;
  nextProfileAction: { title: string; description: string } | null;
  unreadConversations: number;
  newProfiles: number;
  suggestion: {
    id: string;
    firstName: string;
    age: number | null;
    location: string | null;
  } | null;
  commitment: { matchId: string; partnerName: string | null; days: number } | null;
  onAppealTextChange(value: string): void;
  onAcknowledgeWarning(id: string): void;
  onResolveRequest(id: string): void;
  onSubmitAppeal(kind: "ban" | "rejection"): void;
};

type NativePriority = {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
  progress?: number;
};

// eslint-disable-next-line react-refresh/only-export-components -- pure priority contract is unit-tested with the view
export function getNativeInicioPriority(model: NativeInicioViewModel): NativePriority {
  if (model.status === "banned") {
    return {
      eyebrow: "Conta suspensa",
      title: "Acompanhe sua situação com a equipe",
      description: "Consulte o suporte ou envie uma apelação usando o formulário desta página.",
      to: "/suporte",
    };
  }
  if (model.status === "rejected") {
    return {
      eyebrow: "Perfil precisa de revisão",
      title: "Revise as informações do seu perfil",
      description: "Faça os ajustes solicitados antes de pedir uma nova análise.",
      to: "/perfil",
    };
  }
  if (model.warnings.some((warning) => warning.severity === "severe")) {
    return {
      eyebrow: "Moderação",
      title: "Leia o aviso importante da equipe",
      description: "O aviso e a ação de reconhecimento estão disponíveis abaixo.",
      to: "/suporte",
    };
  }
  if (model.requests.length > 0) {
    const request = model.requests[0];
    return {
      eyebrow: "Solicitação da equipe",
      title: "Há uma solicitação esperando sua atenção",
      description: request.message,
      to: request.kind === "photo" || request.kind === "bio" ? "/perfil" : "/suporte",
    };
  }
  if (model.status === "pending") {
    return {
      eyebrow: "Perfil em análise",
      title: "Acompanhe a aprovação do seu perfil",
      description: "Sua conta permanece em análise pela equipe.",
      to: "/perfil",
    };
  }
  if (model.commitment) {
    return {
      eyebrow: "Propósito ativo",
      title: model.commitment.partnerName
        ? `Continue seu propósito com ${model.commitment.partnerName}`
        : "Continue seu propósito",
      description: `Vocês estão caminhando há ${model.commitment.days} ${
        model.commitment.days === 1 ? "dia" : "dias"
      }.`,
      to: `/proposito/${model.commitment.matchId}`,
    };
  }
  if (model.strength < 100 && model.nextProfileAction) {
    return {
      eyebrow: "Perfil",
      title: model.nextProfileAction.title,
      description: model.nextProfileAction.description,
      to: "/perfil",
      progress: model.strength,
    };
  }
  if (model.devotional) {
    return {
      eyebrow: "Palavra do dia",
      title: "Reserve um momento para o devocional",
      description: model.devotional.title,
      to: "/devocional",
    };
  }
  return {
    eyebrow: "Sua jornada",
    title: "Veja o que está acontecendo na comunidade",
    description: "Continue pelas áreas reais disponíveis no aplicativo.",
    to: "/comunidade",
  };
}

const shortcuts = [
  { label: "Comunidade", to: "/comunidade", Icon: UsersRound },
  { label: "Explorar", to: "/explorar", Icon: Compass },
  { label: "Conversas", to: "/conversas", Icon: MessageCircle },
  { label: "Perfil", to: "/perfil", Icon: UserRound },
] as const;

export function NativeInicioView({ model }: { model: NativeInicioViewModel }) {
  const priority = getNativeInicioPriority(model);
  const approved = model.status === "approved";

  return (
    <main className="mx-auto grid w-full max-w-[880px] gap-5 px-4 py-5 pb-28 sm:px-6 md:pb-8">
      <section aria-labelledby="native-home-greeting">
        <h1 id="native-home-greeting" className="text-2xl font-bold tracking-tight text-foreground">
          {model.greeting}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.greetingDetail}</p>
      </section>

      {model.devotional ? (
        <Link
          to="/devocional"
          className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <BookHeart className="size-4" aria-hidden />
            Palavra do dia
          </span>
          {model.devotional.bibleReference ? (
            <p className="mt-3 text-xs font-semibold text-muted-foreground">
              {model.devotional.bibleReference}
            </p>
          ) : null}
          <h2 className="mt-1 text-base font-semibold">{model.devotional.title}</h2>
          {model.devotional.bibleText ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              “{model.devotional.bibleText}”
            </p>
          ) : null}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Ler devocional <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
      ) : (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BookHeart className="size-4 text-primary" aria-hidden />
            Palavra do dia
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum devocional foi publicado para hoje.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {priority.eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold">{priority.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{priority.description}</p>
        {priority.progress !== undefined ? (
          <NativeProgress
            title="Força do perfil"
            value={priority.progress}
            metadata={`${priority.progress}%`}
            className="mt-4"
          />
        ) : null}
        <Button asChild className="mt-4 min-h-11 rounded-full">
          <Link to={priority.to as never}>
            Continuar <ArrowRight className="ml-2 size-4" aria-hidden />
          </Link>
        </Button>
      </section>

      <section aria-labelledby="native-home-shortcuts">
        <h2 id="native-home-shortcuts" className="text-sm font-semibold">
          Atalhos
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shortcuts.map(({ label, to, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-11 items-center gap-2 rounded-2xl border border-border bg-card p-3 text-sm font-semibold shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-4 text-primary" aria-hidden />
              <span>{label}</span>
              {label === "Conversas" && model.unreadConversations > 0 ? (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {model.unreadConversations}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {!["banned", "rejected"].includes(model.status) ? (
        <section className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Seu ritmo</h2>
          <NativeProgress
            title="Força do perfil"
            value={model.strength}
            metadata={`${model.strength}% · ${model.strengthLabel}`}
          />
          {model.commitment ? (
            <Link
              to="/proposito/$matchId"
              params={{ matchId: model.commitment.matchId }}
              className="min-h-11 rounded-xl border border-border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Propósito ativo · {model.commitment.days}{" "}
              {model.commitment.days === 1 ? "dia" : "dias"}
            </Link>
          ) : null}
        </section>
      ) : null}

      {approved ? <MissionsTodayCard className="border-border bg-card" /> : null}

      {model.warnings.length > 0 ? (
        <section className="grid gap-3" aria-label="Avisos da moderação">
          {model.warnings.map((warning) => (
            <article
              key={warning.id}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
            >
              <h2 className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4" aria-hidden />
                {warning.severity === "severe" ? "Aviso sério da moderação" : "Aviso da moderação"}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{warning.message}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 min-h-11"
                onClick={() => model.onAcknowledgeWarning(warning.id)}
              >
                Entendi
              </Button>
            </article>
          ))}
        </section>
      ) : null}

      {model.requests.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <ClipboardList className="size-4 text-primary" aria-hidden />
            Solicitações da equipe
          </h2>
          <ul className="mt-3 grid gap-3">
            {model.requests.map((request) => (
              <li key={request.id} className="rounded-xl border border-border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {request.kind} · {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{request.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {request.kind === "photo" || request.kind === "bio" ? (
                    <Button asChild size="sm" variant="outline" className="min-h-11">
                      <Link to="/perfil">Ir para o perfil</Link>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    className="min-h-11"
                    onClick={() => model.onResolveRequest(request.id)}
                  >
                    Marcar como resolvida
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {model.status === "banned" ? (
        <AccountReviewPanel
          icon={<Ban className="size-5" aria-hidden />}
          title="Conta suspensa"
          reason={model.bannedReason}
          latest={model.latestAppeal}
          canSubmit={model.canAppeal}
          inputLabel="Recorrer da decisão"
          placeholder="Conte com calma o que aconteceu..."
          submitLabel="Enviar apelação"
          model={model}
          kind="ban"
        />
      ) : null}

      {model.status === "rejected" ? (
        <AccountReviewPanel
          icon={<AlertTriangle className="size-5" aria-hidden />}
          title="Conta negada"
          reason={model.rejectionReason}
          latest={model.latestRejectionAppeal}
          canSubmit={model.canReverify}
          inputLabel="Pedir nova análise"
          placeholder="Conte o que mudou no seu perfil..."
          submitLabel="Verificar novamente"
          model={model}
          kind="rejection"
        />
      ) : null}

      {model.unreadConversations > 0 || model.commitment ? (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-semibold">Uma conversa espera por você</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {model.unreadConversations > 0
              ? `${model.unreadConversations} ${
                  model.unreadConversations === 1 ? "conversa ativa" : "conversas ativas"
                }.`
              : "Continue a conversa do seu propósito."}
          </p>
          <Button asChild variant="outline" className="mt-3 min-h-11">
            <Link
              to={
                model.unreadConversations > 0 || !model.commitment
                  ? "/conversas"
                  : (`/proposito/${model.commitment.matchId}` as never)
              }
            >
              Abrir conversa
            </Link>
          </Button>
        </section>
      ) : null}

      {approved && (model.suggestion || model.newProfiles > 0) ? (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-semibold">Uma descoberta para quando quiser explorar</h2>
          {model.suggestion ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {model.suggestion.firstName}
              {model.suggestion.age ? `, ${model.suggestion.age}` : ""}
              {model.suggestion.location ? ` · ${model.suggestion.location}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Há {model.newProfiles} novos perfis disponíveis.
            </p>
          )}
          <Button asChild variant="outline" className="mt-3 min-h-11">
            {model.suggestion ? (
              <Link to="/pretendentes/$id" params={{ id: model.suggestion.id }}>
                Ver perfil
              </Link>
            ) : (
              <Link to="/pretendentes">Explorar pretendentes</Link>
            )}
          </Button>
        </section>
      ) : null}
    </main>
  );
}

function AccountReviewPanel({
  icon,
  title,
  reason,
  latest,
  canSubmit,
  inputLabel,
  placeholder,
  submitLabel,
  model,
  kind,
}: {
  icon: React.ReactNode;
  title: string;
  reason: string | null;
  latest: NativeAppeal | null;
  canSubmit: boolean;
  inputLabel: string;
  placeholder: string;
  submitLabel: string;
  model: NativeInicioViewModel;
  kind: "ban" | "rejection";
}) {
  return (
    <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </h2>
      {reason ? (
        <p className="mt-2 whitespace-pre-wrap text-sm">
          <strong>Motivo:</strong> {reason}
        </p>
      ) : null}
      {latest ? (
        <div className="mt-3 rounded-xl border border-border bg-background/60 p-3 text-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Solicitação · {new Date(latest.createdAt).toLocaleDateString("pt-BR")} · {latest.status}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{latest.appealText}</p>
          {latest.responseText ? (
            <p className="mt-2 whitespace-pre-wrap border-t border-border pt-2">
              {latest.responseText}
            </p>
          ) : null}
        </div>
      ) : null}
      {canSubmit ? (
        <div className="mt-4">
          <label className="text-sm font-semibold" htmlFor={`native-${kind}-appeal`}>
            {inputLabel}
          </label>
          <Textarea
            id={`native-${kind}-appeal`}
            value={model.appealText}
            onChange={(event) => model.onAppealTextChange(event.target.value)}
            maxLength={2000}
            placeholder={placeholder}
            className="mt-2 min-h-28"
          />
          <Button
            className="mt-3 min-h-11"
            onClick={() => model.onSubmitAppeal(kind)}
            disabled={model.appealBusy}
          >
            <Send className="mr-2 size-4" aria-hidden />
            {submitLabel}
          </Button>
        </div>
      ) : null}
      <Button asChild variant="outline" className="mt-3 min-h-11">
        <Link to="/suporte">Falar com o suporte</Link>
      </Button>
    </section>
  );
}
