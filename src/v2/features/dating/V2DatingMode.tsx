import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Flag,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Pause,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import type {
  DatingCandidate,
  DatingModeState,
  DatingReportReason,
  DatingRepository,
} from "./contracts";

const REPORT_REASONS: readonly { value: DatingReportReason; label: string }[] = [
  { value: "inappropriate_profile", label: "Conteúdo inadequado" },
  { value: "false_identity", label: "Identidade suspeita" },
  { value: "harassment", label: "Assédio" },
  { value: "other", label: "Outro motivo" },
];

function stateCopy(state: Exclude<DatingModeState, "active">) {
  switch (state) {
    case "legacy-confirmation":
      return {
        title: "Revise sua participação",
        description:
          "Seu histórico foi preservado, mas a descoberta nova só abre depois de uma confirmação explícita.",
        action: "Revisar e confirmar",
      };
    case "committed":
      return {
        title: "Namoro pausado pelo Propósito",
        description:
          "Seu Propósito Firmado pausa apenas a descoberta romântica. A comunidade e o histórico continuam intactos.",
        action: "Ver configurações",
      };
    case "restricted":
      return {
        title: "Modo Namoro indisponível",
        description:
          "Uma restrição de segurança não pode ser removida pelo navegador. Use o suporte para solicitar revisão.",
        action: "Ver orientações",
      };
    case "paused":
      return {
        title: "Modo Namoro pausado",
        description:
          "Ninguém novo verá você na descoberta. Reativar exige revisar e confirmar novamente suas escolhas.",
        action: "Revisar reativação",
      };
    default:
      return {
        title: "Modo Namoro desligado",
        description:
          "A participação comunitária continua completa. Ative o Namoro somente se quiser entrar na descoberta romântica.",
        action: "Conhecer o modo opcional",
      };
  }
}

function interestLabel(candidate: DatingCandidate) {
  switch (candidate.interestState) {
    case "matched":
      return "Abrir conversas";
    case "sent":
      return "Interesse enviado";
    case "received":
      return "Retribuir interesse";
    default:
      return "Tenho interesse";
  }
}

export function V2DatingMode({
  userId,
  repository,
  onReviewPreferences,
  onMembershipExit,
  onOpenConversations,
}: {
  readonly userId: string;
  readonly repository: DatingRepository;
  readonly onReviewPreferences: () => void;
  readonly onMembershipExit: () => Promise<void>;
  readonly onOpenConversations: () => void;
}) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState("");
  const [confirmation, setConfirmation] = useState<"pause" | "deactivate" | null>(null);
  const [blockTarget, setBlockTarget] = useState<DatingCandidate | null>(null);
  const [reportTarget, setReportTarget] = useState<DatingCandidate | null>(null);
  const [reportReason, setReportReason] = useState<DatingReportReason>("inappropriate_profile");
  const reportHeadingRef = useRef<HTMLHeadingElement>(null);
  const membershipKey = useMemo(() => ["v2", "dating-membership", userId] as const, [userId]);
  const discoveryKey = useMemo(() => ["v2", "dating-discovery", userId] as const, [userId]);
  const membership = useQuery({
    queryKey: membershipKey,
    queryFn: () => repository.loadMembership(userId),
  });
  const discovery = useInfiniteQuery({
    queryKey: discoveryKey,
    queryFn: ({ pageParam }) => repository.loadDiscovery(userId, pageParam),
    initialPageParam: null as import("./contracts").DatingDiscoveryCursor | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: membership.data?.state === "active",
    staleTime: 30_000,
  });
  const candidates = useMemo(() => {
    const unique = new Map<string, DatingCandidate>();
    for (const candidate of discovery.data?.pages.flatMap((page) => page.items) ?? []) {
      if (!unique.has(candidate.id)) unique.set(candidate.id, candidate);
    }
    return [...unique.values()];
  }, [discovery.data?.pages]);

  useEffect(() => {
    if (!reportTarget) return;
    reportHeadingRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReportTarget(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [reportTarget]);

  const interest = useMutation({
    mutationFn: (candidate: DatingCandidate) => repository.expressInterest(userId, candidate.id),
    onSuccess: async (result, candidate) => {
      setFeedback(
        result.state === "matched"
          ? `O interesse foi recíproco com ${candidate.displayName}. A conversa foi preservada no contexto romântico.`
          : `Interesse enviado para ${candidate.displayName}.`,
      );
      await queryClient.invalidateQueries({ queryKey: discoveryKey });
    },
    onError: () => setFeedback("Não foi possível registrar esse interesse agora."),
  });

  const membershipAction = useMutation({
    mutationFn: (action: "pause" | "deactivate") =>
      action === "pause" ? repository.pause(userId) : repository.deactivate(userId),
    onSuccess: async (_next, action) => {
      setConfirmation(null);
      setFeedback(action === "pause" ? "Modo Namoro pausado." : "Modo Namoro desativado.");
      await queryClient.cancelQueries({ queryKey: discoveryKey });
      queryClient.removeQueries({ queryKey: discoveryKey });
      await onMembershipExit();
    },
    onError: () => setFeedback("Não foi possível alterar o modo Namoro agora."),
  });

  const safety = useMutation({
    mutationFn: async (
      action:
        | { readonly kind: "block"; readonly candidate: DatingCandidate }
        | {
            readonly kind: "report";
            readonly candidate: DatingCandidate;
            readonly reason: DatingReportReason;
          },
    ) => {
      if (action.kind === "block") {
        await repository.block(userId, action.candidate.id);
      } else {
        await repository.report(userId, action.candidate.id, action.reason);
      }
      return action;
    },
    onSuccess: async (action) => {
      setReportTarget(null);
      setBlockTarget(null);
      setFeedback(
        action.kind === "block"
          ? `${action.candidate.displayName} foi bloqueado e removido da descoberta.`
          : "Denúncia recebida para análise. O perfil não foi alterado pelo navegador.",
      );
      await queryClient.invalidateQueries({ queryKey: discoveryKey });
    },
    onError: () => setFeedback("Não foi possível concluir essa ação de segurança."),
  });

  if (membership.isPending) {
    return (
      <V2Surface className="vdn-v2-dating-state">
        <V2LoadingIndicator label="Carregando modo Namoro" />
      </V2Surface>
    );
  }
  if (membership.isError) {
    return (
      <V2Surface className="vdn-v2-dating-state" role="alert">
        <ShieldCheck aria-hidden="true" />
        <V2Heading level={2} size="small">
          Estado indisponível
        </V2Heading>
        <V2Text tone="muted">A descoberta permaneceu fechada e nenhum dado foi alterado.</V2Text>
        <V2Button variant="secondary" onClick={() => void membership.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  if (membership.data.state !== "active") {
    const copy = stateCopy(membership.data.state);
    return (
      <V2Surface className="vdn-v2-dating-state">
        <ShieldCheck aria-hidden="true" />
        <V2StatusBadge tone="neutral">Área opcional</V2StatusBadge>
        <V2Heading level={2} size="medium">
          {copy.title}
        </V2Heading>
        <V2Text tone="secondary">{copy.description}</V2Text>
        <V2Button leadingIcon={<Settings2 />} onClick={onReviewPreferences}>
          {copy.action}
        </V2Button>
      </V2Surface>
    );
  }

  return (
    <section className="vdn-v2-dating" aria-labelledby="vdn-v2-dating-title">
      <div className="vdn-v2-dating__announcement" role="status" aria-live="polite">
        {feedback}
      </div>
      <V2Surface className="vdn-v2-dating__intro" elevation="one">
        <div>
          <V2StatusBadge tone="brand">
            <HeartHandshake aria-hidden="true" />
            Namoro ativo
          </V2StatusBadge>
          <V2Heading id="vdn-v2-dating-title" level={2} size="medium">
            Descoberta com propósito
          </V2Heading>
          <V2Text tone="secondary">
            Somente participantes ativos e elegíveis aparecem aqui. A comunidade continua
            independente desta área.
          </V2Text>
        </div>
        <div className="vdn-v2-dating__mode-actions">
          <V2Button variant="outline" leadingIcon={<Settings2 />} onClick={onReviewPreferences}>
            Preferências
          </V2Button>
          <V2Button
            variant="ghost"
            leadingIcon={<Pause />}
            onClick={() => setConfirmation("pause")}
          >
            Pausar
          </V2Button>
          <V2Button variant="destructive" onClick={() => setConfirmation("deactivate")}>
            Desativar
          </V2Button>
        </div>
      </V2Surface>

      {confirmation ? (
        <V2Surface className="vdn-v2-dating__confirmation" role="alert">
          <V2Heading level={3} size="small">
            {confirmation === "pause" ? "Pausar o modo Namoro?" : "Desativar o modo Namoro?"}
          </V2Heading>
          <V2Text tone="secondary">
            Matches, interesses, conversas e histórico legítimos não serão apagados. A comunidade
            continuará funcionando normalmente.
          </V2Text>
          <div>
            <V2Button
              variant={confirmation === "deactivate" ? "destructive" : "primary"}
              loading={membershipAction.isPending}
              onClick={() => membershipAction.mutate(confirmation)}
            >
              Confirmar
            </V2Button>
            <V2Button
              variant="ghost"
              disabled={membershipAction.isPending}
              onClick={() => setConfirmation(null)}
            >
              Cancelar
            </V2Button>
          </div>
        </V2Surface>
      ) : null}

      {discovery.isPending ? (
        <V2Surface className="vdn-v2-dating-state">
          <V2LoadingIndicator label="Buscando perfis elegíveis" />
        </V2Surface>
      ) : discovery.isError ? (
        <V2Surface className="vdn-v2-dating-state" role="alert">
          <V2Heading level={3} size="small">
            Descoberta indisponível
          </V2Heading>
          <V2Text tone="muted">Preferências, bloqueios e histórico permanecem intactos.</V2Text>
          <V2Button variant="secondary" onClick={() => void discovery.refetch()}>
            Tentar novamente
          </V2Button>
        </V2Surface>
      ) : candidates.length === 0 ? (
        <V2Surface className="vdn-v2-dating-state">
          <HeartHandshake aria-hidden="true" />
          <V2Heading level={3} size="small">
            Nenhum perfil disponível agora
          </V2Heading>
          <V2Text tone="muted">
            Isso pode acontecer por preferências, bloqueios, compromissos ou porque você já conheceu
            os perfis elegíveis.
          </V2Text>
        </V2Surface>
      ) : (
        <div className="vdn-v2-dating__grid">
          {candidates.map((candidate) => {
            const interestBusy = interest.isPending && interest.variables?.id === candidate.id;
            return (
              <V2Surface
                key={candidate.id}
                as="article"
                className="vdn-v2-dating-card"
                elevation="one"
              >
                <div className="vdn-v2-dating-card__media">
                  <span aria-hidden="true">{candidate.displayName.slice(0, 1).toUpperCase()}</span>
                  {candidate.photoUrl ? (
                    <img
                      src={candidate.photoUrl}
                      alt={`Foto de ${candidate.displayName}`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                  ) : null}
                  <V2StatusBadge tone="neutral">
                    {candidate.explanation === "mesmo_estado_e_recente"
                      ? "Mesmo estado · recente"
                      : "Perfil recente"}
                  </V2StatusBadge>
                </div>
                <div className="vdn-v2-dating-card__body">
                  <div>
                    <V2Heading level={3} size="small">
                      {candidate.displayName}, {candidate.age}
                    </V2Heading>
                    <V2Text variant="caption" tone="muted">
                      <MapPin aria-hidden="true" />
                      {[candidate.city, candidate.state].filter(Boolean).join(", ")}
                    </V2Text>
                  </div>
                  {candidate.church ? (
                    <V2StatusBadge tone="neutral">{candidate.church}</V2StatusBadge>
                  ) : null}
                  {candidate.bio ? <V2Text>{candidate.bio}</V2Text> : null}
                  {candidate.seeking ? (
                    <V2Text variant="caption" tone="secondary">
                      Busca: {candidate.seeking}
                    </V2Text>
                  ) : null}
                  <div className="vdn-v2-dating-card__actions">
                    <V2Button
                      loading={interestBusy}
                      disabled={candidate.interestState === "sent"}
                      leadingIcon={
                        candidate.interestState === "matched" ? (
                          <MessageCircle />
                        ) : (
                          <HeartHandshake />
                        )
                      }
                      onClick={() =>
                        candidate.interestState === "matched"
                          ? onOpenConversations()
                          : interest.mutate(candidate)
                      }
                    >
                      {interestLabel(candidate)}
                    </V2Button>
                    <V2Button
                      variant="ghost"
                      size="small"
                      leadingIcon={<Flag />}
                      onClick={() => setReportTarget(candidate)}
                    >
                      Denunciar
                    </V2Button>
                    <V2Button
                      variant="ghost"
                      size="small"
                      leadingIcon={<Ban />}
                      onClick={() => setBlockTarget(candidate)}
                    >
                      Bloquear
                    </V2Button>
                  </div>
                </div>
              </V2Surface>
            );
          })}
        </div>
      )}

      {discovery.hasNextPage ? (
        <V2Button
          variant="secondary"
          loading={discovery.isFetchingNextPage}
          onClick={() => void discovery.fetchNextPage()}
        >
          Ver mais perfis
        </V2Button>
      ) : null}

      {blockTarget ? (
        <V2Surface className="vdn-v2-dating__confirmation" role="alert">
          <V2Heading level={3} size="small">
            Bloquear {blockTarget.displayName}?
          </V2Heading>
          <V2Text tone="secondary">
            Vocês deixarão de aparecer um para o outro. Interesses, matches e histórico legítimo
            permanecem preservados para moderação e segurança.
          </V2Text>
          <div>
            <V2Button
              variant="destructive"
              loading={safety.isPending}
              onClick={() => safety.mutate({ kind: "block", candidate: blockTarget })}
            >
              Confirmar bloqueio
            </V2Button>
            <V2Button
              variant="ghost"
              disabled={safety.isPending}
              onClick={() => setBlockTarget(null)}
            >
              Cancelar
            </V2Button>
          </div>
        </V2Surface>
      ) : null}

      {reportTarget ? (
        <V2Surface
          className="vdn-v2-dating__report"
          role="dialog"
          aria-modal="false"
          aria-labelledby="vdn-v2-dating-report-title"
        >
          <V2Heading
            ref={reportHeadingRef}
            id="vdn-v2-dating-report-title"
            level={3}
            size="small"
            tabIndex={-1}
          >
            Denunciar {reportTarget.displayName}
          </V2Heading>
          <V2Text tone="secondary">
            A denúncia será revisada pela moderação. Nenhuma sanção é aplicada pelo navegador.
          </V2Text>
          <label>
            <span>Motivo</span>
            <select
              value={reportReason}
              onChange={(event) => setReportReason(event.currentTarget.value as DatingReportReason)}
            >
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <V2Button
              variant="destructive"
              loading={safety.isPending}
              onClick={() =>
                safety.mutate({ kind: "report", candidate: reportTarget, reason: reportReason })
              }
            >
              Enviar denúncia
            </V2Button>
            <V2Button variant="ghost" onClick={() => setReportTarget(null)}>
              Cancelar
            </V2Button>
          </div>
        </V2Surface>
      ) : null}
    </section>
  );
}
