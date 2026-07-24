import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Gift,
  HeartHandshake,
  History,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextArea,
} from "@/v2/design-system";
import {
  createCommandKey,
  sanitizeRomanticText,
  type RomanticContextRepository,
} from "./contracts";

function commandKey(): string {
  return createCommandKey(() => globalThis.crypto.randomUUID());
}

export function V2PurposeCenter({
  userId,
  repository,
  onOpenConversations,
}: {
  readonly userId: string;
  readonly repository: RomanticContextRepository;
  readonly onOpenConversations: () => void;
}) {
  const queryClient = useQueryClient();
  const key = ["v2", "relationship-purpose", userId] as const;
  const purpose = useQuery({ queryKey: key, queryFn: () => repository.loadPurpose(userId) });
  const [feedback, setFeedback] = useState("");
  const [confirmation, setConfirmation] = useState<"end" | null>(null);
  const [giftId, setGiftId] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  const refresh = async () => queryClient.invalidateQueries({ queryKey: key });
  const request = useMutation({
    mutationFn: (matchId: string) => repository.requestPurpose(userId, matchId, commandKey()),
    onSuccess: async () => {
      setFeedback("Pedido de Propósito enviado.");
      await refresh();
    },
    onError: () => setFeedback("Não foi possível enviar o pedido agora."),
  });
  const transition = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "accept" | "reject" | "cancel" | "end" | "archive";
    }) => repository.transitionPurpose(userId, id, action),
    onSuccess: async (_data, variables) => {
      setConfirmation(null);
      setFeedback(
        variables.action === "accept"
          ? "Propósito aceito. Somente o domínio romântico foi pausado."
          : variables.action === "end"
            ? "Propósito encerrado. Reativar o Namoro continuará sendo uma escolha manual."
            : "Pedido atualizado e preservado no histórico.",
      );
      await refresh();
    },
    onError: () => setFeedback("A transição não foi autorizada ou o estado já mudou."),
  });
  const sendGift = useMutation({
    mutationFn: async () => {
      const current = purpose.data?.current;
      if (!current || current.state !== "active" || !giftId) throw new Error("invalid");
      return repository.sendPurposeGift(userId, {
        receiverId: current.partner.id,
        giftId,
        purposeId: current.id,
        message: sanitizeRomanticText(giftMessage, 120),
        idempotencyKey: commandKey(),
      });
    },
    onSuccess: async () => {
      setGiftId("");
      setGiftMessage("");
      setFeedback("Presente entregue pela economia real da plataforma.");
      await refresh();
    },
    onError: () =>
      setFeedback("Não foi possível enviar o presente. Nenhuma cobrança parcial ficou."),
  });

  if (purpose.isPending) {
    return (
      <V2Surface className="vdn-v2-romantic-state">
        <V2LoadingIndicator label="Carregando Propósito Firmado" />
      </V2Surface>
    );
  }
  if (purpose.isError || !purpose.data) {
    return (
      <V2Surface className="vdn-v2-romantic-state" role="alert">
        <ShieldCheck aria-hidden="true" />
        <V2Heading level={2} size="small">
          Propósito indisponível
        </V2Heading>
        <V2Text tone="muted">A comunidade e as conversas sociais continuam disponíveis.</V2Text>
        <V2Button variant="secondary" onClick={() => void purpose.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const current = purpose.data.current;
  return (
    <section className="vdn-v2-romantic" aria-labelledby="vdn-v2-purpose-title">
      <p className="vdn-v2-romantic__announcement" role="status" aria-live="polite">
        {feedback}
      </p>
      <V2Surface className="vdn-v2-romantic__hero" elevation="one">
        <HeartHandshake aria-hidden="true" />
        <div>
          <V2StatusBadge tone="brand">Contexto romântico privado</V2StatusBadge>
          <V2Heading id="vdn-v2-purpose-title" level={2} size="medium">
            Propósito Firmado
          </V2Heading>
          <V2Text tone="secondary">
            Um compromisso bilateral pausa somente a descoberta romântica. Sua vida comunitária
            continua completa.
          </V2Text>
        </div>
      </V2Surface>

      {!current ? (
        <V2Surface className="vdn-v2-romantic__section">
          <V2Heading level={3} size="small">
            Iniciar com intenção
          </V2Heading>
          {purpose.data.eligibleMatches.length === 0 ? (
            <V2Text tone="muted">
              Nenhum match elegível está disponível. O pedido só pode partir de um match ativo.
            </V2Text>
          ) : (
            <div className="vdn-v2-romantic__people">
              {purpose.data.eligibleMatches.map((match) => (
                <div key={match.matchId}>
                  <span aria-hidden="true">{match.partner.displayName.slice(0, 1)}</span>
                  <V2Text>{match.partner.displayName}</V2Text>
                  <V2Button
                    size="small"
                    loading={request.isPending}
                    onClick={() => request.mutate(match.matchId)}
                  >
                    Fazer pedido
                  </V2Button>
                </div>
              ))}
            </div>
          )}
        </V2Surface>
      ) : current.state === "requested" ? (
        <V2Surface className="vdn-v2-romantic__section">
          <V2StatusBadge tone="warning">Pedido pendente</V2StatusBadge>
          <V2Heading level={3} size="small">
            Propósito com {current.partner.displayName}
          </V2Heading>
          <V2Text tone="secondary">
            O pedido só se torna ativo após aceite explícito. Ações concorrentes são resolvidas no
            servidor.
          </V2Text>
          <div className="vdn-v2-romantic__actions">
            {current.requestedByMe ? (
              <V2Button
                variant="outline"
                onClick={() => transition.mutate({ id: current.id, action: "cancel" })}
              >
                Cancelar pedido
              </V2Button>
            ) : (
              <>
                <V2Button onClick={() => transition.mutate({ id: current.id, action: "accept" })}>
                  Aceitar Propósito
                </V2Button>
                <V2Button
                  variant="outline"
                  onClick={() => transition.mutate({ id: current.id, action: "reject" })}
                >
                  Recusar
                </V2Button>
              </>
            )}
          </div>
        </V2Surface>
      ) : current.state === "active" ? (
        <>
          <V2Surface className="vdn-v2-romantic__couple" elevation="one">
            <V2StatusBadge tone="success">Propósito ativo</V2StatusBadge>
            {current.partner.photoUrl ? (
              <img
                className="vdn-v2-romantic__couple-photo"
                src={current.partner.photoUrl}
                alt={`Foto de ${current.partner.displayName}`}
              />
            ) : null}
            <V2Heading level={3} size="medium">
              Você e {current.partner.displayName}
            </V2Heading>
            <div className="vdn-v2-romantic__stats">
              <span>
                <CalendarDays aria-hidden="true" />
                Desde{" "}
                {current.acceptedAt
                  ? new Date(current.acceptedAt).toLocaleDateString("pt-BR")
                  : "—"}
              </span>
              <span>
                <MessageCircle aria-hidden="true" />
                {purpose.data.messageCount} mensagens
              </span>
              <span>{purpose.data.capsuleCount} cápsulas preservadas</span>
            </div>
            <div className="vdn-v2-romantic__actions">
              <V2Button leadingIcon={<MessageCircle />} onClick={onOpenConversations}>
                Abrir conversa
              </V2Button>
              <V2Button variant="destructive" onClick={() => setConfirmation("end")}>
                Encerrar Propósito
              </V2Button>
            </div>
          </V2Surface>

          {confirmation === "end" ? (
            <V2Surface className="vdn-v2-romantic__warning" role="alert">
              <V2Heading level={3} size="small">
                Encerrar sem apagar o histórico?
              </V2Heading>
              <V2Text tone="secondary">
                Conversas, presentes, marcos e cápsulas permanecem. O Namoro não será reativado.
              </V2Text>
              <div className="vdn-v2-romantic__actions">
                <V2Button
                  variant="destructive"
                  loading={transition.isPending}
                  onClick={() => transition.mutate({ id: current.id, action: "end" })}
                >
                  Confirmar encerramento
                </V2Button>
                <V2Button variant="ghost" onClick={() => setConfirmation(null)}>
                  Voltar
                </V2Button>
              </div>
            </V2Surface>
          ) : null}

          <div className="vdn-v2-romantic__couple-grid">
            <V2Surface className="vdn-v2-romantic__section">
              <V2Heading level={3} size="small">
                <History aria-hidden="true" /> Linha do tempo
              </V2Heading>
              {purpose.data.timeline.length === 0 ? (
                <V2Text tone="muted">
                  Os próximos marcos serão registrados sem apagar as datas legadas.
                </V2Text>
              ) : (
                <ol className="vdn-v2-romantic__timeline">
                  {purpose.data.timeline.map((event) => (
                    <li key={event.id}>
                      <span aria-hidden="true" />
                      <div>
                        <V2Text>{event.type}</V2Text>
                        <V2Text variant="caption" tone="muted">
                          {event.actorIsMe ? "Ação sua" : "Ação da outra pessoa"} ·{" "}
                          {new Date(event.createdAt).toLocaleDateString("pt-BR")}
                        </V2Text>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </V2Surface>

            <V2Surface className="vdn-v2-romantic__section">
              <V2Heading level={3} size="small">
                <LockKeyhole aria-hidden="true" /> Cápsulas do casal
              </V2Heading>
              {purpose.data.capsules.length === 0 ? (
                <V2Text tone="muted">
                  Nenhuma cápsula existente. A criação continua no fluxo legado até sua migração.
                </V2Text>
              ) : (
                <ul className="vdn-v2-romantic__capsules">
                  {purpose.data.capsules.map((capsule) => (
                    <li key={capsule.id}>
                      <V2StatusBadge tone={capsule.locked ? "warning" : "success"}>
                        {capsule.locked ? "Protegida até a data" : "Disponível"}
                      </V2StatusBadge>
                      <V2Text>
                        {capsule.locked
                          ? `Abre em ${new Date(capsule.unlockAt).toLocaleDateString("pt-BR")}`
                          : capsule.message}
                      </V2Text>
                    </li>
                  ))}
                </ul>
              )}
            </V2Surface>
          </div>

          <V2Surface className="vdn-v2-romantic__section">
            <V2Heading level={3} size="small">
              <Gift aria-hidden="true" /> Presente no Propósito
            </V2Heading>
            <label>
              <span>Presente</span>
              <select value={giftId} onChange={(event) => setGiftId(event.currentTarget.value)}>
                <option value="">Escolha no catálogo real</option>
                {purpose.data.catalog.map((gift) => (
                  <option key={gift.id} value={gift.id}>
                    {gift.name} · {gift.price} moedas
                  </option>
                ))}
              </select>
            </label>
            <V2TextArea
              label="Mensagem opcional"
              value={giftMessage}
              maxLength={120}
              onChange={(event) => setGiftMessage(event.currentTarget.value)}
            />
            <V2Button
              leadingIcon={<Gift />}
              loading={sendGift.isPending}
              disabled={!giftId}
              onClick={() => sendGift.mutate()}
            >
              Enviar com cobrança atômica
            </V2Button>
            {purpose.data.gifts.length > 0 ? (
              <ul className="vdn-v2-romantic__gifts" aria-label="Presentes do Propósito">
                {purpose.data.gifts.map((gift) => (
                  <li key={gift.id}>
                    {gift.imageUrl ? (
                      <img src={gift.imageUrl} alt="" />
                    ) : (
                      <Gift aria-hidden="true" />
                    )}
                    <span>
                      <V2Text>{gift.name}</V2Text>
                      <V2Text variant="caption" tone="muted">
                        {gift.senderName ? `Enviado por ${gift.senderName}` : "Presente preservado"}
                      </V2Text>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </V2Surface>
        </>
      ) : (
        <V2Surface className="vdn-v2-romantic__section">
          <V2StatusBadge tone="neutral">Histórico preservado</V2StatusBadge>
          <V2Heading level={3} size="small">
            Propósito encerrado
          </V2Heading>
          <V2Text tone="secondary">
            Reativar o Modo Namoro é uma escolha posterior. A comunidade continua normalmente.
          </V2Text>
        </V2Surface>
      )}

      {purpose.data.history.length > 0 ? (
        <V2Surface className="vdn-v2-romantic__section">
          <V2Heading level={3} size="small">
            Histórico
          </V2Heading>
          <ul className="vdn-v2-romantic__history">
            {purpose.data.history.map((item) => (
              <li key={item.id}>
                <span>{item.partner.displayName}</span>
                <span className="vdn-v2-romantic__history-state">
                  <V2StatusBadge tone="neutral">{item.state}</V2StatusBadge>
                  {item.state !== "archived" ? (
                    <V2Button
                      size="small"
                      variant="ghost"
                      loading={transition.isPending}
                      onClick={() => transition.mutate({ id: item.id, action: "archive" })}
                    >
                      Arquivar
                    </V2Button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </V2Surface>
      ) : null}
    </section>
  );
}
