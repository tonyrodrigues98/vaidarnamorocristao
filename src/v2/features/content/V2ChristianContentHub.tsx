import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookHeart, BookOpen, Brain, HeartHandshake, Newspaper } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import type { ChristianContentRepository } from "./contracts";

const V2VerboReader = lazy(() => import("./V2VerboReader"));
type ContentTab = "today" | "verbo" | "prayer" | "challenges";

export function V2ChristianContentHub({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: ChristianContentRepository;
}) {
  const [tab, setTab] = useState<ContentTab>("today");
  const queryKey = useMemo(() => ["v2", "christian-content", userId] as const, [userId]);
  const hub = useQuery({
    queryKey,
    queryFn: () => repository.loadHub(userId),
    staleTime: 30_000,
  });

  if (hub.isPending) {
    return (
      <V2Surface className="vdn-v2-content__state" aria-live="polite">
        <V2LoadingIndicator label="Carregando conteúdo cristão" />
      </V2Surface>
    );
  }
  if (hub.isError || !hub.data) {
    return (
      <V2Surface className="vdn-v2-content__state" role="alert">
        <BookOpen aria-hidden="true" />
        <V2Heading level={2} size="small">
          Conteúdo temporariamente indisponível
        </V2Heading>
        <V2Text tone="muted">Suas anotações e progresso permanecem privados e intactos.</V2Text>
        <V2Button variant="secondary" onClick={() => void hub.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const snapshot = hub.data;
  return (
    <div className="vdn-v2-content" aria-labelledby="vdn-v2-content-title">
      <V2Surface className="vdn-v2-content__hero" elevation="one">
        <BookHeart aria-hidden="true" />
        <div>
          <V2Text variant="caption" tone="muted">
            Fé, conteúdo e estudo
          </V2Text>
          <V2Heading id="vdn-v2-content-title" level={2} size="medium">
            Verbo
          </V2Heading>
          <V2Text tone="muted">
            Bíblia, estudo e conteúdo cristão com referências visíveis e privacidade por padrão.
          </V2Text>
        </div>
        <V2StatusBadge tone="neutral">Sem ranking espiritual</V2StatusBadge>
      </V2Surface>

      <div className="vdn-v2-content__tabs" role="tablist" aria-label="Conteúdo cristão">
        {(
          [
            ["today", "Hoje", <Newspaper key="today" />],
            ["verbo", "Bíblia", <BookOpen key="verbo" />],
            ["prayer", "Oração", <HeartHandshake key="prayer" />],
            ["challenges", "Desafios", <Brain key="challenges" />],
          ] as const
        ).map(([value, label, icon]) => (
          <V2Button
            key={value}
            role="tab"
            size="small"
            variant={tab === value ? "secondary" : "ghost"}
            aria-selected={tab === value}
            leadingIcon={icon}
            onClick={() => setTab(value)}
          >
            {label}
          </V2Button>
        ))}
      </div>

      {tab === "today" ? (
        <section className="vdn-v2-content__devotionals" aria-label="Devocionais publicados">
          {snapshot.devotionals.length ? (
            snapshot.devotionals.map((post) => (
              <V2Surface key={post.id} as="article" elevation="one">
                <V2Text variant="caption" tone="muted">
                  {post.bibleReference || "Reflexão"}
                </V2Text>
                <V2Heading level={3} size="small">
                  {post.title}
                </V2Heading>
                {post.bibleText ? <blockquote>{post.bibleText}</blockquote> : null}
                <V2Text>{post.content}</V2Text>
              </V2Surface>
            ))
          ) : (
            <V2Surface className="vdn-v2-content__state">
              <V2Text tone="muted">Nenhum devocional publicado agora.</V2Text>
            </V2Surface>
          )}
        </section>
      ) : null}

      {tab === "verbo" ? (
        <Suspense
          fallback={
            <V2Surface className="vdn-v2-content__state">
              <V2LoadingIndicator label="Preparando o Verbo" />
            </V2Surface>
          }
        >
          <V2VerboReader
            userId={userId}
            versions={snapshot.versions}
            notes={snapshot.notes}
            bookmarks={snapshot.bookmarkPassageIds}
            repository={repository}
          />
        </Suspense>
      ) : null}

      {tab === "prayer" ? (
        <V2Surface className="vdn-v2-content__state">
          <HeartHandshake aria-hidden="true" />
          <V2Heading level={3} size="small">
            Pedidos de oração preservados
          </V2Heading>
          <V2Text tone="muted">
            Moderação, anonimato e histórico continuam na experiência atual.
          </V2Text>
          <V2Button asChild variant="outline">
            <a href="/oracoes">Abrir pedidos de oração</a>
          </V2Button>
        </V2Surface>
      ) : null}

      {tab === "challenges" ? (
        <V2Surface className="vdn-v2-content__state">
          <Brain aria-hidden="true" />
          <V2Heading level={3} size="small">
            Aprender sem competir pela fé
          </V2Heading>
          <V2Text tone="muted">
            O quiz atual permanece disponível. Desafios V2 dependerão de conteúdo revisado, com
            explicação e progresso privado.
          </V2Text>
          <V2Button asChild variant="outline">
            <a href="/quiz-biblico">Abrir quiz preservado</a>
          </V2Button>
        </V2Surface>
      ) : null}
    </div>
  );
}
