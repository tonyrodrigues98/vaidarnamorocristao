import { friendlyError } from "@/lib/errors";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useMemo, useRef, useState } from "react";
import { getActiveCommitmentByUser, type RelationshipCommitment } from "@/lib/commitments";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Send,
  Trash2,
  Pencil,
  Check,
  X,
  Reply,
  MoreHorizontal,
  CheckCheck,
  PanelLeft,
  Search,
  MessageCircle,
} from "lucide-react";
import { useLongPress } from "@/hooks/use-long-press";
import { useRestrictedWords, findRestrictedWord } from "@/lib/profanity";
import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CommitmentProgressCard } from "@/components/commitment/CommitmentProgressCard";
import { CommitmentPauseCard } from "@/components/commitment/CommitmentPauseCard";
import { MobileChatScreen } from "@/components/mobile/MobileChatScreen";

type Msg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at?: string | null;
  reply_to_id?: string | null;
};
type Partner = {
  id: string;
  full_name: string;
  photo_url: string | null;
  verified?: boolean | null;
  equipped_frame_id?: string | null;
  equipped_aura_id?: string | null;
};
type ConversationShortcut = {
  matchId: string;
  partner: Partner;
  lastMessage: string | null;
  lastAt: string;
  unread: boolean;
};

export const Route = createFileRoute("/conversas/$matchId")({
  component: () => (
    <RequireApproved>
      <Chat />
    </RequireApproved>
  ),
});

function Chat() {
  const { matchId } = Route.useParams();
  const { user, loading } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [partnerCommitted, setPartnerCommitted] = useState(false);
  const [partnerCommitmentMatchId, setPartnerCommitmentMatchId] = useState<string | null>(null);
  const [currentCommitment, setCurrentCommitment] = useState<RelationshipCommitment | null>(null);
  const [pausedByCommitment, setPausedByCommitment] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const restrictedWords = useRestrictedWords();
  const [warning, setWarning] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationList, setConversationList] = useState<ConversationShortcut[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  async function loadConversationShortcuts() {
    if (!user) return;
    setLoadingConversations(true);
    const commitment = await getActiveCommitmentByUser(user.id);
    const { data: matches } = await supabase
      .from("matches")
      .select("id, user_a, user_b, created_at")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const visibleMatches = commitment
      ? (matches ?? []).filter((match) => match.id === commitment.match_id)
      : (matches ?? []);

    if (!visibleMatches.length) {
      setConversationList([]);
      setLoadingConversations(false);
      return;
    }

    const partnerIds = visibleMatches.map((match) =>
      match.user_a === user.id ? match.user_b : match.user_a,
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url, verified, equipped_frame_id, equipped_aura_id")
      .in("id", partnerIds);
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    const list = await Promise.all(
      visibleMatches.map(async (match) => {
        const partnerId = match.user_a === user.id ? match.user_b : match.user_a;
        const { data: lastMessages } = await supabase
          .from("messages")
          .select("content, sender_id, created_at, read_at")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const last = lastMessages?.[0] ?? null;
        const profile = profileMap.get(partnerId);

        return {
          matchId: match.id,
          partner: {
            id: partnerId,
            full_name: profile?.full_name ?? "Conversa",
            photo_url: profile?.photo_url ?? null,
            verified: profile?.verified ?? null,
            equipped_frame_id: profile?.equipped_frame_id ?? null,
            equipped_aura_id: profile?.equipped_aura_id ?? null,
          },
          lastMessage: last?.content ?? null,
          lastAt: last?.created_at ?? match.created_at,
          unread: !!last && last.sender_id !== user.id && !last.read_at,
        } satisfies ConversationShortcut;
      }),
    );

    list.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    setConversationList(list);
    setLoadingConversations(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    void loadConversationShortcuts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, user?.id]);

  const filteredConversationList = useMemo(() => {
    const term = conversationSearch.trim().toLowerCase();
    if (!term) return conversationList;
    return conversationList.filter((item) => item.partner.full_name.toLowerCase().includes(term));
  }, [conversationList, conversationSearch]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: m } = await supabase
        .from("matches")
        .select("user_a, user_b")
        .eq("id", matchId)
        .maybeSingle();
      if (!m || (m.user_a !== user.id && m.user_b !== user.id)) {
        setAuthorized(false);
        return;
      }
      const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
      const { data: blk } = await supabase
        .from("blocks")
        .select("id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", partnerId)
        .maybeSingle();
      if (blk) {
        setAuthorized(false);
        return;
      }
      const myActiveCommitment = await getActiveCommitmentByUser(user.id);
      setCurrentCommitment(myActiveCommitment);
      if (myActiveCommitment && myActiveCommitment.match_id !== matchId) {
        setPausedByCommitment(true);
        setMessages([]);
        setAuthorized(true);
        return;
      }
      setPausedByCommitment(false);
      setAuthorized(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("id,full_name,photo_url,verified,equipped_frame_id,equipped_aura_id")
        .eq("id", partnerId)
        .maybeSingle();
      setPartner(p as Partner | null);
      if (partnerId) {
        const active = await getActiveCommitmentByUser(partnerId);

        setPartnerCommitted(!!active);

        setPartnerCommitmentMatchId(active?.match_id ?? null);
      }
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at");
      setMessages((msgs ?? []) as Msg[]);
      // mark received as read via SECURITY DEFINER RPC (only updates read_at)
      const unread = (msgs ?? []).filter((m: Msg) => m.sender_id !== user.id && !m.read_at);
      await Promise.all(
        unread.map((m) => supabase.rpc("mark_message_read", { _message_id: m.id })),
      );
    })();

    const ch = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Msg).id)
              ? prev
              : [...prev, payload.new as Msg],
          );
          if ((payload.new as Msg).sender_id !== user.id) {
            supabase.rpc("mark_message_read", { _message_id: (payload.new as Msg).id });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const updated = payload.new as Msg;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [matchId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (authorized === false)
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <p>Conversa não encontrada.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/conversas">Voltar</Link>
          </Button>
        </main>
      </div>
    );
  if (pausedByCommitment && currentCommitment)
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <Button asChild variant="ghost" className="mb-6">
            <Link to="/conversas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <CommitmentPauseCard
            matchId={currentCommitment.match_id}
            description="Você está em um propósito ativo. Por isso, conversas fora desse compromisso ficam arquivadas até o propósito ser interrompido."
          />
        </main>
      </div>
    );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !input.trim()) return;
    const content = input.trim().slice(0, 2000);
    const hit = await findRestrictedWord(content);
    if (hit) {
      setWarning(hit);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content,
      reply_to_id: replyTo?.id ?? null,
    });
    setSending(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    setInput("");
    setReplyTo(null);
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  async function handleDelete(messageId: string) {
    if (!confirm("Apagar esta mensagem? Essa ação não pode ser desfeita.")) return;
    const prev = messages;
    setMessages((m) => m.filter((x) => x.id !== messageId));
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      setMessages(prev);
      toast.error("Não foi possível apagar a mensagem.");
    }
  }

  function startEdit(m: Msg) {
    setEditingId(m.id);
    setEditText(m.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function saveEdit(messageId: string) {
    const content = editText.trim().slice(0, 2000);
    if (!content) return;
    const original = messages.find((m) => m.id === messageId);
    if (original && original.content === content) {
      cancelEdit();
      return;
    }
    const { error } = await supabase.from("messages").update({ content }).eq("id", messageId);
    if (error) {
      toast.error("Não foi possível editar.");
      return;
    }
    cancelEdit();
  }

  function jumpToMessage(id: string) {
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1600);
  }

  function blurComposer() {
    if (typeof document === "undefined") return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }

  return (
    <MobileChatScreen
      ref={scrollRef}
      header={
        <>
          <Header />
          <div className="glass mx-auto flex w-full max-w-3xl items-center gap-3 px-3 py-3 shadow-soft md:px-4">
        <Link to="/conversas" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {partner ? (
          <Link
            to="/pretendentes/$id"
            params={{ id: partner.id }}
            className="flex flex-1 items-center gap-3 rounded-lg -mx-1 px-1 py-1 transition hover:bg-accent/50"
          >
            <div className="flex shrink-0 items-center justify-center">
              <DecoratedAvatar
                photoUrl={partner.photo_url}
                fallback={partner.full_name?.charAt(0) ?? "?"}
                size={32}
                frameId={partner.equipped_frame_id ?? null}
                auraId={partner.equipped_aura_id ?? null}
                isCommitted={partnerCommitted}
              />
            </div>
            <div className="flex-1">
              <h2 className="flex items-center gap-1.5 font-semibold leading-none hover:underline">
                {partner.full_name?.split(" ")[0] ?? "—"}

                {partner.verified && <VerifiedBadge size="sm" />}
              </h2>

              {partnerCommitted ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-emerald-600">Em Propósito</span>

                  {partnerCommitmentMatchId && (
                    <Link
                      to="/proposito/$matchId"
                      params={{
                        matchId: partnerCommitmentMatchId,
                      }}
                      className="
            text-[11px]
            text-primary
            hover:underline
          "
                    >
                      Ver Página do Casal
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">ver perfil</p>
              )}
            </div>
          </Link>
        ) : (
          <div className="flex flex-1 items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1">
              <h2 className="font-semibold leading-none">—</h2>
              <p className="text-[11px] text-muted-foreground">match com propósito</p>
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(true)}
          className="shrink-0 rounded-full"
          aria-label="Abrir outras conversas"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>

      {actionsOpenId && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setActionsOpenId(null)}
          aria-hidden="true"
        />
      )}

      <main
        ref={scrollRef}
        className="mobile-chat-scroll mx-auto min-h-0 w-full max-w-3xl flex-1 space-y-4 overflow-y-auto px-3 py-4 md:space-y-5 md:px-4 md:py-8"
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button,a,input,textarea,[role='dialog']")) return;
          blurComposer();
        }}
      >
        <CommitmentProgressCard matchId={matchId} />
        {messages.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Comece a conversa com graça e respeito 💗
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          const isEditing = editingId === m.id;
          const showActions = actionsOpenId === m.id;
          const replied = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;
          const isFlash = highlightId === m.id;
          return (
            <div
              key={m.id}
              ref={(el) => {
                messageRefs.current[m.id] = el;
              }}
              className={`flex scroll-mt-24 transition-colors duration-500 ${mine ? "justify-end" : "justify-start"} ${isFlash ? "rounded-xl bg-primary/10" : ""}`}
            >
              <div
                className={`group relative flex max-w-[75%] items-end gap-1 ${showActions ? "z-40" : ""} ${mine ? "flex-row-reverse" : "flex-row"}`}
              >
                <BubbleContent
                  mine={mine}
                  isMine={!!mine}
                  enableLongPress={!isEditing}
                  onLongPress={() => setActionsOpenId(m.id)}
                  highlighted={showActions || isFlash}
                >
                  {replied && (
                    <button
                      type="button"
                      onClick={() => jumpToMessage(replied.id)}
                      className={`mb-1 flex w-full items-stretch gap-2 rounded-md px-2 py-1 text-left text-xs transition ${
                        mine
                          ? "bg-white/15 hover:bg-white/25"
                          : "bg-foreground/5 hover:bg-foreground/10"
                      }`}
                    >
                      <span
                        className={`w-0.5 shrink-0 rounded ${mine ? "bg-white/70" : "bg-primary"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block font-semibold ${mine ? "text-white/90" : "text-primary"}`}
                        >
                          {replied.sender_id === user?.id
                            ? "Você"
                            : (partner?.full_name?.split(" ")[0] ?? "")}
                        </span>
                        <span
                          className={`line-clamp-2 ${mine ? "text-white/80" : "text-muted-foreground"}`}
                        >
                          {replied.content}
                        </span>
                      </span>
                    </button>
                  )}
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        maxLength={2000}
                        autoFocus
                        className={`w-full resize-none rounded-md bg-white/20 p-1.5 text-sm outline-none ring-1 ring-white/40 ${mine ? "text-white placeholder:text-white/60" : "text-foreground bg-background ring-border"}`}
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          aria-label="Cancelar"
                          className="rounded-full p-1 hover:bg-white/20"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(m.id)}
                          aria-label="Salvar"
                          className="rounded-full p-1 hover:bg-white/20"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p
                        className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}
                      >
                        <span>
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.edited_at ? " · editado" : ""}
                        </span>
                        {mine &&
                          (m.read_at ? (
                            <span
                              className="ml-0.5 inline-flex items-center gap-0.5"
                              title={`Visto ${new Date(m.read_at).toLocaleString("pt-BR")}`}
                            >
                              <CheckCheck className="h-3 w-3" /> Visto
                            </span>
                          ) : (
                            <Check className="ml-0.5 h-3 w-3" aria-label="Enviada" />
                          ))}
                      </p>
                    </>
                  )}
                </BubbleContent>
                {!isEditing && !showActions && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionsOpenId(m.id);
                    }}
                    aria-label="Mais opções"
                    className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
                {!isEditing && showActions && (
                  <div
                    className={`absolute z-50 flex items-center gap-1 rounded-full border border-border bg-popover px-1 py-1 shadow-lg ${
                      mine ? "right-0" : "left-0"
                    } -top-10`}
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    role="menu"
                    style={{ touchAction: "manipulation", pointerEvents: "auto" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(m);
                        setActionsOpenId(null);
                      }}
                      aria-label="Responder"
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground hover:bg-accent active:bg-accent/80 [touch-action:manipulation]"
                    >
                      <Reply className="h-4 w-4" /> Responder
                    </button>
                    {mine && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActionsOpenId(null);
                            startEdit(m);
                          }}
                          aria-label="Editar mensagem"
                          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground hover:bg-accent active:bg-accent/80 [touch-action:manipulation]"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionsOpenId(null);
                            handleDelete(m.id);
                          }}
                          aria-label="Apagar mensagem"
                          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-destructive hover:bg-destructive/10 active:bg-destructive/20 [touch-action:manipulation]"
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <form
        onSubmit={send}
        className="mobile-chat-composer border-t border-border bg-background/88 px-3 py-3 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {replyTo && (
            <div className="flex items-stretch gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <span className="w-1 shrink-0 rounded bg-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary">
                  Respondendo a{" "}
                  {replyTo.sender_id === user?.id
                    ? "você"
                    : (partner?.full_name?.split(" ")[0] ?? "")}
                </p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{replyTo.content}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                aria-label="Cancelar resposta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex min-h-11 min-w-0 items-end gap-2 rounded-[1.4rem] border border-border/80 bg-card px-3 py-2 shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 144) + "px";
              }}
              placeholder="Escreva uma mensagem..."
              maxLength={2000}
              rows={1}
              cols={1}
              className="block max-h-36 min-h-[28px] w-full min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1 text-base leading-6 outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              size="icon"
              className="tap h-8 w-8 shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col p-0">
          <SheetHeader className="border-b border-border px-4 pb-3 pt-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              Conversas
            </SheetTitle>
          </SheetHeader>
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                placeholder="Buscar conversa"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="mobile-chat-scroll flex-1 overflow-y-auto p-3">
            {loadingConversations ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
                ))}
              </div>
            ) : filteredConversationList.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="mb-3 h-8 w-8 text-muted-foreground/60" />
                Nenhuma conversa encontrada.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversationList.map((item) => {
                  const active = item.matchId === matchId;
                  return (
                    <Link
                      key={item.matchId}
                      to="/conversas/$matchId"
                      params={{ matchId: item.matchId }}
                      onClick={() => setDrawerOpen(false)}
                      className={`tap flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                        active
                          ? "border-primary/40 bg-primary/10"
                          : "border-transparent hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <DecoratedAvatar
                          photoUrl={item.partner.photo_url}
                          fallback={item.partner.full_name?.charAt(0) ?? "?"}
                          size={36}
                          frameId={item.partner.equipped_frame_id ?? null}
                          auraId={item.partner.equipped_aura_id ?? null}
                        />
                        <OnlineDot
                          userId={item.partner.id}
                          className="absolute -bottom-0.5 -right-0.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold">{item.partner.full_name}</p>
                          {item.partner.verified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.lastMessage ?? "Conversa iniciada"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.lastAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        {item.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!warning} onOpenChange={(o) => !o && setWarning(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center">Mensagem bloqueada</DialogTitle>
            <DialogDescription className="text-center">
              A palavra <span className="font-semibold text-foreground">"{warning}"</span> fere as
              diretrizes da comunidade. Por favor, reescreva sua mensagem com respeito e cuidado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <Button onClick={() => setWarning(null)}>Entendi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BubbleContent({
  mine,
  enableLongPress,
  onLongPress,
  highlighted,
  children,
}: {
  mine: boolean;
  isMine: boolean;
  enableLongPress: boolean;
  onLongPress: () => void;
  highlighted: boolean;
  children: React.ReactNode;
}) {
  const { pressing, handlers } = useLongPress(onLongPress, 450);
  const bound = enableLongPress ? handlers : {};
  return (
    <div
      {...bound}
      className={`relative rounded-2xl px-4 py-2 text-sm shadow-soft transition-all duration-200 ${
        mine ? "bg-gradient-love text-white" : "glass text-foreground"
      } ${enableLongPress ? "select-none md:select-text touch-none" : ""} ${
        pressing ? "scale-[0.97] ring-2 ring-primary/40" : ""
      } ${highlighted ? "ring-2 ring-primary shadow-glow" : ""}`}
      style={enableLongPress ? { WebkitUserSelect: "none", WebkitTouchCallout: "none" } : undefined}
    >
      {children}
    </div>
  );
}
