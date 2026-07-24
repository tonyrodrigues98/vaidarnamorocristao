import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Compass, MapPin, UserPlus, UsersRound } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import type { CommunityHomeRepository, CommunityPerson, SocialRelationshipKind } from "./contracts";

function relationshipLabel(person: CommunityPerson) {
  switch (person.relationshipState) {
    case "connected":
      return "Conectados";
    case "following":
      return "Seguindo";
    case "request_sent":
      return "Solicitação enviada";
    default:
      return "Conhecer";
  }
}

export function V2PeopleDiscovery({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: CommunityHomeRepository;
}) {
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState("");
  const queryKey = ["v2", "community-people", userId] as const;
  const people = useQuery({
    queryKey,
    queryFn: () => repository.loadPeople(userId),
  });
  const relationship = useMutation({
    mutationFn: ({ targetUserId, kind }: { targetUserId: string; kind: SocialRelationshipKind }) =>
      repository.requestRelationship(userId, targetUserId, kind),
    onSuccess: async (state, variables) => {
      const person = people.data?.find((candidate) => candidate.id === variables.targetUserId);
      setAnnouncement(
        state === "request_sent"
          ? `Solicitação enviada para ${person?.name ?? "essa pessoa"}.`
          : `Vínculo atualizado com ${person?.name ?? "essa pessoa"}.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["v2", "community-home", userId] }),
      ]);
    },
    onError: () => setAnnouncement("Não foi possível atualizar esse vínculo agora."),
  });

  if (people.isPending) {
    return (
      <div className="vdn-v2-home-state">
        <V2LoadingIndicator visibleLabel label="Buscando pessoas da comunidade" />
      </div>
    );
  }
  if (people.isError) {
    return (
      <V2Surface className="vdn-v2-home-state" elevation="one">
        <V2Heading level={2} size="small">
          A descoberta não carregou
        </V2Heading>
        <V2Text tone="secondary">
          Bloqueios e preferências continuam protegidos. Tente novamente em instantes.
        </V2Text>
        <V2Button variant="secondary" onClick={() => void people.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  return (
    <section className="vdn-v2-people" aria-labelledby="vdn-v2-people-title">
      <div role="status" aria-live="polite" className="vdn-v2-home__announcement">
        {announcement}
      </div>
      <V2Surface className="vdn-v2-people__intro" elevation="one">
        <Compass aria-hidden="true" />
        <div>
          <V2Heading id="vdn-v2-people-title" level={2} size="medium">
            Descoberta comunitária
          </V2Heading>
          <V2Text tone="secondary">
            Conheça pessoas por convivência e fé. Disponibilidade romântica não participa desta
            seleção.
          </V2Text>
        </div>
      </V2Surface>

      {(people.data?.length ?? 0) === 0 ? (
        <V2Surface className="vdn-v2-home-empty" tone="subtle">
          <UsersRound aria-hidden="true" />
          <V2Heading level={3} size="small">
            Nenhuma sugestão disponível
          </V2Heading>
          <V2Text tone="secondary">
            Privacidade, bloqueios e vínculos existentes podem limitar as sugestões.
          </V2Text>
        </V2Surface>
      ) : (
        <div className="vdn-v2-people__grid">
          {people.data?.map((person) => {
            const busy =
              relationship.isPending && relationship.variables?.targetUserId === person.id;
            const disabled = person.relationshipState !== "none";
            return (
              <V2Surface
                key={person.id}
                as="article"
                className="vdn-v2-people-card"
                elevation="one"
              >
                <div className="vdn-v2-people-card__avatar" aria-hidden="true">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt="" />
                  ) : (
                    person.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <V2Heading level={3} size="small">
                    {person.name}
                  </V2Heading>
                  <V2Text variant="caption" tone="muted">
                    <MapPin aria-hidden="true" />
                    {[person.city, person.state].filter(Boolean).join(", ") || "Comunidade online"}
                  </V2Text>
                  {person.church && <V2StatusBadge tone="neutral">{person.church}</V2StatusBadge>}
                </div>
                <div className="vdn-v2-people-card__actions">
                  <V2Button
                    size="small"
                    variant="secondary"
                    disabled={disabled}
                    loading={busy && relationship.variables?.kind === "follow"}
                    onClick={() => relationship.mutate({ targetUserId: person.id, kind: "follow" })}
                  >
                    {person.relationshipState === "following" ? "Seguindo" : "Seguir"}
                  </V2Button>
                  <V2Button
                    size="small"
                    variant="outline"
                    leadingIcon={<UserPlus />}
                    disabled={disabled}
                    loading={busy && relationship.variables?.kind === "connection"}
                    onClick={() =>
                      relationship.mutate({ targetUserId: person.id, kind: "connection" })
                    }
                  >
                    {relationshipLabel(person)}
                  </V2Button>
                </div>
              </V2Surface>
            );
          })}
        </div>
      )}
    </section>
  );
}
