import { lazy, Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Coins, Gamepad2, Heart, PawPrint, ShieldCheck, Utensils } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import {
  createPetCommandKey,
  derivePetNeedAtServerTime,
  safePetAssetUrl,
  type PetCareItem,
  type PetPlatformRepository,
} from "./contracts";

const V2ArcadeCatalog = lazy(() => import("./V2ArcadeCatalog"));
type PetsTab = "care" | "arcade";

const CARE_LABELS: Readonly<Record<string, string>> = {
  feed: "Alimentação",
  play: "Diversão",
  hygiene: "Higiene",
  sleep: "Descanso",
  affection: "Carinho",
  energy: "Energia",
};

function createSecureKey() {
  return createPetCommandKey(() => {
    if (!globalThis.crypto?.randomUUID) throw new Error("secure_pet_command_key_unavailable");
    return globalThis.crypto.randomUUID();
  });
}

function CareItemButton({
  item,
  busy,
  onCare,
}: {
  readonly item: PetCareItem;
  readonly busy: boolean;
  readonly onCare: () => void;
}) {
  const reachedLimit = item.dailyUses > 0 && item.usesToday >= item.dailyUses;
  return (
    <V2Surface as="article" className="vdn-v2-pets__care-item" elevation="one">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" loading="lazy" />
      ) : (
        <Heart aria-hidden="true" />
      )}
      <div>
        <V2Heading level={4} size="small">
          {item.name}
        </V2Heading>
        <V2Text variant="caption" tone="muted">
          {item.description || CARE_LABELS[item.kind]} · +{item.restoreAmount}
        </V2Text>
        <V2Text variant="caption">
          <Coins aria-hidden="true" /> {item.costCoins} · usos {item.usesToday}
          {item.dailyUses > 0 ? `/${item.dailyUses}` : ""}
        </V2Text>
      </div>
      <V2Button
        size="small"
        loading={busy}
        disabled={reachedLimit}
        onClick={onCare}
        aria-label={`Usar ${item.name} com o pet`}
      >
        {reachedLimit ? "Limite diário" : "Cuidar"}
      </V2Button>
    </V2Surface>
  );
}

export function V2PetsHub({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: PetPlatformRepository;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<PetsTab>("care");
  const [activeItemId, setActiveItemId] = useState("");
  const [feedback, setFeedback] = useState("");
  const queryKey = useMemo(() => ["v2", "pet-platform", userId] as const, [userId]);
  const hub = useQuery({
    queryKey,
    queryFn: () => repository.loadHub(userId),
    staleTime: 15_000,
  });
  const care = useMutation({
    mutationFn: ({ petId, itemId }: { readonly petId: string; readonly itemId: string }) =>
      repository.applyCare(userId, petId, itemId, createSecureKey()),
    onSuccess: () => {
      setFeedback("Cuidado registrado com autoridade do servidor.");
      setActiveItemId("");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      setFeedback("Não foi possível aplicar o cuidado. Nenhum saldo ou estado foi alterado.");
      setActiveItemId("");
    },
  });

  if (hub.isPending) {
    return (
      <V2Surface className="vdn-v2-pets__state" aria-live="polite">
        <V2LoadingIndicator label="Sincronizando seu pet" />
      </V2Surface>
    );
  }

  if (hub.isError || !hub.data) {
    return (
      <V2Surface className="vdn-v2-pets__state" role="alert">
        <PawPrint aria-hidden="true" />
        <V2Heading level={2} size="small">
          Pet temporariamente indisponível
        </V2Heading>
        <V2Text tone="muted">Seu progresso e inventário permanecem preservados.</V2Text>
        <V2Button variant="secondary" onClick={() => void hub.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const snapshot = hub.data;
  const pet = snapshot.pet;
  const petImage = safePetAssetUrl(
    pet?.variant?.imageUrlAdult ??
      pet?.variant?.imageUrl ??
      pet?.species?.imageUrlAdult ??
      pet?.species?.imageUrl ??
      pet?.category.imageUrl,
  );

  return (
    <div className="vdn-v2-pets" aria-labelledby="vdn-v2-pets-title">
      <V2Surface className="vdn-v2-pets__hero" elevation="one">
        <div className="vdn-v2-pets__portrait" aria-hidden="true">
          {petImage ? <img src={petImage} alt="" /> : <PawPrint />}
        </div>
        <div>
          <V2Text variant="caption" tone="muted">
            Plataforma compartilhada
          </V2Text>
          <V2Heading id="vdn-v2-pets-title" level={2} size="medium">
            {pet?.customName || "Seu espaço de pets"}
          </V2Heading>
          <V2Text tone="muted">
            {pet
              ? `${pet.category.name} · ${pet.personality.name} · ${pet.lifeStage.name}`
              : "Escolha e personalize seu pet na experiência preservada."}
          </V2Text>
        </div>
        {pet ? (
          <V2StatusBadge tone={pet.isEquipped ? "success" : "neutral"}>
            {pet.isEquipped ? "Em destaque" : "Preservado"}
          </V2StatusBadge>
        ) : null}
      </V2Surface>

      <V2Surface className="vdn-v2-pets__notice" tone="subtle">
        <ShieldCheck aria-hidden="true" />
        <V2Text tone="muted">
          `user_pets` ({snapshot.preservedFamilies.userPetsCount}) e `user_pets_v2` (
          {snapshot.preservedFamilies.userPetsV2Count}) permanecem separados. Nenhuma consolidação
          ou exclusão automática é feita.
        </V2Text>
      </V2Surface>

      <div className="vdn-v2-pets__tabs" role="tablist" aria-label="Pets">
        <V2Button
          role="tab"
          size="small"
          variant={tab === "care" ? "secondary" : "ghost"}
          aria-selected={tab === "care"}
          leadingIcon={<Utensils />}
          onClick={() => setTab("care")}
        >
          Cuidados
        </V2Button>
        <V2Button
          role="tab"
          size="small"
          variant={tab === "arcade" ? "secondary" : "ghost"}
          aria-selected={tab === "arcade"}
          leadingIcon={<Gamepad2 />}
          onClick={() => setTab("arcade")}
        >
          Arcade
        </V2Button>
      </div>

      {tab === "care" ? (
        pet ? (
          <>
            <section
              className="vdn-v2-pets__needs"
              aria-label="Necessidades no horário do servidor"
            >
              {snapshot.careState.map((state) => {
                const value = derivePetNeedAtServerTime(
                  state,
                  snapshot.careConfig,
                  snapshot.serverNow,
                );
                return (
                  <V2Surface key={state.kind} as="article" padding="small">
                    <div>
                      <V2Text variant="label">{CARE_LABELS[state.kind] || state.kind}</V2Text>
                      <V2Text variant="caption" tone="muted">
                        calculado no servidor
                      </V2Text>
                    </div>
                    <strong>{value}%</strong>
                    <progress
                      value={value}
                      max={100}
                      aria-label={CARE_LABELS[state.kind] || state.kind}
                    />
                  </V2Surface>
                );
              })}
            </section>
            <section className="vdn-v2-pets__care-grid" aria-label="Itens compatíveis">
              {snapshot.careItems.map((item) => (
                <CareItemButton
                  key={item.id}
                  item={item}
                  busy={care.isPending && activeItemId === item.id}
                  onCare={() => {
                    setFeedback("");
                    setActiveItemId(item.id);
                    care.mutate({ petId: pet.id, itemId: item.id });
                  }}
                />
              ))}
            </section>
            <V2Surface className="vdn-v2-pets__history" tone="subtle">
              <div className="vdn-v2-pets__game-title">
                <Clock3 aria-hidden="true" />
                <V2Heading level={3} size="small">
                  Cuidados recentes
                </V2Heading>
              </div>
              {snapshot.careHistory.length ? (
                <ol>
                  {snapshot.careHistory.slice(0, 5).map((entry) => (
                    <li key={entry.id}>
                      <V2Text>{CARE_LABELS[entry.kind] || entry.kind}</V2Text>
                      <V2Text variant="caption" tone="muted">
                        +{entry.delta} · {entry.costCoins} moedas
                      </V2Text>
                    </li>
                  ))}
                </ol>
              ) : (
                <V2Text tone="muted">Nenhum cuidado recente registrado.</V2Text>
              )}
            </V2Surface>
          </>
        ) : (
          <V2Surface className="vdn-v2-pets__state">
            <PawPrint aria-hidden="true" />
            <V2Heading level={3} size="small">
              Nenhum pet V2 selecionado
            </V2Heading>
            <V2Text tone="muted">
              A escolha atual continua no fluxo legado até a migração possuir reconciliação e
              rollback comprovados.
            </V2Text>
            <V2Button asChild variant="outline">
              <a href="/meu-pet">Abrir experiência preservada</a>
            </V2Button>
          </V2Surface>
        )
      ) : (
        <Suspense
          fallback={
            <V2Surface className="vdn-v2-pets__state" aria-live="polite">
              <V2LoadingIndicator label="Preparando o arcade" />
            </V2Surface>
          }
        >
          <V2ArcadeCatalog userId={userId} repository={repository} />
        </Suspense>
      )}

      {feedback ? (
        <p className="vdn-v2-pets__feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
