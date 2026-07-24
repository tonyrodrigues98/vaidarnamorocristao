import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Captions,
  Clapperboard,
  MessageCircle,
  Radio,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import type { CinemaRepository, CinemaSession } from "./contracts";
import { V2CinemaPlayer } from "./V2CinemaPlayer";

function SessionCard({
  session,
  onSelect,
}: {
  readonly session: CinemaSession;
  readonly onSelect: () => void;
}) {
  return (
    <V2Surface as="article" className="vdn-v2-cinema__session" elevation="one">
      <div className="vdn-v2-cinema__session-art" aria-hidden="true">
        <Clapperboard />
      </div>
      <div>
        <V2StatusBadge tone={session.state === "live" ? "success" : "neutral"}>
          {session.state === "live" ? "Ao vivo" : "Agendada"}
        </V2StatusBadge>
        <V2Heading level={3} size="small">
          {session.title}
        </V2Heading>
        <V2Text tone="muted">
          {session.hostDisplayName} · {session.participantCount} participantes
        </V2Text>
      </div>
      <V2Button variant="secondary" onClick={onSelect}>
        {session.state === "live" ? "Entrar na sessão" : "Ver detalhes"}
      </V2Button>
    </V2Surface>
  );
}

export function V2CinemaHub({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: CinemaRepository;
}) {
  const [selected, setSelected] = useState<CinemaSession | null>(null);
  const queryKey = useMemo(() => ["v2", "cinema", "hub", userId] as const, [userId]);
  const hub = useQuery({
    queryKey,
    queryFn: () => repository.loadHub(userId),
    staleTime: 15_000,
  });

  if (hub.isPending) {
    return (
      <V2Surface className="vdn-v2-cinema__state" aria-live="polite">
        <V2LoadingIndicator label="Preparando a Sala de Cinema" />
      </V2Surface>
    );
  }

  if (hub.isError || !hub.data) {
    return (
      <V2Surface className="vdn-v2-cinema__state" role="alert">
        <Clapperboard aria-hidden="true" />
        <V2Heading level={2} size="small">
          Sala de Cinema temporariamente indisponível
        </V2Heading>
        <V2Text tone="muted">Nenhuma sessão ou mídia foi alterada.</V2Text>
        <V2Button variant="secondary" onClick={() => void hub.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  if (selected) {
    return (
      <V2CinemaPlayer
        session={selected}
        repository={repository}
        userId={userId}
        serverNow={hub.data.serverNow}
        onBack={() => setSelected(null)}
      />
    );
  }

  const sessions = [...hub.data.featured, ...hub.data.upcoming];
  return (
    <div className="vdn-v2-cinema" aria-labelledby="vdn-v2-cinema-title">
      <V2Surface className="vdn-v2-cinema__hero" elevation="one">
        <div>
          <V2Text variant="caption" tone="muted">
            Assistir Juntos
          </V2Text>
          <V2Heading id="vdn-v2-cinema-title" level={2} size="medium">
            Sala de Cinema
          </V2Heading>
          <V2Text tone="muted">
            Sessões sincronizadas, com anfitrião, participantes e conversa integrada.
          </V2Text>
        </div>
        <V2StatusBadge tone="warning">Gate jurídico fechado</V2StatusBadge>
      </V2Surface>

      <div className="vdn-v2-cinema__principles" aria-label="Garantias da experiência">
        <V2Surface elevation="one">
          <Radio aria-hidden="true" />
          <V2Text variant="label">Sincronização pelo servidor</V2Text>
          <V2Text tone="muted">Play, pause e seek usam sequência e relógio canônicos.</V2Text>
        </V2Surface>
        <V2Surface elevation="one">
          <MessageCircle aria-hidden="true" />
          <V2Text variant="label">Conversas compartilhadas</V2Text>
          <V2Text tone="muted">
            O chat reutiliza o núcleo de Conversas, sem sistema paralelo.
          </V2Text>
        </V2Surface>
        <V2Surface elevation="one">
          <ShieldCheck aria-hidden="true" />
          <V2Text variant="label">Mídia protegida</V2Text>
          <V2Text tone="muted">Upload e exibição pública continuam fechados sem aprovação.</V2Text>
        </V2Surface>
      </div>

      <section aria-labelledby="vdn-v2-cinema-sessions">
        <div className="vdn-v2-cinema__section-title">
          <div>
            <V2Heading id="vdn-v2-cinema-sessions" level={3} size="small">
              Sessões
            </V2Heading>
            <V2Text tone="muted">Eventos disponíveis para sua conta.</V2Text>
          </div>
          <V2Button variant="outline" disabled={!hub.data.gates.legalApprovalRecorded}>
            <CalendarClock aria-hidden="true" />
            Agendar
          </V2Button>
        </div>

        {sessions.length ? (
          <div className="vdn-v2-cinema__sessions">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onSelect={() => setSelected(session)}
              />
            ))}
          </div>
        ) : (
          <V2Surface className="vdn-v2-cinema__state">
            <UsersRound aria-hidden="true" />
            <V2Heading level={4} size="small">
              Nenhuma sessão disponível
            </V2Heading>
            <V2Text tone="muted">
              O catálogo ficará vazio até mídia, direitos, moderação e operação serem aprovados.
            </V2Text>
          </V2Surface>
        )}
      </section>

      <V2Surface className="vdn-v2-cinema__gate" elevation="one">
        <Captions aria-hidden="true" />
        <div>
          <V2Text variant="label">Acessibilidade antes da estreia</V2Text>
          <V2Text tone="muted">
            Legendas, compatibilidade iOS/PWA, retenção, takedown e orçamento precisam de validação
            antes do primeiro conteúdo público.
          </V2Text>
        </div>
      </V2Surface>
    </div>
  );
}
