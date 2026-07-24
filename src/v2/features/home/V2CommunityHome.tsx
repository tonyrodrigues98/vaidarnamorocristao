import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenText,
  Clock3,
  HeartHandshake,
  ImagePlus,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2IconButton,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextArea,
} from "@/v2/design-system";
import {
  COMMUNITY_AUDIENCES,
  resolveCommunityHomeViewState,
  sanitizeCommunityAudience,
  statusRemainingLabel,
  type CommunityAudience,
  type CommunityFeedCursor,
  type CommunityHomeRepository,
  type CommunityPerson,
  type CommunityStatusItem,
} from "./contracts";

const AUDIENCE_LABELS: Record<CommunityAudience, string> = {
  community: "Comunidade",
  followers: "Seguidores",
  connections: "Conexões",
  private: "Somente eu",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VD"
  );
}

function V2CommunityAvatar({
  name,
  photoUrl,
  size = "medium",
}: {
  readonly name: string;
  readonly photoUrl: string | null;
  readonly size?: "small" | "medium" | "large";
}) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className={`vdn-v2-home-avatar vdn-v2-home-avatar--${size}`}
      aria-label={photoUrl && !broken ? undefined : name}
    >
      {photoUrl && !broken ? (
        <img src={photoUrl} alt="" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

function V2AudienceSelect({
  value,
  onChange,
  id,
}: {
  readonly value: CommunityAudience;
  readonly onChange: (value: CommunityAudience) => void;
  readonly id: string;
}) {
  return (
    <label className="vdn-v2-home-audience" htmlFor={id}>
      <span>Público</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(sanitizeCommunityAudience(event.target.value))}
      >
        {COMMUNITY_AUDIENCES.map((audience) => (
          <option key={audience} value={audience}>
            {AUDIENCE_LABELS[audience]}
          </option>
        ))}
      </select>
    </label>
  );
}

function V2StatusViewer({
  status,
  onClose,
  onViewed,
}: {
  readonly status: CommunityStatusItem;
  readonly onClose: () => void;
  readonly onViewed: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    onViewed();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onViewed]);

  return (
    <div className="vdn-v2-home-status-dialog" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        aria-labelledby="vdn-v2-status-title"
        className="vdn-v2-home-status-dialog__content"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="vdn-v2-home-status-dialog__header">
          <V2CommunityAvatar
            name={status.author.name}
            photoUrl={status.author.photoUrl}
            size="small"
          />
          <div>
            <V2Heading id="vdn-v2-status-title" level={2} size="small">
              {status.author.name}
            </V2Heading>
            <V2Text variant="caption" tone="muted">
              Expira em {statusRemainingLabel(status.expiresAt)}
            </V2Text>
          </div>
          <V2IconButton ref={closeRef} label="Fechar Status" icon={<X />} onClick={onClose} />
        </div>
        {status.mediaUrl && (
          <img
            className="vdn-v2-home-status-dialog__media"
            src={status.mediaUrl}
            alt={status.caption || `Status de ${status.author.name}`}
          />
        )}
        {status.caption && (
          <V2Text className="vdn-v2-home-status-dialog__caption">{status.caption}</V2Text>
        )}
      </section>
    </div>
  );
}

function V2StatusComposer({
  busy,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly onSubmit: (input: {
    caption: string;
    audience: CommunityAudience;
    file: File | null;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<CommunityAudience>("connections");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({ caption, audience, file });
      setCaption("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível publicar o Status.");
    }
  };

  return (
    <V2Surface className="vdn-v2-home-status-composer" tone="subtle">
      <V2Button
        variant="secondary"
        leadingIcon={<Plus />}
        aria-expanded={open}
        aria-controls="vdn-v2-status-composer-form"
        onClick={() => setOpen((current) => !current)}
      >
        Novo Status
      </V2Button>
      {open && (
        <form id="vdn-v2-status-composer-form" onSubmit={submit}>
          <V2TextArea
            label="Mensagem do Status"
            description="O Status desaparece em até 24 horas."
            maxLength={500}
            rows={3}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
          <div className="vdn-v2-home-composer__controls">
            <label className="vdn-v2-home-file" htmlFor="vdn-v2-status-file">
              <ImagePlus aria-hidden="true" />
              <span>{file ? file.name : "Adicionar imagem"}</span>
              <input
                ref={fileRef}
                id="vdn-v2-status-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <V2AudienceSelect id="vdn-v2-status-audience" value={audience} onChange={setAudience} />
            <V2Button type="submit" loading={busy} leadingIcon={<Send />}>
              Publicar
            </V2Button>
          </div>
          {error && (
            <V2Text role="alert" className="vdn-v2-home-error">
              {error}
            </V2Text>
          )}
        </form>
      )}
    </V2Surface>
  );
}

function V2PostComposer({
  busy,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly onSubmit: (body: string, audience: CommunityAudience) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<CommunityAudience>("community");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit(body, audience);
      setBody("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível publicar.");
    }
  };

  return (
    <V2Surface as="section" className="vdn-v2-home-composer" elevation="one">
      <form onSubmit={submit}>
        <V2TextArea
          label="Compartilhe com a comunidade"
          placeholder="Uma reflexão, pergunta ou novidade para caminhar junto..."
          maxLength={3000}
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="vdn-v2-home-composer__controls">
          <V2AudienceSelect id="vdn-v2-post-audience" value={audience} onChange={setAudience} />
          <V2Button type="submit" loading={busy} leadingIcon={<Send />}>
            Publicar
          </V2Button>
        </div>
        {error && (
          <V2Text role="alert" className="vdn-v2-home-error">
            {error}
          </V2Text>
        )}
      </form>
    </V2Surface>
  );
}

function V2Suggestion({
  person,
  busy,
  onConnect,
  onFollow,
}: {
  readonly person: CommunityPerson;
  readonly busy: boolean;
  readonly onConnect: () => void;
  readonly onFollow: () => void;
}) {
  return (
    <V2Surface className="vdn-v2-home-suggestion" tone="subtle">
      <V2CommunityAvatar name={person.name} photoUrl={person.photoUrl} />
      <div className="vdn-v2-home-suggestion__copy">
        <V2Text as="span" variant="label">
          {person.name}
        </V2Text>
        <V2Text variant="caption" tone="muted">
          {[person.city, person.state].filter(Boolean).join(", ") || "Na comunidade"}
        </V2Text>
      </div>
      <div className="vdn-v2-home-suggestion__actions">
        <V2Button
          size="small"
          variant="secondary"
          disabled={busy || person.relationshipState !== "none"}
          onClick={onFollow}
        >
          {person.relationshipState === "following" ? "Seguindo" : "Seguir"}
        </V2Button>
        <V2IconButton
          label={`Solicitar conexão com ${person.name}`}
          icon={<UserPlus />}
          disabled={busy || person.relationshipState !== "none"}
          onClick={onConnect}
        />
      </div>
    </V2Surface>
  );
}

export interface V2CommunityHomeProps {
  readonly userId: string;
  readonly datingEnabled: boolean;
  readonly repository: CommunityHomeRepository;
  readonly onOpenDating?: () => void;
}

export function V2CommunityHome({
  userId,
  datingEnabled,
  repository,
  onOpenDating,
}: V2CommunityHomeProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<CommunityStatusItem | null>(null);
  const [relationshipBusy, setRelationshipBusy] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const queryKey = useMemo(() => ["v2", "community-home", userId] as const, [userId]);

  const home = useInfiniteQuery({
    queryKey,
    initialPageParam: null as CommunityFeedCursor | null,
    queryFn: ({ pageParam }: { pageParam: CommunityFeedCursor | null }) =>
      repository.loadHome(userId, pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasMorePosts ? lastPage.nextCursor : undefined),
  });
  const firstPage = home.data?.pages[0];
  const posts = home.data?.pages.flatMap((page) => page.posts) ?? [];
  const state = resolveCommunityHomeViewState({
    loading: home.isPending,
    error: home.isError,
    online: typeof navigator === "undefined" || navigator.onLine,
    itemCount: posts.length + (firstPage?.daily.length ?? 0),
  });

  const publishPost = useMutation({
    mutationFn: ({ body, audience }: { body: string; audience: CommunityAudience }) =>
      repository.publishPost(userId, body, audience),
    onSuccess: async () => {
      setAnnouncement("Publicação enviada para a comunidade.");
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const publishStatus = useMutation({
    mutationFn: (input: { caption: string; audience: CommunityAudience; file: File | null }) =>
      repository.publishStatus(userId, input),
    onSuccess: async () => {
      setAnnouncement("Status publicado. Ele expirará em até 24 horas.");
      await queryClient.invalidateQueries({ queryKey });
    },
  });
  const react = useMutation({
    mutationFn: (postId: string) => repository.toggleReaction(userId, postId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey }),
  });

  const requestRelationship = async (person: CommunityPerson, kind: "follow" | "connection") => {
    setRelationshipBusy(person.id);
    try {
      const result = await repository.requestRelationship(userId, person.id, kind);
      setAnnouncement(
        result === "request_sent"
          ? `Solicitação enviada para ${person.name}.`
          : `Vínculo comunitário atualizado com ${person.name}.`,
      );
      await queryClient.invalidateQueries({ queryKey });
    } catch (reason) {
      setAnnouncement(
        reason instanceof Error ? reason.message : "Não foi possível atualizar esse vínculo.",
      );
    } finally {
      setRelationshipBusy(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="vdn-v2-home-state">
        <V2LoadingIndicator visibleLabel label="Carregando a comunidade" size="large" />
      </div>
    );
  }
  if (state === "error" || state === "offline") {
    return (
      <V2Surface className="vdn-v2-home-state" elevation="one">
        <V2Heading level={2} size="small">
          {state === "offline" ? "Você está offline" : "A comunidade não carregou"}
        </V2Heading>
        <V2Text tone="secondary">
          {state === "offline"
            ? "Seu conteúdo privado não será reutilizado de outra conta. Reconecte para atualizar."
            : "Tente novamente. Nenhum conteúdo privado foi liberado durante a falha."}
        </V2Text>
        <V2Button variant="secondary" onClick={() => void home.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  return (
    <div className="vdn-v2-home">
      <div className="vdn-v2-home__announcement" role="status" aria-live="polite">
        {announcement}
      </div>

      <section className="vdn-v2-home-statuses" aria-labelledby="vdn-v2-statuses-title">
        <div className="vdn-v2-home-section-title">
          <div>
            <V2Heading id="vdn-v2-statuses-title" level={2} size="small">
              Status da comunidade
            </V2Heading>
            <V2Text variant="caption" tone="muted">
              Momentos que ficam disponíveis por até 24 horas
            </V2Text>
          </div>
          <V2StatusComposer
            busy={publishStatus.isPending}
            onSubmit={(input) => publishStatus.mutateAsync(input)}
          />
        </div>
        <div className="vdn-v2-home-statuses__rail" role="list">
          {(firstPage?.statuses ?? []).map((status) => (
            <button
              key={status.id}
              type="button"
              className="vdn-v2-home-status"
              data-viewed={status.viewed || undefined}
              onClick={() => setSelectedStatus(status)}
              role="listitem"
            >
              <V2CommunityAvatar
                name={status.author.name}
                photoUrl={status.author.photoUrl}
                size="large"
              />
              <span>{status.author.id === userId ? "Seu Status" : status.author.name}</span>
            </button>
          ))}
          {(firstPage?.statuses.length ?? 0) === 0 && (
            <V2Surface className="vdn-v2-home-statuses__empty" tone="subtle">
              <Clock3 aria-hidden="true" />
              <V2Text variant="caption" tone="muted">
                Nenhum Status visível agora. Você pode compartilhar o primeiro.
              </V2Text>
            </V2Surface>
          )}
        </div>
      </section>

      <V2PostComposer
        busy={publishPost.isPending}
        onSubmit={(body, audience) => publishPost.mutateAsync({ body, audience })}
      />

      {firstPage?.daily[0] && (
        <V2Surface as="article" className="vdn-v2-home-daily" elevation="one">
          <BookOpenText aria-hidden="true" />
          <div>
            <V2StatusBadge tone="info">
              {firstPage.daily[0].kind === "devotional" ? "Palavra para hoje" : "Novidade"}
            </V2StatusBadge>
            <V2Heading level={2} size="small">
              {firstPage.daily[0].title}
            </V2Heading>
            {firstPage.daily[0].bibleReference && (
              <V2Text variant="caption" tone="muted">
                {firstPage.daily[0].bibleReference}
              </V2Text>
            )}
            <V2Text tone="secondary">{firstPage.daily[0].content}</V2Text>
          </div>
        </V2Surface>
      )}

      {datingEnabled && (
        <V2Surface className="vdn-v2-home-dating" tone="subtle">
          <HeartHandshake aria-hidden="true" />
          <div>
            <V2Heading level={2} size="small">
              Modo Namoro
            </V2Heading>
            <V2Text variant="caption" tone="muted">
              Esta área aparece porque você escolheu participar. Ela continua separada do feed.
            </V2Text>
          </div>
          <V2Button variant="ghost" onClick={onOpenDating}>
            Abrir
          </V2Button>
        </V2Surface>
      )}

      <section className="vdn-v2-home-feed" aria-labelledby="vdn-v2-feed-title">
        <div className="vdn-v2-home-section-title">
          <div>
            <V2Heading id="vdn-v2-feed-title" level={2} size="small">
              Acontecendo agora
            </V2Heading>
            <V2Text variant="caption" tone="muted">
              Ordem cronológica recente, sem ranking romântico
            </V2Text>
          </div>
          <V2StatusBadge tone="neutral">Mais recentes</V2StatusBadge>
        </div>
        {posts.length === 0 ? (
          <V2Surface className="vdn-v2-home-empty" tone="subtle">
            <Sparkles aria-hidden="true" />
            <V2Heading level={3} size="small">
              Seu feed está pronto para começar
            </V2Heading>
            <V2Text tone="secondary">
              Siga pessoas da comunidade ou publique uma reflexão. Namoro não é necessário.
            </V2Text>
          </V2Surface>
        ) : (
          posts.map((post) => (
            <V2Surface key={post.id} as="article" className="vdn-v2-home-post" elevation="one">
              <header>
                <V2CommunityAvatar
                  name={post.author.name}
                  photoUrl={post.author.photoUrl}
                  size="small"
                />
                <div>
                  <V2Text as="span" variant="label">
                    {post.author.name}
                  </V2Text>
                  <V2Text variant="caption" tone="muted">
                    {AUDIENCE_LABELS[post.audience]} · mais recente
                  </V2Text>
                </div>
              </header>
              <V2Text className="vdn-v2-home-post__body">{post.body}</V2Text>
              <footer>
                <V2Button
                  size="small"
                  variant={post.viewerReacted ? "secondary" : "ghost"}
                  leadingIcon={<Sparkles />}
                  loading={react.isPending && react.variables === post.id}
                  onClick={() => react.mutate(post.id)}
                >
                  Amém · {post.reactionCount}
                </V2Button>
                <span>
                  <MessageCircle aria-hidden="true" /> {post.commentCount} comentários
                </span>
              </footer>
            </V2Surface>
          ))
        )}
        {home.hasNextPage && (
          <V2Button
            variant="secondary"
            loading={home.isFetchingNextPage}
            onClick={() => void home.fetchNextPage()}
          >
            Carregar mais
          </V2Button>
        )}
      </section>

      {(firstPage?.suggestions.length ?? 0) > 0 && (
        <section className="vdn-v2-home-suggestions" aria-labelledby="vdn-v2-suggestions-title">
          <div className="vdn-v2-home-section-title">
            <div>
              <V2Heading id="vdn-v2-suggestions-title" level={2} size="small">
                Pessoas para conhecer
              </V2Heading>
              <V2Text variant="caption" tone="muted">
                Afinidade comunitária, sem disponibilidade romântica
              </V2Text>
            </div>
            <UsersRound aria-hidden="true" />
          </div>
          <div className="vdn-v2-home-suggestions__grid">
            {firstPage?.suggestions.map((person) => (
              <V2Suggestion
                key={person.id}
                person={person}
                busy={relationshipBusy === person.id}
                onFollow={() => void requestRelationship(person, "follow")}
                onConnect={() => void requestRelationship(person, "connection")}
              />
            ))}
          </div>
        </section>
      )}

      <V2Surface className="vdn-v2-home-summary" tone="subtle">
        <span>
          <UsersRound aria-hidden="true" />
          <strong>{firstPage?.relationshipSummary.connections ?? 0}</strong> conexões
        </span>
        <span>
          <Sparkles aria-hidden="true" />
          <strong>{firstPage?.relationshipSummary.following ?? 0}</strong> seguindo
        </span>
        <span>
          <UserPlus aria-hidden="true" />
          <strong>{firstPage?.relationshipSummary.pending ?? 0}</strong> solicitações
        </span>
      </V2Surface>

      {selectedStatus && (
        <V2StatusViewer
          status={selectedStatus}
          onClose={() => setSelectedStatus(null)}
          onViewed={() => {
            if (selectedStatus.author.id !== userId) {
              void repository
                .recordStatusView(userId, selectedStatus.id)
                .then(() => queryClient.invalidateQueries({ queryKey }));
            }
          }}
        />
      )}
    </div>
  );
}
