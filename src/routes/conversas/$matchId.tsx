import { friendlyError } from "@/lib/errors";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Trash2, Pencil, Check, X, Reply, MoreHorizontal, CheckCheck } from "lucide-react";
import { useLongPress } from "@/hooks/use-long-press";
import { useRestrictedWords, findRestrictedWord } from "@/lib/profanity";
import { ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/VerifiedBadge";

type Msg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at?: string | null;
  reply_to_id?: string | null;
};
type Partner = { id: string; full_name: string; photo_url: string | null; verified?: boolean | null; equipped_frame_id?: string | null; equipped_aura_id?: string | null };

export const Route = createFileRoute("/conversas/$matchId")({ component: () => (<RequireApproved><Chat /></RequireApproved>) });

function Chat() {
  const { matchId } = Route.useParams();
  const { user, loading } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const restrictedWords = useRestrictedWords();
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: m } = await supabase.from("matches").select("user_a, user_b").eq("id", matchId).maybeSingle();
      if (!m || (m.user_a !== user.id && m.user_b !== user.id)) { setAuthorized(false); return; }
      const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
      const { data: blk } = await supabase.from("blocks").select("id")
        .eq("blocker_id", user.id).eq("blocked_id", partnerId).maybeSingle();
      if (blk) { setAuthorized(false); return; }
      setAuthorized(true);
      const { data: p } = await supabase.from("profiles").select("id,full_name,photo_url,verified,equipped_frame_id,equipped_aura_id").eq("id", partnerId).maybeSingle();
      setPartner(p as Partner | null);
      const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at");
      setMessages((msgs ?? []) as Msg[]);
      // mark received as read via SECURITY DEFINER RPC (only updates read_at)
      const unread = (msgs ?? []).filter((m: Msg) => m.sender_id !== user.id && !m.read_at);
      await Promise.all(unread.map((m) => supabase.rpc("mark_message_read", { _message_id: m.id })));
    })();

    const ch = supabase.channel(`chat-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => prev.some((m) => m.id === (payload.new as Msg).id) ? prev : [...prev, payload.new as Msg]);
          if ((payload.new as Msg).sender_id !== user.id) {
            supabase.rpc("mark_message_read", { _message_id: (payload.new as Msg).id });
          }
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const updated = payload.new as Msg;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (authorized === false) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <p>Conversa não encontrada.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/conversas">Voltar</Link></Button>
      </main>
    </div>
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !input.trim()) return;
    const content = input.trim().slice(0, 2000);
    const hit = findRestrictedWord(content, restrictedWords);
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
    if (error) { toast.error(friendlyError(error)); return; }
    setInput("");
    setReplyTo(null);
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
    if (original && original.content === content) { cancelEdit(); return; }
    const { error } = await supabase.from("messages").update({ content }).eq("id", messageId);
    if (error) { toast.error("Não foi possível editar."); return; }
    cancelEdit();
  }

  function jumpToMessage(id: string) {
    const el = messageRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1600);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="glass mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 shadow-soft">
        <Link to="/conversas" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        {partner ? (
          <Link
            to="/pretendentes/$id"
            params={{ id: partner.id }}
            className="flex flex-1 items-center gap-3 rounded-lg -mx-1 px-1 py-1 transition hover:bg-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center">
              <DecoratedAvatar
                photoUrl={partner.photo_url}
                fallback={partner.full_name?.charAt(0) ?? "?"}
                size={40}
                frameId={partner.equipped_frame_id ?? null}
                auraId={partner.equipped_aura_id ?? null}
              />
            </div>
            <div className="flex-1">
              <h2 className="flex items-center gap-1.5 font-semibold leading-none hover:underline">
                {partner.full_name?.split(" ")[0] ?? "—"}
                {partner.verified && <VerifiedBadge size="sm" />}
              </h2>
              <p className="text-[11px] text-muted-foreground">ver perfil</p>
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
      </div>

      {actionsOpenId && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setActionsOpenId(null)}
          aria-hidden="true"
        />
      )}

      <main ref={scrollRef} className="mx-auto w-full max-w-3xl flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">Comece a conversa com graça e respeito 💗</p>
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
              ref={(el) => { messageRefs.current[m.id] = el; }}
              className={`flex scroll-mt-24 transition-colors duration-500 ${mine ? "justify-end" : "justify-start"} ${isFlash ? "rounded-xl bg-primary/10" : ""}`}
            >
              <div className={`group relative flex max-w-[75%] items-end gap-1 ${showActions ? "z-40" : ""} ${mine ? "flex-row-reverse" : "flex-row"}`}>
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
                        mine ? "bg-white/15 hover:bg-white/25" : "bg-foreground/5 hover:bg-foreground/10"
                      }`}
                    >
                      <span className={`w-0.5 shrink-0 rounded ${mine ? "bg-white/70" : "bg-primary"}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block font-semibold ${mine ? "text-white/90" : "text-primary"}`}>
                          {replied.sender_id === user?.id ? "Você" : partner?.full_name?.split(" ")[0] ?? ""}
                        </span>
                        <span className={`line-clamp-2 ${mine ? "text-white/80" : "text-muted-foreground"}`}>
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
                        <button type="button" onClick={cancelEdit} aria-label="Cancelar" className="rounded-full p-1 hover:bg-white/20">
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => saveEdit(m.id)} aria-label="Salvar" className="rounded-full p-1 hover:bg-white/20">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {m.edited_at ? " · editado" : ""}
                        </span>
                        {mine && (
                          m.read_at ? (
                            <span className="ml-0.5 inline-flex items-center gap-0.5" title={`Visto ${new Date(m.read_at).toLocaleString("pt-BR")}`}>
                              <CheckCheck className="h-3 w-3" /> Visto
                            </span>
                          ) : (
                            <Check className="ml-0.5 h-3 w-3" aria-label="Enviada" />
                          )
                        )}
                      </p>
                    </>
                  )}
                </BubbleContent>
                {!isEditing && !showActions && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActionsOpenId(m.id); }}
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
                      onClick={() => { setReplyTo(m); setActionsOpenId(null); }}
                      aria-label="Responder"
                      className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground hover:bg-accent active:bg-accent/80 [touch-action:manipulation]"
                    >
                      <Reply className="h-4 w-4" /> Responder
                    </button>
                    {mine && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setActionsOpenId(null); startEdit(m); }}
                          aria-label="Editar mensagem"
                          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground hover:bg-accent active:bg-accent/80 [touch-action:manipulation]"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActionsOpenId(null); handleDelete(m.id); }}
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

      <form onSubmit={send} className="sticky bottom-0 border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {replyTo && (
            <div className="flex items-stretch gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <span className="w-1 shrink-0 rounded bg-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary">
                  Respondendo a {replyTo.sender_id === user?.id ? "você" : partner?.full_name?.split(" ")[0] ?? ""}
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
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escreva uma mensagem..." maxLength={2000} />
            <Button type="submit" disabled={sending || !input.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
      <Dialog open={!!warning} onOpenChange={(o) => !o && setWarning(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center">Mensagem bloqueada</DialogTitle>
            <DialogDescription className="text-center">
              A palavra <span className="font-semibold text-foreground">"{warning}"</span> fere as diretrizes da comunidade. Por favor, reescreva sua mensagem com respeito e cuidado.
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