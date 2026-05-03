import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Users, Pencil, Check, X, Reply, MoreHorizontal, Pin, PinOff, ShieldCheck, Flag } from "lucide-react";
import { useLongPress } from "@/hooks/use-long-press";
import { markSeen } from "@/lib/lastSeen";
import { RoleBadge } from "@/components/RoleBadge";
import { type AppRole, type RoleColor, ROLE_PRIORITY } from "@/lib/roles";
import { useRestrictedWords, findRestrictedWord } from "@/lib/profanity";
import { ShieldAlert } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const COOLDOWN_MS = 10_000;

type GMsg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  reply_to_id?: string | null;
  pinned_at?: string | null;
};
type Profile = { id: string; full_name: string; photo_url: string | null; verified?: boolean | null };

export const Route = createFileRoute("/comunidade")({ component: () => (<RequireApproved><Comunidade /></RequireApproved>) });

function Comunidade() {
  const { user, isAdmin, role, loading } = useAuth();
  const canModerateMessages = isAdmin || role === "moderador";
  const canFlagMessages = isAdmin || role === "moderador" || role === "apresentador";
  const isStaffViewer = canFlagMessages;
  const [messages, setMessages] = useState<GMsg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [approved, setApproved] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<GMsg | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [staffMap, setStaffMap] = useState<Record<string, { role: AppRole; color: RoleColor | null }>>({});
  const restrictedWords = useRestrictedWords();
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const lastSentRef = useRef<number>(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [myFlags, setMyFlags] = useState<Record<string, { id: string; reason: string }>>({});
  const [flagDialog, setFlagDialog] = useState<{ msg: GMsg; existingId?: string } | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagBusy, setFlagBusy] = useState(false);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => {
      const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - lastSentRef.current));
      setCooldownLeft(remaining);
      if (remaining <= 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id, role, badge_color")
        .neq("role", "user");
      const map: Record<string, { role: AppRole; color: RoleColor | null }> = {};
      for (const row of (data ?? []) as Array<{ user_id: string; role: AppRole; badge_color: string | null }>) {
        const existing = map[row.user_id];
        // pick highest priority role per user
        if (!existing || ROLE_PRIORITY.indexOf(row.role) < ROLE_PRIORITY.indexOf(existing.role)) {
          map[row.user_id] = { role: row.role, color: (row.badge_color as RoleColor | null) ?? null };
        }
      }
      setStaffMap(map);
    })();
  }, [user]);

  // Carrega sinalizações
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("message_flags").select("id, message_id, flagged_by, reason");
      if (!active) return;
      const ids = new Set<string>();
      const mine: Record<string, { id: string; reason: string }> = {};
      for (const r of (data ?? []) as Array<{ id: string; message_id: string; flagged_by: string; reason: string }>) {
        ids.add(r.message_id);
        if (r.flagged_by === user.id) mine[r.message_id] = { id: r.id, reason: r.reason };
      }
      setFlaggedIds(ids);
      setMyFlags(mine);
    };
    load();
    const ch = supabase
      .channel("message-flags")
      .on("postgres_changes", { event: "*", schema: "public", table: "message_flags" }, () => { load(); })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setApproved((data?.status ?? "pending") === "approved"));
  }, [user]);

  const loadProfiles = async (ids: string[]) => {
    const missing = ids.filter((id) => !profiles[id]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url, verified")
      .in("id", missing);
    if (data) {
      setProfiles((p) => {
        const next = { ...p };
        for (const pr of data) next[pr.id] = pr as Profile;
        return next;
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from("global_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) { toast.error(error.message); return; }
      if (ignore) return;
      const list = ((data ?? []) as GMsg[]).slice().reverse();
      setMessages(list);
      await loadProfiles(Array.from(new Set(list.map((m) => m.sender_id))));
      markSeen(user.id, "community");
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    })();

    const ch = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_messages" },
        async (payload) => {
          const m = payload.new as GMsg;
          setMessages((prev) => [...prev, m]);
          await loadProfiles([m.sender_id]);
          if (user) markSeen(user.id, "community");
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "global_messages" },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "global_messages" },
        (payload) => {
          const updated = payload.new as GMsg;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .subscribe();
    return () => { ignore = true; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !user) return;
    const hit = findRestrictedWord(content, restrictedWords);
    if (hit) {
      setWarning(hit);
      return;
    }
    const since = Date.now() - lastSentRef.current;
    if (since < COOLDOWN_MS) {
      toast.error(`Aguarde ${Math.ceil((COOLDOWN_MS - since) / 1000)}s para enviar outra mensagem`);
      return;
    }
    setSending(true);
    const { error } = await supabase.from("global_messages").insert({
      sender_id: user.id,
      content,
      reply_to_id: replyTo?.id ?? null,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    setReplyTo(null);
    lastSentRef.current = Date.now();
    setCooldownLeft(COOLDOWN_MS);
  }

  async function remove(id: string) {
    const { error } = await supabase.from("global_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  }

  function openFlagDialog(m: GMsg) {
    const existing = myFlags[m.id];
    setFlagReason(existing?.reason ?? "");
    setFlagDialog({ msg: m, existingId: existing?.id });
  }

  async function submitFlag() {
    if (!flagDialog || !user) return;
    const reason = flagReason.trim();
    if (!reason) { toast.error("Descreva o motivo"); return; }
    setFlagBusy(true);
    if (flagDialog.existingId) {
      const { error } = await supabase
        .from("message_flags")
        .update({ reason })
        .eq("id", flagDialog.existingId);
      setFlagBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Sinalização atualizada");
    } else {
      const { error } = await supabase
        .from("message_flags")
        .insert({ message_id: flagDialog.msg.id, flagged_by: user.id, reason });
      setFlagBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Mensagem sinalizada");
    }
    setFlagDialog(null);
    setFlagReason("");
  }

  async function togglePin(m: GMsg) {
    const pinned_at = m.pinned_at ? null : new Date().toISOString();
    const { error } = await supabase.from("global_messages").update({ pinned_at }).eq("id", m.id);
    if (error) { toast.error("Não foi possível fixar."); return; }
    toast.success(pinned_at ? "Mensagem fixada" : "Mensagem desafixada");
  }

  function startEdit(m: GMsg) {
    setEditingId(m.id);
    setEditText(m.content);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }
  async function saveEdit(id: string) {
    const content = editText.trim().slice(0, 2000);
    if (!content) return;
    const original = messages.find((m) => m.id === id);
    if (original && original.content === content) { cancelEdit(); return; }
    const { error } = await supabase.from("global_messages").update({ content }).eq("id", id);
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
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <div className="animate-fade-up flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Comunidade</h1>
            <p className="text-sm text-muted-foreground">Chat global em tempo real — converse com todos</p>
          </div>
        </div>

        <div className="glass mt-6 flex flex-1 flex-col overflow-hidden rounded-3xl shadow-soft">
          {actionsOpenId && (
            <div
              className="fixed inset-0 z-30"
              onClick={() => setActionsOpenId(null)}
              aria-hidden="true"
            />
          )}
          {messages.some((m) => m.pinned_at) && (
            <div className="space-y-2 border-b border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Pin className="h-3.5 w-3.5" /> Mensagens fixadas
              </div>
              {messages
                .filter((m) => m.pinned_at)
                .sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? ""))
                .map((m) => {
                  const p = profiles[m.sender_id];
                  const name = p?.full_name?.split(" ")[0] ?? "Alguém";
                  const senderStaff = staffMap[m.sender_id];
                  return (
                    <div
                      key={`pin-${m.id}`}
                      className="flex items-stretch gap-2 rounded-lg bg-background/60 px-2 py-1.5 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => jumpToMessage(m.id)}
                        className="flex flex-1 items-stretch gap-2 text-left hover:opacity-80"
                      >
                        <span className="w-0.5 shrink-0 rounded bg-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            {name}
                            {senderStaff && (
                              <RoleBadge role={senderStaff.role} color={senderStaff.color} />
                            )}
                          </span>
                          <span className="line-clamp-2 text-muted-foreground">{m.content}</span>
                        </span>
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => togglePin(m)}
                          aria-label="Desafixar"
                          className="shrink-0 self-start rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <PinOff className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma mensagem ainda. Seja o primeiro!
              </div>
            ) : (
              messages
                .filter((m) => {
                  // Mensagens sinalizadas: visíveis ao autor e a staff; ocultas para os demais
                  if (!flaggedIds.has(m.id)) return true;
                  if (isStaffViewer) return true;
                  if (user && m.sender_id === user.id) return true;
                  return false;
                })
                .map((m) => {
                const p = profiles[m.sender_id];
                const mine = user && m.sender_id === user.id;
                const canDelete = mine || canModerateMessages;
                const canEdit = mine;
                const isEditing = editingId === m.id;
                const name = p?.full_name?.split(" ")[0] ?? "Alguém";
                const showActions = actionsOpenId === m.id;
                const enableLongPress = !isEditing;
                const replied = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;
                const repliedName = replied
                  ? (profiles[replied.sender_id]?.full_name?.split(" ")[0] ?? "Alguém")
                  : "";
                const isFlash = highlightId === m.id;
                const senderStaff = staffMap[m.sender_id];
                const senderIsAdmin = !!senderStaff && (senderStaff.role === "admin" || senderStaff.role === "super_admin") && (senderStaff.color ?? "gold") === "gold";
                const senderIsStaff = !!senderStaff;
                const isFlagged = flaggedIds.has(m.id);
                const myFlag = myFlags[m.id];
                return (
                  <div
                    key={m.id}
                    ref={(el) => { messageRefs.current[m.id] = el; }}
                    className={`group relative flex scroll-mt-24 items-start gap-3 rounded-xl transition-colors duration-500 ${isFlash ? "bg-primary/10" : ""} ${isFlagged && isStaffViewer ? "bg-destructive/5 ring-1 ring-destructive/30 px-2 py-1" : ""}`}
                  >
                    {mine ? (
                      <div className={`h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted ${senderIsAdmin ? "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-background" : senderIsStaff ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}>
                        {p?.photo_url ? (
                          <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-love text-sm font-semibold text-white">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to="/pretendentes/$id"
                        params={{ id: m.sender_id }}
                        className={`h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted transition hover:ring-2 hover:ring-primary/40 ${senderIsAdmin ? "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-background" : senderIsStaff ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : "ring-0"}`}
                        aria-label={`Ver perfil de ${name}`}
                      >
                        {p?.photo_url ? (
                          <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-love text-sm font-semibold text-white">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                    )}
                    <BubbleWrap
                      enableLongPress={!!enableLongPress}
                      onLongPress={() => setActionsOpenId(m.id)}
                      highlighted={showActions || isFlash}
                      isAdmin={senderIsAdmin}
                    >
                      <div className="flex items-baseline gap-2">
                        {mine ? (
                          <span className="flex items-center gap-1 text-sm font-semibold">
                            {name}
                            {senderStaff && (
                              senderIsAdmin ? (
                                <ShieldCheck className="admin-icon-sparkle h-3.5 w-3.5 shrink-0" aria-label="Admin" />
                              ) : (
                                <RoleBadge role={senderStaff.role} color={senderStaff.color} />
                              )
                            )}
                          </span>
                        ) : (
                          <Link
                            to="/pretendentes/$id"
                            params={{ id: m.sender_id }}
                            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {name}
                            {senderStaff && (
                              senderIsAdmin ? (
                                <ShieldCheck className="admin-icon-sparkle h-3.5 w-3.5 shrink-0" aria-label="Admin" />
                              ) : (
                                <RoleBadge role={senderStaff.role} color={senderStaff.color} />
                              )
                            )}
                          </Link>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {m.edited_at ? " · editado" : ""}
                        </span>
                      </div>
                      {replied && !isEditing && (
                        <button
                          type="button"
                          onClick={() => jumpToMessage(replied.id)}
                          className="mt-1 flex w-full items-stretch gap-2 rounded-md bg-foreground/5 px-2 py-1 text-left text-xs hover:bg-foreground/10"
                        >
                          <span className="w-0.5 shrink-0 rounded bg-primary" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-primary">{repliedName}</span>
                            <span className="line-clamp-2 text-muted-foreground">{replied.content}</span>
                          </span>
                        </button>
                      )}
                      {isEditing ? (
                        <div className="mt-1 flex flex-col gap-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            maxLength={2000}
                            autoFocus
                            className="w-full resize-none rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={() => saveEdit(m.id)}>
                              <Check className="mr-1 h-3.5 w-3.5" /> Salvar
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="mr-1 h-3.5 w-3.5" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{m.content}</p>
                      )}
                    </BubbleWrap>
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
                        className="absolute right-0 -top-10 z-40 flex items-center gap-1 rounded-full border border-border bg-popover px-1 py-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { setReplyTo(m); setActionsOpenId(null); }}
                          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground hover:bg-accent"
                          aria-label="Responder"
                        >
                          <Reply className="h-4 w-4" /> Responder
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => { setActionsOpenId(null); startEdit(m); }}
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground hover:bg-accent"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" /> Editar
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { setActionsOpenId(null); remove(m.id); }}
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                            aria-label="Apagar"
                          >
                            <Trash2 className="h-4 w-4" /> Excluir
                          </button>
                        )}
                        {canFlagMessages && user && m.sender_id !== user.id && (
                          <button
                            onClick={() => { setActionsOpenId(null); openFlagDialog(m); }}
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-amber-600 hover:bg-amber-500/10"
                            aria-label={myFlag ? "Editar sinalização" : "Sinalizar"}
                          >
                            <Flag className="h-4 w-4" /> {myFlag ? "Editar sinal." : "Sinalizar"}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => { setActionsOpenId(null); togglePin(m); }}
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-foreground hover:bg-accent"
                            aria-label={m.pinned_at ? "Desafixar" : "Fixar"}
                          >
                            {m.pinned_at ? <><PinOff className="h-4 w-4" /> Desafixar</> : <><Pin className="h-4 w-4" /> Fixar</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={send} className="flex flex-col gap-2 border-t border-border bg-background/60 p-3">
            {replyTo && (
              <div className="flex items-stretch gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="w-1 shrink-0 rounded bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-primary">
                    Respondendo a {profiles[replyTo.sender_id]?.full_name?.split(" ")[0] ?? "Alguém"}
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
            <div className="flex items-center gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={approved === false ? "Aguardando aprovação para enviar mensagens" : "Escreva uma mensagem para a comunidade..."}
                maxLength={2000}
                disabled={!approved || sending}
                className="flex-1"
              />
              <Button type="submit" disabled={!approved || sending || !text.trim() || cooldownLeft > 0} size="icon" className="rounded-full">
                {cooldownLeft > 0 ? (
                  <span className="text-[10px] font-semibold">{Math.ceil(cooldownLeft / 1000)}s</span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <RestrictedWordDialog word={warning} onClose={() => setWarning(null)} />
      <Dialog open={!!flagDialog} onOpenChange={(o) => { if (!o) { setFlagDialog(null); setFlagReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{flagDialog?.existingId ? "Editar sinalização" : "Sinalizar mensagem"}</DialogTitle>
            <DialogDescription>
              Descreva por que você acredita que esta mensagem fere as diretrizes da comunidade. Sua sinalização será revisada pelo Super Admin.
            </DialogDescription>
          </DialogHeader>
          {flagDialog && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground">Mensagem</p>
                <p className="mt-1 whitespace-pre-wrap break-words">{flagDialog.msg.content}</p>
              </div>
              <Textarea
                placeholder="Motivo da sinalização..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                maxLength={500}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFlagDialog(null); setFlagReason(""); }}>Cancelar</Button>
            <Button onClick={submitFlag} disabled={flagBusy || !flagReason.trim()}>
              {flagDialog?.existingId ? "Salvar" : "Sinalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RestrictedWordDialog({ word, onClose }: { word: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!word} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <DialogTitle className="text-center">Mensagem bloqueada</DialogTitle>
          <DialogDescription className="text-center">
            A palavra <span className="font-semibold text-foreground">"{word}"</span> fere as diretrizes da comunidade. Por favor, reescreva sua mensagem com respeito e cuidado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <Button onClick={onClose}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BubbleWrap({
  enableLongPress,
  onLongPress,
  highlighted,
  isAdmin,
  children,
}: {
  enableLongPress: boolean;
  onLongPress: () => void;
  highlighted: boolean;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const { pressing, handlers } = useLongPress(onLongPress, 450);
  const bound = enableLongPress ? handlers : {};
  return (
    <div
      {...bound}
      className={`flex-1 min-w-0 rounded-xl transition-all duration-200 ${
        enableLongPress ? "select-none md:select-text" : ""
      } ${isAdmin ? "admin-sparkle border-l-2 border-[var(--gold)] bg-[var(--gold-soft)]/30 pl-2" : ""} ${
        pressing ? "scale-[0.98] bg-primary/5 ring-2 ring-primary/30 px-2 -mx-2" : ""
      } ${
        highlighted ? "bg-primary/10 ring-2 ring-primary/50 px-2 -mx-2" : ""
      }`}
      style={enableLongPress ? { WebkitUserSelect: "none", WebkitTouchCallout: "none" } : undefined}
    >
      {children}
    </div>
  );
}