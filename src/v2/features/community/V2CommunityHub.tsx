import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Clock3,
  LockKeyhole,
  MessageCircle,
  Radio,
  Send,
  UserPlus,
  UsersRound,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextField,
} from "@/v2/design-system";
import {
  formatCommunityEventTime,
  type CommunityHubRepository,
  type CommunityMembershipState,
  type CommunitySpaceSummary,
} from "./contracts";

const EMPTY_COPY = "Ainda não há atividade para mostrar. Volte em breve.";

function membershipCopy(state: CommunityMembershipState): string {
  switch (state) {
    case "active":
      return "Participando";
    case "muted":
      return "Silenciado";
    case "banned":
      return "Acesso suspenso";
    case "requested":
      return "Solicitação enviada";
    case "invited":
      return "Convite recebido";
    default:
      return "Participar";
  }
}

function SpaceCard({
  space,
  busy,
  onJoin,
  onLeave,
}: {
  readonly space: CommunitySpaceSummary;
  readonly busy: boolean;
  readonly onJoin: () => void;
  readonly onLeave: () => void;
}) {
  const active = space.membershipState === "active" || space.membershipState === "muted";
  return (
    <V2Surface as="article" elevation="one" className="vdn-v2-community-card">
      <div className="vdn-v2-community-card__heading">
        <div className="vdn-v2-community-card__icon" aria-hidden="true">
          {space.visibility === "private" ? <LockKeyhole /> : <UsersRound />}
        </div>
        <div>
          <V2Heading level={3} size="small">
            {space.name}
          </V2Heading>
          <V2Text tone="muted">{space.description}</V2Text>
        </div>
      </div>
      <div className="vdn-v2-community-card__meta">
        <V2StatusBadge tone={space.visibility === "public" ? "success" : "neutral"}>
          {space.visibility === "public"
            ? "Público"
            : space.visibility === "approval"
              ? "Com aprovação"
              : "Privado"}
        </V2StatusBadge>
        <V2Text variant="caption">{space.memberCount} membros</V2Text>
      </div>
      <V2Button
        variant={active ? "ghost" : "secondary"}
        size="small"
        loading={busy}
        disabled={space.membershipState === "banned" || space.membershipState === "requested"}
        onClick={active ? onLeave : onJoin}
        leadingIcon={active ? <Check /> : <UserPlus />}
      >
        {active ? "Sair do espaço" : membershipCopy(space.membershipState)}
      </V2Button>
    </V2Surface>
  );
}

export function V2CommunityHub({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: CommunityHubRepository;
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const queryKey = useMemo(() => ["v2", "community-hub", userId] as const, [userId]);
  const hub = useQuery({
    queryKey,
    queryFn: () => repository.loadHub(userId),
    staleTime: 20_000,
  });

  useEffect(() => {
    return repository.subscribeToGlobalMessages(() => {
      void queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient, queryKey, repository]);

  const membership = useMutation({
    mutationFn: async ({
      space,
      action,
    }: {
      space: CommunitySpaceSummary;
      action: "join" | "leave";
    }) => {
      if (action === "leave") return repository.leaveSpace(userId, space.id);
      return repository.requestMembership(userId, space.id);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error) => setFeedback(error instanceof Error ? error.message : "Ação indisponível."),
  });

  const attendance = useMutation({
    mutationFn: ({ eventId, attending }: { eventId: string; attending: boolean }) =>
      repository.attendEvent(userId, eventId, attending),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error) => setFeedback(error instanceof Error ? error.message : "Ação indisponível."),
  });

  const send = useMutation({
    mutationFn: () => repository.sendGlobalMessage(userId, message),
    onSuccess: () => {
      setMessage("");
      setFeedback("Mensagem enviada para o chat da comunidade.");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "Não foi possível enviar."),
  });

  if (hub.isPending) {
    return (
      <V2Surface className="vdn-v2-community-state" aria-live="polite">
        <V2LoadingIndicator label="Carregando Comunidade" />
      </V2Surface>
    );
  }

  if (hub.isError) {
    return (
      <V2Surface className="vdn-v2-community-state" role="alert">
        <V2Heading level={2} size="small">
          A Comunidade está temporariamente indisponível
        </V2Heading>
        <V2Text tone="muted">Nenhum dado foi alterado. Tente novamente em instantes.</V2Text>
        <V2Button variant="secondary" onClick={() => void hub.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const snapshot = hub.data;
  return (
    <div className="vdn-v2-community-hub">
      <section aria-labelledby="community-spaces-title">
        <div className="vdn-v2-community-section-heading">
          <div>
            <V2Heading id="community-spaces-title" level={2} size="medium">
              Espaços para caminhar junto
            </V2Heading>
            <V2Text tone="muted">
              Grupos comunitários independentes da sua participação no Namoro.
            </V2Text>
          </div>
          <V2StatusBadge tone="info">{snapshot.spaces.length} espaços</V2StatusBadge>
        </div>
        {snapshot.spaces.length ? (
          <div className="vdn-v2-community-grid">
            {snapshot.spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                busy={membership.isPending && membership.variables?.space.id === space.id}
                onJoin={() => membership.mutate({ space, action: "join" })}
                onLeave={() => membership.mutate({ space, action: "leave" })}
              />
            ))}
          </div>
        ) : (
          <V2Surface className="vdn-v2-community-state">
            <V2Text>{EMPTY_COPY}</V2Text>
          </V2Surface>
        )}
      </section>

      <section aria-labelledby="community-events-title">
        <div className="vdn-v2-community-section-heading">
          <div>
            <V2Heading id="community-events-title" level={2} size="medium">
              Próximos encontros
            </V2Heading>
            <V2Text tone="muted">Horários apresentados no fuso definido pelo evento.</V2Text>
          </div>
          <CalendarDays aria-hidden="true" />
        </div>
        <div className="vdn-v2-community-events">
          {snapshot.events.map((event) => (
            <V2Surface key={event.id} as="article" className="vdn-v2-community-event">
              <div>
                <V2Heading level={3} size="small">
                  {event.title}
                </V2Heading>
                <V2Text tone="muted">{event.description}</V2Text>
                <span className="vdn-v2-community-event__time">
                  <Clock3 aria-hidden="true" />
                  {formatCommunityEventTime(event.startsAt, event.timezone)}
                </span>
              </div>
              <V2Button
                size="small"
                variant={event.attending ? "outline" : "secondary"}
                loading={attendance.isPending && attendance.variables?.eventId === event.id}
                disabled={event.status !== "scheduled"}
                onClick={() =>
                  attendance.mutate({ eventId: event.id, attending: !event.attending })
                }
              >
                {event.attending ? "Cancelar presença" : "Quero participar"}
              </V2Button>
            </V2Surface>
          ))}
          {snapshot.events.length === 0 ? (
            <V2Surface className="vdn-v2-community-state">
              <V2Text>{EMPTY_COPY}</V2Text>
            </V2Surface>
          ) : null}
        </div>
      </section>

      <div className="vdn-v2-community-columns">
        <section aria-labelledby="community-chat-title">
          <div className="vdn-v2-community-section-heading">
            <div>
              <V2Heading id="community-chat-title" level={2} size="medium">
                Conversa da comunidade
              </V2Heading>
              <V2Text tone="muted">O mesmo histórico de chat global, integrado ao novo hub.</V2Text>
            </div>
            <MessageCircle aria-hidden="true" />
          </div>
          <V2Surface className="vdn-v2-community-chat">
            <ol className="vdn-v2-community-chat__list" aria-live="polite">
              {snapshot.messages.map((item) => (
                <li key={item.id}>
                  <div className="vdn-v2-community-avatar" aria-hidden="true">
                    {item.senderPhotoUrl ? (
                      <img src={item.senderPhotoUrl} alt="" />
                    ) : (
                      item.senderName.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div>
                    <strong>{item.senderName}</strong>
                    {item.pinned ? <V2StatusBadge tone="info">Fixada</V2StatusBadge> : null}
                    <p>{item.content}</p>
                  </div>
                </li>
              ))}
            </ol>
            <form
              className="vdn-v2-community-chat__composer"
              onSubmit={(event) => {
                event.preventDefault();
                send.mutate();
              }}
            >
              <V2TextField
                label="Mensagem para a comunidade"
                value={message}
                maxLength={1000}
                autoComplete="off"
                onChange={(event) => setMessage(event.currentTarget.value)}
              />
              <V2Button
                type="submit"
                loading={send.isPending}
                disabled={!message.trim()}
                leadingIcon={<Send />}
              >
                Enviar
              </V2Button>
            </form>
          </V2Surface>
        </section>

        <aside aria-labelledby="community-presence-title">
          <div className="vdn-v2-community-section-heading">
            <div>
              <V2Heading id="community-presence-title" level={2} size="medium">
                Presença
              </V2Heading>
              <V2Text tone="muted">Somente sinais recentes permitidos pela privacidade.</V2Text>
            </div>
            <Radio aria-hidden="true" />
          </div>
          <V2Surface className="vdn-v2-community-presence">
            <ul>
              {snapshot.presence.map((person) => (
                <li key={person.userId}>
                  <span
                    className={`vdn-v2-community-presence__dot vdn-v2-community-presence__dot--${person.state}`}
                    aria-hidden="true"
                  />
                  <span>{person.name}</span>
                  <V2StatusBadge tone={person.state === "online" ? "success" : "neutral"}>
                    {person.state === "online" ? "Online" : "Recente"}
                  </V2StatusBadge>
                </li>
              ))}
            </ul>
            {snapshot.presence.length === 0 ? (
              <V2Text tone="muted">Nenhuma presença pública neste momento.</V2Text>
            ) : null}
          </V2Surface>
        </aside>
      </div>

      {feedback ? (
        <p className="vdn-v2-community-feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
