import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { Archive, CheckCheck, MessageCircle, Pin, Send, VolumeX } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextArea,
  V2TextField,
} from "@/v2/design-system";
import {
  createOptimisticMessage,
  readConversationDraft,
  reconcileConversationMessages,
  writeConversationDraft,
  type ConversationCursor,
  type ConversationMessagePage,
  type ConversationRepository,
  type ConversationThreadSummary,
  type DraftStorage,
} from "./contracts";

function createClientMessageId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function contextLabel(thread: ConversationThreadSummary): string {
  switch (thread.context) {
    case "romantic":
      return "Namoro";
    case "purpose":
      return "Propósito";
    case "space":
      return "Espaço";
    case "global":
      return "Comunidade";
    case "cinema":
      return "Cinema";
    default:
      return thread.state === "request" ? "Solicitação" : "Social";
  }
}

export function V2Conversations({
  userId,
  repository,
  storage = typeof window === "undefined" ? null : window.localStorage,
}: {
  readonly userId: string;
  readonly repository: ConversationRepository;
  readonly storage?: DraftStorage | null;
}) {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [failedSend, setFailedSend] = useState<{
    readonly clientMessageId: string;
    readonly content: string;
  } | null>(null);
  const lastReadRef = useRef<string | null>(null);
  const inboxKey = useMemo(() => ["v2", "inbox", userId] as const, [userId]);
  const inbox = useQuery({
    queryKey: inboxKey,
    queryFn: () => repository.loadInbox(userId),
    staleTime: 15_000,
  });
  const visibleThreads = useMemo(() => {
    const search = filter.trim().toLocaleLowerCase("pt-BR");
    const threads = inbox.data ?? [];
    return search
      ? threads.filter(
          (thread) =>
            thread.title.toLocaleLowerCase("pt-BR").includes(search) ||
            thread.preview.toLocaleLowerCase("pt-BR").includes(search),
        )
      : threads;
  }, [filter, inbox.data]);
  const selected =
    visibleThreads.find((thread) => thread.key === selectedKey) ??
    inbox.data?.find((thread) => thread.key === selectedKey) ??
    null;
  const messagesKey = useMemo(
    () => ["v2", "conversation", userId, selectedKey] as const,
    [selectedKey, userId],
  );
  const messages = useInfiniteQuery({
    queryKey: messagesKey,
    queryFn: ({ pageParam }) => repository.loadMessages(userId, selectedKey!, pageParam),
    enabled: !!selectedKey && selected?.state !== "request",
    initialPageParam: null as ConversationCursor | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 10_000,
  });
  const renderedMessages = useMemo(
    () =>
      reconcileConversationMessages([], messages.data?.pages.flatMap((page) => page.items) ?? []),
    [messages.data],
  );

  useEffect(() => {
    if (!selectedKey) return;
    lastReadRef.current = null;
    setDraft(readConversationDraft(storage, userId, selectedKey));
    return repository.subscribe(selectedKey, () => {
      void queryClient.invalidateQueries({ queryKey: messagesKey });
      void queryClient.invalidateQueries({ queryKey: inboxKey });
    });
  }, [inboxKey, messagesKey, queryClient, repository, selectedKey, storage, userId]);

  const latestPersistedMessage = [...renderedMessages]
    .reverse()
    .find((message) => !message.optimistic);
  useEffect(() => {
    if (!selectedKey || !latestPersistedMessage) return;
    const cursorKey = `${selectedKey}:${latestPersistedMessage.createdAt}:${latestPersistedMessage.id}`;
    if (lastReadRef.current === cursorKey) return;
    lastReadRef.current = cursorKey;
    void repository
      .markRead(userId, selectedKey, {
        createdAt: latestPersistedMessage.createdAt,
        id: latestPersistedMessage.id,
      })
      .then(() => queryClient.invalidateQueries({ queryKey: inboxKey }))
      .catch(() => {
        lastReadRef.current = null;
      });
  }, [inboxKey, latestPersistedMessage, queryClient, repository, selectedKey, userId]);

  const send = useMutation({
    mutationFn: async ({
      clientMessageId,
      content,
    }: {
      clientMessageId: string;
      content: string;
    }) => repository.sendMessage(userId, selectedKey!, clientMessageId, content),
    onMutate: async ({ clientMessageId, content }) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ConversationMessagePage, ConversationCursor | null>>(
          messagesKey,
        );
      const optimistic = createOptimisticMessage({
        userId,
        threadKey: selectedKey!,
        clientMessageId,
        content,
      });
      queryClient.setQueryData<InfiniteData<ConversationMessagePage, ConversationCursor | null>>(
        messagesKey,
        (data) => {
          const firstPage = data?.pages[0] ?? {
            items: [],
            nextCursor: null,
            hasMore: false,
          };
          return {
            pageParams: data?.pageParams ?? [null],
            pages: [
              {
                ...firstPage,
                items: reconcileConversationMessages(firstPage.items, [optimistic]),
              },
              ...(data?.pages.slice(1) ?? []),
            ],
          };
        },
      );
      return { previous };
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<InfiniteData<ConversationMessagePage, ConversationCursor | null>>(
        messagesKey,
        (data) => {
          if (!data) return data;
          return {
            ...data,
            pages: data.pages.map((page, index) =>
              index === 0
                ? { ...page, items: reconcileConversationMessages(page.items, [saved]) }
                : page,
            ),
          };
        },
      );
      setFailedSend(null);
      setFeedback("");
      setDraft("");
      writeConversationDraft(storage, userId, selectedKey!, "");
      void queryClient.invalidateQueries({ queryKey: inboxKey });
    },
    onError: (error, variables, context) => {
      if (context?.previous) queryClient.setQueryData(messagesKey, context.previous);
      setFailedSend(variables);
      setFeedback(error instanceof Error ? error.message : "Não foi possível enviar.");
    },
  });

  const preference = useMutation({
    mutationFn: ({ name, enabled }: { name: "muted" | "pinned" | "archived"; enabled: boolean }) =>
      repository.updateThreadPreference(userId, selectedKey!, name, enabled),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: inboxKey }),
    onError: () => setFeedback("Não foi possível atualizar a conversa."),
  });

  const requestResponse = useMutation({
    mutationFn: (accept: boolean) => repository.respondToRequest(userId, selectedKey!, accept),
    onSuccess: () => {
      setFeedback("Solicitação atualizada.");
      setSelectedKey(null);
      void queryClient.invalidateQueries({ queryKey: inboxKey });
    },
    onError: () => setFeedback("Não foi possível responder à solicitação."),
  });

  if (inbox.isPending) {
    return (
      <V2Surface className="vdn-v2-conversations-state">
        <V2LoadingIndicator label="Carregando conversas" />
      </V2Surface>
    );
  }
  if (inbox.isError) {
    return (
      <V2Surface className="vdn-v2-conversations-state" role="alert">
        <V2Heading level={2} size="small">
          Conversas indisponíveis
        </V2Heading>
        <V2Text tone="muted">Seu histórico não foi alterado.</V2Text>
        <V2Button variant="secondary" onClick={() => void inbox.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  return (
    <div className="vdn-v2-conversations">
      <section
        className={`vdn-v2-conversations__inbox ${selected ? "vdn-v2-conversations__inbox--thread-open" : ""}`}
        aria-labelledby="conversation-inbox-title"
      >
        <V2Heading id="conversation-inbox-title" level={2} size="medium">
          Suas conversas
        </V2Heading>
        <V2TextField
          label="Buscar conversas"
          value={filter}
          onChange={(event) => setFilter(event.currentTarget.value)}
        />
        <ol className="vdn-v2-conversations__list">
          {visibleThreads.map((thread) => (
            <li key={thread.key}>
              <button
                type="button"
                className="vdn-v2-conversations__thread-button"
                aria-current={selected?.key === thread.key ? "page" : undefined}
                onClick={() => setSelectedKey(thread.key)}
              >
                <span className="vdn-v2-conversations__avatar" aria-hidden="true">
                  {thread.avatarUrl ? <img src={thread.avatarUrl} alt="" /> : <MessageCircle />}
                </span>
                <span className="vdn-v2-conversations__thread-copy">
                  <span>
                    <strong>{thread.title}</strong>
                    <small>{contextLabel(thread)}</small>
                  </span>
                  <span>{thread.preview || "Comece uma conversa"}</span>
                </span>
                {thread.unreadCount ? (
                  <V2StatusBadge tone="brand">{thread.unreadCount}</V2StatusBadge>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
        {visibleThreads.length === 0 ? (
          <V2Text tone="muted">Nenhuma conversa corresponde à busca.</V2Text>
        ) : null}
      </section>

      <section
        className={`vdn-v2-conversations__thread ${selected ? "vdn-v2-conversations__thread--open" : ""}`}
        aria-labelledby="conversation-thread-title"
      >
        {selected ? (
          <>
            <header className="vdn-v2-conversations__thread-header">
              <div>
                <V2Button
                  variant="ghost"
                  size="small"
                  className="vdn-v2-conversations__back"
                  onClick={() => setSelectedKey(null)}
                >
                  Voltar
                </V2Button>
                <V2Heading id="conversation-thread-title" level={2} size="small">
                  {selected.title}
                </V2Heading>
                <V2Text variant="caption" tone="muted">
                  {contextLabel(selected)}
                </V2Text>
              </div>
              <div className="vdn-v2-conversations__actions" aria-label="Ações da conversa">
                <V2Button
                  variant="ghost"
                  size="small"
                  leadingIcon={<Pin />}
                  onClick={() => preference.mutate({ name: "pinned", enabled: !selected.pinned })}
                >
                  {selected.pinned ? "Desafixar" : "Fixar"}
                </V2Button>
                <V2Button
                  variant="ghost"
                  size="small"
                  leadingIcon={<VolumeX />}
                  onClick={() => preference.mutate({ name: "muted", enabled: !selected.muted })}
                >
                  {selected.muted ? "Reativar som" : "Silenciar"}
                </V2Button>
                <V2Button
                  variant="ghost"
                  size="small"
                  leadingIcon={<Archive />}
                  onClick={() => preference.mutate({ name: "archived", enabled: true })}
                >
                  Arquivar
                </V2Button>
              </div>
            </header>
            {selected.state === "request" ? (
              <V2Surface className="vdn-v2-conversations-state">
                <V2Heading level={3} size="small">
                  {selected.requestDirection === "incoming"
                    ? "Solicitação de conversa"
                    : "Aguardando resposta"}
                </V2Heading>
                <V2Text tone="muted">
                  {selected.requestDirection === "incoming"
                    ? "Aceite somente se quiser iniciar esta conversa social."
                    : "As mensagens serão liberadas quando a outra pessoa aceitar."}
                </V2Text>
                {selected.requestDirection === "incoming" ? (
                  <div className="vdn-v2-conversations__actions">
                    <V2Button
                      loading={requestResponse.isPending}
                      onClick={() => requestResponse.mutate(true)}
                    >
                      Aceitar
                    </V2Button>
                    <V2Button
                      variant="outline"
                      disabled={requestResponse.isPending}
                      onClick={() => requestResponse.mutate(false)}
                    >
                      Recusar
                    </V2Button>
                  </div>
                ) : null}
              </V2Surface>
            ) : (
              <>
                <div className="vdn-v2-conversations__messages" aria-live="polite">
                  {messages.isPending ? <V2LoadingIndicator label="Carregando mensagens" /> : null}
                  {messages.hasNextPage ? (
                    <V2Button
                      variant="ghost"
                      size="small"
                      loading={messages.isFetchingNextPage}
                      onClick={() => void messages.fetchNextPage()}
                    >
                      Carregar mensagens anteriores
                    </V2Button>
                  ) : null}
                  {messages.isError ? (
                    <div role="alert">
                      <V2Text>Não foi possível carregar esta conversa.</V2Text>
                      <V2Button variant="secondary" onClick={() => void messages.refetch()}>
                        Tentar novamente
                      </V2Button>
                    </div>
                  ) : null}
                  {renderedMessages.map((message) => (
                    <article
                      key={message.id}
                      className={`vdn-v2-conversations__message ${message.senderId === userId ? "vdn-v2-conversations__message--own" : ""}`}
                    >
                      <strong>{message.senderName}</strong>
                      <p>{message.content}</p>
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {message.delivery === "read" ? <CheckCheck aria-label="Lida" /> : null}
                        {message.delivery === "sending" ? "Enviando" : null}
                      </span>
                    </article>
                  ))}
                </div>
                <form
                  className="vdn-v2-conversations__composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!draft.trim() || send.isPending) return;
                    send.mutate({ clientMessageId: createClientMessageId(), content: draft });
                  }}
                >
                  <V2TextArea
                    label={`Mensagem para ${selected.title}`}
                    value={draft}
                    rows={2}
                    maxLength={4000}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setDraft(value);
                      writeConversationDraft(storage, userId, selected.key, value);
                    }}
                  />
                  <V2Button
                    type="submit"
                    loading={send.isPending}
                    disabled={!draft.trim()}
                    leadingIcon={<Send />}
                  >
                    Enviar
                  </V2Button>
                </form>
                {failedSend ? (
                  <V2Button
                    variant="secondary"
                    size="small"
                    onClick={() => send.mutate(failedSend)}
                  >
                    Tentar enviar novamente
                  </V2Button>
                ) : null}
              </>
            )}
          </>
        ) : (
          <V2Surface className="vdn-v2-conversations-state">
            <MessageCircle aria-hidden="true" />
            <V2Heading id="conversation-thread-title" level={2} size="small">
              Escolha uma conversa
            </V2Heading>
            <V2Text tone="muted">
              Solicitações sociais ficam separadas e conversas românticas só aparecem com Namoro
              ativo.
            </V2Text>
          </V2Surface>
        )}
      </section>
      {feedback ? (
        <p className="vdn-v2-conversations__feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
