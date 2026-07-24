import { useMemo, useState } from "react";
import { MessageCircle, Pause, Play, RotateCw, UsersRound } from "lucide-react";
import { V2Button, V2Heading, V2StatusBadge, V2Surface, V2Text } from "@/v2/design-system";
import {
  canControlCinema,
  decideDriftCorrection,
  estimateCanonicalPosition,
  type CinemaRepository,
  type CinemaSession,
} from "./contracts";

function formatPosition(positionMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(positionMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function V2CinemaPlayer({
  session,
  repository: _repository,
  userId: _userId,
  serverNow,
  onBack,
}: {
  readonly session: CinemaSession;
  readonly repository: CinemaRepository;
  readonly userId: string;
  readonly serverNow: string;
  readonly onBack: () => void;
}) {
  const [panel, setPanel] = useState<"chat" | "participants">("chat");
  const canonicalPosition = useMemo(
    () => estimateCanonicalPosition(session.playback, serverNow),
    [serverNow, session.playback],
  );
  const drift = decideDriftCorrection(canonicalPosition, canonicalPosition);
  const mayControl = canControlCinema(session.viewerRole, "play");

  return (
    <section className="vdn-v2-cinema-player" aria-labelledby="vdn-v2-cinema-player-title">
      <div className="vdn-v2-cinema-player__toolbar">
        <V2Button variant="ghost" onClick={onBack}>
          Voltar ao catálogo
        </V2Button>
        <V2StatusBadge tone={session.state === "live" ? "success" : "neutral"}>
          {session.state === "live" ? "Ao vivo" : session.state}
        </V2StatusBadge>
      </div>

      <div className="vdn-v2-cinema-player__layout">
        <div className="vdn-v2-cinema-player__main">
          <V2Surface className="vdn-v2-cinema-player__screen" elevation="two">
            <ClapperboardPlaceholder title={session.media.title} />
            <div className="vdn-v2-cinema-player__controls">
              <V2Button
                variant="secondary"
                disabled={!mayControl}
                aria-label={session.playback.playing ? "Pausar sessão" : "Reproduzir sessão"}
              >
                {session.playback.playing ? (
                  <Pause aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
                {session.playback.playing ? "Pausar" : "Reproduzir"}
              </V2Button>
              <V2Text>
                {formatPosition(canonicalPosition)} / {formatPosition(session.media.durationMs)}
              </V2Text>
              <V2Button variant="ghost" disabled={drift.kind === "none"}>
                <RotateCw aria-hidden="true" />
                Sincronizar novamente
              </V2Button>
            </div>
          </V2Surface>
          <div>
            <V2Heading id="vdn-v2-cinema-player-title" level={2} size="small">
              {session.title}
            </V2Heading>
            <V2Text tone="muted">
              Controle: {session.viewerRole}. O vídeo só é liberado por URL assinada no servidor.
            </V2Text>
          </div>
        </div>

        <V2Surface className="vdn-v2-cinema-player__rail" elevation="one">
          <div role="tablist" aria-label="Painel da sessão">
            <V2Button
              role="tab"
              variant={panel === "chat" ? "secondary" : "ghost"}
              aria-selected={panel === "chat"}
              onClick={() => setPanel("chat")}
            >
              <MessageCircle aria-hidden="true" />
              Conversa
            </V2Button>
            <V2Button
              role="tab"
              variant={panel === "participants" ? "secondary" : "ghost"}
              aria-selected={panel === "participants"}
              onClick={() => setPanel("participants")}
            >
              <UsersRound aria-hidden="true" />
              Pessoas
            </V2Button>
          </div>
          <div className="vdn-v2-cinema-player__empty">
            <V2Text tone="muted">
              {panel === "chat"
                ? "A conversa será aberta pelo núcleo de Conversas quando a sessão tiver um thread."
                : `${session.participantCount} participantes conectados. Dados pessoais não são expostos aqui.`}
            </V2Text>
          </div>
        </V2Surface>
      </div>
    </section>
  );
}

function ClapperboardPlaceholder({ title }: { readonly title: string }) {
  return (
    <div className="vdn-v2-cinema-player__placeholder" role="img" aria-label={title}>
      <Play aria-hidden="true" />
      <V2Text tone="inverse">Mídia protegida aguardando URL assinada</V2Text>
    </div>
  );
}
