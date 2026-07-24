import { useQuery } from "@tanstack/react-query";
import { Gamepad2, History, ShieldCheck } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import { PET_ARCADE_MANIFEST, type PetArcadeGameId, type PetPlatformRepository } from "./contracts";

function titleFor(gameId: PetArcadeGameId) {
  return gameId
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export default function V2ArcadeCatalog({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: PetPlatformRepository;
}) {
  const arcade = useQuery({
    queryKey: ["v2", "pet-arcade", userId],
    queryFn: () => repository.loadArcade(userId),
    staleTime: 30_000,
  });

  if (arcade.isPending) {
    return (
      <V2Surface className="vdn-v2-pets__state" aria-live="polite">
        <V2LoadingIndicator label="Carregando catálogo de jogos" />
      </V2Surface>
    );
  }

  if (arcade.isError || !arcade.data) {
    return (
      <V2Surface className="vdn-v2-pets__state" role="alert">
        <Gamepad2 aria-hidden="true" />
        <V2Heading level={3} size="small">
          Arcade temporariamente indisponível
        </V2Heading>
        <V2Text tone="muted">Nenhum jogo, progresso ou recompensa foi alterado.</V2Text>
        <V2Button variant="secondary" onClick={() => void arcade.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const snapshot = arcade.data;
  return (
    <section className="vdn-v2-pets__arcade" aria-labelledby="vdn-v2-pet-arcade-title">
      <V2Surface className="vdn-v2-pets__notice" tone="subtle">
        <ShieldCheck aria-hidden="true" />
        <div>
          <V2Heading id="vdn-v2-pet-arcade-title" level={3} size="small">
            Arcade preservado
          </V2Heading>
          <V2Text tone="muted">
            Os 17 jogos, o progresso e as regras atuais continuam intactos até a decisão de produto.
            Novas rodadas permanecem server-authoritative.
          </V2Text>
        </div>
      </V2Surface>

      <div className="vdn-v2-pets__arcade-meta">
        <V2StatusBadge tone={snapshot.platformEnabled ? "success" : "warning"}>
          {snapshot.platformEnabled ? "Catálogo ativo" : "Catálogo em manutenção"}
        </V2StatusBadge>
        <V2Text variant="caption">Jogadas hoje: {snapshot.usageToday}</V2Text>
      </div>

      {snapshot.healthyPlayMessage ? (
        <V2Text tone="muted">{snapshot.healthyPlayMessage}</V2Text>
      ) : null}

      <div className="vdn-v2-pets__game-grid">
        {PET_ARCADE_MANIFEST.map((manifest) => {
          const server = snapshot.games.find((game) => game.gameType === manifest.id);
          return (
            <V2Surface key={manifest.id} as="article" elevation="one">
              <div className="vdn-v2-pets__game-title">
                <Gamepad2 aria-hidden="true" />
                <V2Heading level={4} size="small">
                  {server?.displayName || titleFor(manifest.id)}
                </V2Heading>
              </div>
              <V2Text tone="muted">
                {server?.description || "Experiência legada preservada para revisão individual."}
              </V2Text>
              <div className="vdn-v2-pets__game-meta">
                <V2StatusBadge tone={server?.enabled ? "success" : "neutral"}>
                  {server?.enabled ? "Disponível no legado" : "Estado preservado"}
                </V2StatusBadge>
                <V2Text variant="caption">{manifest.saveContract}</V2Text>
              </div>
            </V2Surface>
          );
        })}
      </div>

      <V2Surface className="vdn-v2-pets__history" tone="subtle">
        <div className="vdn-v2-pets__game-title">
          <History aria-hidden="true" />
          <V2Heading level={3} size="small">
            Histórico recente
          </V2Heading>
        </div>
        {snapshot.history.length ? (
          <ol>
            {snapshot.history.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <V2Text>{titleFor(entry.gameType)}</V2Text>
                <V2Text variant="caption" tone="muted">
                  {entry.status} · {entry.rewardCoins} moedas · {entry.xpReward} XP
                </V2Text>
              </li>
            ))}
          </ol>
        ) : (
          <V2Text tone="muted">Ainda não há rodadas recentes para exibir.</V2Text>
        )}
      </V2Surface>

      <V2Button asChild variant="outline">
        <a href="/pet-arcade">Abrir jogos preservados</a>
      </V2Button>
    </section>
  );
}
