import { friendlyError } from "@/lib/errors";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Users, Pencil, Check, X, Reply, MoreHorizontal, Pin, PinOff, ShieldCheck, Flag, HandHeart, Plus, Sticker as StickerIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { markSeen } from "@/lib/lastSeen";
import { RoleBadge } from "@/components/RoleBadge";
import { type AppRole, type RoleColor, ROLE_PRIORITY } from "@/lib/roles";
import { useRestrictedWords, findRestrictedWord } from "@/lib/profanity";
import { ShieldAlert } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { StickerPicker } from "@/components/stickers/StickerPicker";
import { StickerMessage } from "@/components/stickers/StickerMessage";
import { fetchStickers, type Sticker } from "@/lib/stickers";
import { AnimatePresence, motion } from "framer-motion";
import { spendCoin } from "@/lib/coins";
import { TypingIndicator, useTypingBroadcaster } from "@/components/TypingIndicator";

const COOLDOWN_MS = 10_000;

type GMsg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  reply_to_id?: string | null;
  pinned_at?: string | null;
  sticker_id?: string | null;
};
type Profile = {
  id: string;
  full_name: string;
  photo_url: string | null;
  verified?: boolean | null;
  contributor_highlight?: boolean | null;
  equipped_frame_id?: string | null;
  equipped_aura_id?: string | null;
};

export const Route = createFileRoute("/comunidade")({ component: () => (<RequireApproved><Comunidade /></RequireApproved>) });

function Comunidade() {
  const { user, isAdmin, role, loading } = useAuth();
  const canModerateMessages = isAdmin || role === "moderador";
  const canFlagMessages = isAdmin || role === "moderador" || role === "apresentador";
  const isStaffViewer = canFlagMessages;
  const [messages, setMessages] = useState<GMsg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [approved, setApproved] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<GMsg | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [staffMap, setStaffMap] = useState<Record<string, { role: AppRole; color: RoleColor | null }>>({});
  const [contribIds, setContribIds] = useState<Set<string>>(new Set());
  const restrictedWords = useRestrictedWords();
  const [warning, setWarning] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [myFlags, setMyFlags] = useState<Record<string, { id: string; reason: string }>>({});
  const [flagDialog, setFlagDialog] = useState<{ msg: GMsg; existingId?: string } | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagBusy, setFlagBusy] = useState(false);
  const [stickerCache, setStickerCache] = useState<Record<string, Sticker>>({});
  const stickerCacheRef = useRef<Record<string, Sticker>>({});
  useEffect(() => { stickerCacheRef.current = stickerCache; }, [stickerCache]);

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
      .select("id, full_name, photo_url, verified, contributor_highlight, equipped_frame_id, equipped_aura_id")
      .in("id", missing);
    if (data) {
      setProfiles((p) => {
        const next = { ...p };
        for (const pr of data) next[pr.id] = pr as Profile;
        return next;
      });
    }
    // Verifica quais desses ids têm a badge "contributor" ativa
    const { data: badgeRows } = await supabase
      .from("user_badges")
      .select("user_id, active, expires_at, badges(code)")
      .in("user_id", missing)
      .eq("active", true);
    if (badgeRows && badgeRows.length) {
      const now = Date.now();
      const newIds = new Set<string>();
      for (const r of badgeRows as Array<{ user_id: string; active: boolean; expires_at: string | null; badges: { code: string } | null }>) {
        if (r.badges?.code !== "contributor") continue;
        if (r.expires_at && new Date(r.expires_at).getTime() <= now) continue;
        newIds.add(r.user_id);
      }
      if (newIds.size) setContribIds((prev) => { const n = new Set(prev); newIds.forEach((id) => n.add(id)); return n; });
    }
  };

  const loadStickersByIds = useCallback(async (ids: string[]) => {
    const cache = stickerCacheRef.current;
    const missing = Array.from(new Set(ids.filter((id) => id && !cache[id])));
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("stickers")
      .select("id, category_id, name, storage_path, public_url, mime_type, is_animated, active, sort_order")
      .in("id", missing);
    if (data && data.length) {
      setStickerCache((prev) => {
        const next = { ...prev };
        for (const s of data as Sticker[]) next[s.id] = s;
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from("global_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) { toast.error(friendlyError(error)); return; }
      if (ignore) return;
      const list = ((data ?? []) as GMsg[]).slice().reverse();
      setMessages(list);
      await loadProfiles(Array.from(new Set(list.map((m) => m.sender_id))));
      const stickerIds = Array.from(new Set(list.map((m) => m.sticker_id).filter(Boolean) as string[]));
      if (stickerIds.length) loadStickersByIds(stickerIds);
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
          if (m.sticker_id) loadStickersByIds([m.sticker_id]);
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

  // Derived lookups — memoized to avoid O(n^2) reply scans and inline filters
  const messagesById = useMemo(() => {
    const m = new Map<string, GMsg>();
    for (const msg of messages) m.set(msg.id, msg);
    return m;
  }, [messages]);

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.pinned_at).sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? "")),
    [messages]
  );

  const visibleMessages = useMemo(
    () =>
      messages.filter((m) => {
        if (!flaggedIds.has(m.id)) return true;
        if (isStaffViewer) return true;
        if (user && m.sender_id === user.id) return true;
        return false;
      }),
    [messages, flaggedIds, isStaffViewer, user]
  );

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!content || !user) return false;
    const hit = findRestrictedWord(content, restrictedWords);
    if (hit) {
      setWarning(hit);
      return false;
    }
    const { error } = await supabase.from("global_messages").insert({
      sender_id: user.id,
      content,
      reply_to_id: replyTo?.id ?? null,
    });
    if (error) { toast.error(friendlyError(error)); return false; }
    setReplyTo(null);
    return true;
  }, [user, restrictedWords, replyTo]);

  const sendSticker = useCallback(async (s: Sticker): Promise<boolean> => {
    if (!user) return false;
    // Cobrar 1 moeda antes do envio
    try {
      await spendCoin(1);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      if (msg.includes("insufficient_coins")) {
        toast.error("Você não possui moedas suficientes.", {
          action: {
            label: "Ir para Conquistas",
            onClick: () => { window.location.href = "/perfil?tab=missions"; },
          },
        });
      } else {
        toast.error("Não foi possível enviar o sticker.");
      }
      return false;
    }
    const { error } = await supabase.from("global_messages").insert({
      sender_id: user.id,
      content: "",
      sticker_id: s.id,
      reply_to_id: replyTo?.id ?? null,
    });
    if (error) { toast.error(friendlyError(error)); return false; }
    setStickerCache((prev) => (prev[s.id] ? prev : { ...prev, [s.id]: s }));
    setReplyTo(null);
    return true;
  }, [user, replyTo]);

  async function remove(id: string) {
    const { error } = await supabase.from("global_messages").delete().eq("id", id);
    if (error) toast.error(friendlyError(error));
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
      if (error) { toast.error(friendlyError(error)); return; }
      toast.success("Sinalização atualizada");
    } else {
      const { error } = await supabase
        .from("message_flags")
        .insert({ message_id: flagDialog.msg.id, flagged_by: user.id, reason });
      setFlagBusy(false);
      if (error) { toast.error(friendlyError(error)); return; }
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
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-semibold">Comunidade</h1>
            <p className="text-sm text-muted-foreground">Chat global em tempo real — converse com todos</p>
          </div>
          <Link
            to="/oracoes"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium transition hover:bg-accent"
          >
            <HandHeart className="h-4 w-4" />
            <span className="hidden sm:inline">Pedidos de oração</span>
            <span className="sm:hidden">Orações</span>
          </Link>
        </div>

        <div className="glass mt-6 flex flex-1 flex-col overflow-hidden rounded-3xl shadow-soft">
          {pinnedMessages.length > 0 && (
            <div className="space-y-2 border-b border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Pin className="h-3.5 w-3.5" /> Mensagens fixadas
              </div>
              {pinnedMessages.map((m) => {
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
                            {p?.verified && <VerifiedBadge size="sm" />}
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
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma mensagem ainda. Seja o primeiro!
              </div>
            ) : (
              visibleMessages.map((m) => {
                const p = profiles[m.sender_id];
                const mine = user && m.sender_id === user.id;
                const canDelete = mine || canModerateMessages;
                const canEdit = mine;
                const isEditing = editingId === m.id;
                const name = p?.full_name?.split(" ")[0] ?? "Alguém";
                const showActions = actionsOpenId === m.id;
                const replied = m.reply_to_id ? messagesById.get(m.reply_to_id) ?? null : null;
                const repliedName = replied
                  ? (profiles[replied.sender_id]?.full_name?.split(" ")[0] ?? "Alguém")
                  : "";
                const isFlash = highlightId === m.id;
                const senderStaff = staffMap[m.sender_id];
                const senderIsAdmin = !!senderStaff && (senderStaff.role === "admin" || senderStaff.role === "super_admin") && (senderStaff.color ?? "gold") === "gold";
                const senderIsStaff = !!senderStaff;
                const senderContribOn = !senderIsAdmin && contribIds.has(m.sender_id) && (p?.contributor_highlight !== false);
                const isFlagged = flaggedIds.has(m.id);
                const myFlag = myFlags[m.id];
                return (
                  <div
                    key={m.id}
                    ref={(el) => { messageRefs.current[m.id] = el; }}
                    className={`group relative flex scroll-mt-24 items-start gap-3 rounded-xl transition-colors duration-500 ${isFlash ? "bg-primary/10" : ""} ${isFlagged && isStaffViewer ? "bg-destructive/5 ring-1 ring-destructive/30 px-2 py-1" : ""}`}
                  >
                    {mine ? (
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${senderIsAdmin ? "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-background" : senderContribOn ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background" : senderIsStaff ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""}`}>
                        <DecoratedAvatar
                          photoUrl={p?.photo_url ?? null}
                          fallback={name.charAt(0).toUpperCase()}
                          size={36}
                          frameId={p?.equipped_frame_id ?? null}
                          auraId={p?.equipped_aura_id ?? null}
                        />
                      </div>
                    ) : (
                      <Link
                        to="/pretendentes/$id"
                        params={{ id: m.sender_id }}
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full transition hover:ring-2 hover:ring-primary/40 ${senderIsAdmin ? "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-background" : senderContribOn ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background" : senderIsStaff ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : "ring-0"}`}
                        aria-label={`Ver perfil de ${name}`}
                      >
                        <DecoratedAvatar
                          photoUrl={p?.photo_url ?? null}
                          fallback={name.charAt(0).toUpperCase()}
                          size={36}
                          frameId={p?.equipped_frame_id ?? null}
                          auraId={p?.equipped_aura_id ?? null}
                        />
                        <span className="absolute -bottom-0.5 -right-0.5"><OnlineDot userId={m.sender_id} size="xs" /></span>
                      </Link>
                    )}
                    <BubbleWrap
                      highlighted={showActions || isFlash}
                      isAdmin={senderIsAdmin}
                      isContributor={senderContribOn}
                    >
                      <div className="flex items-baseline gap-2">
                        {mine ? (
                          <span className="flex items-center gap-1 text-sm font-semibold">
                            {name}
                            {p?.verified && <VerifiedBadge size="sm" />}
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
                            {p?.verified && <VerifiedBadge size="sm" />}
                            {senderStaff && (
                              senderIsAdmin ? (
                                <ShieldCheck className="admin-icon-sparkle h-3.5 w-3.5 shrink-0" aria-label="Admin" />
                              ) : (
                                <RoleBadge role={senderStaff.role} color={senderStaff.color} />
                              )
                            )}
                          </Link>
                        )}
                        <UserBadges userId={m.sender_id} size="xs" max={2} />
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
                            {replied.sticker_id && stickerCache[replied.sticker_id] ? (
                              <span className="text-muted-foreground">Sticker</span>
                            ) : (
                              <span className="line-clamp-2 text-muted-foreground">{replied.content}</span>
                            )}
                          </span>
                          {replied.sticker_id && stickerCache[replied.sticker_id] && (
                            <img
                              src={stickerCache[replied.sticker_id].public_url}
                              alt=""
                              className="h-10 w-10 shrink-0 select-none object-contain"
                              draggable={false}
                            />
                          )}
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
                        m.sticker_id ? (
                          stickerCache[m.sticker_id] ? (
                            <StickerMessage url={stickerCache[m.sticker_id].public_url} alt={stickerCache[m.sticker_id].name} />
                          ) : (
                            <div className="mt-1 h-32 w-32 animate-pulse rounded-xl bg-muted/40" />
                          )
                        ) : (
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{m.content}</p>
                        )
                      )}
                    </BubbleWrap>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActionsOpenId(m.id); }}
                        aria-label="Mais opções"
                        className="flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full text-muted-foreground transition-opacity hover:bg-accent hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <ChatComposer
            approved={!!approved}
            userId={user?.id ?? null}
            replyTo={replyTo}
            replyToName={replyTo ? profiles[replyTo.sender_id]?.full_name?.split(" ")[0] ?? "Alguém" : ""}
            replyToStickerUrl={replyTo?.sticker_id ? stickerCache[replyTo.sticker_id]?.public_url ?? null : null}
            onCancelReply={() => setReplyTo(null)}
            onSend={sendMessage}
            onSendSticker={sendSticker}
          />
        </div>
      </main>
      <RestrictedWordDialog word={warning} onClose={() => setWarning(null)} />
      <ActionsSheet
        msg={actionsOpenId ? messagesById.get(actionsOpenId) ?? null : null}
        onClose={() => setActionsOpenId(null)}
        currentUserId={user?.id ?? null}
        canModerateMessages={canModerateMessages}
        canFlagMessages={canFlagMessages}
        isAdmin={isAdmin}
        myFlags={myFlags}
        onReply={(m) => { setReplyTo(m); setActionsOpenId(null); }}
        onEdit={(m) => { setActionsOpenId(null); startEdit(m); }}
        onDelete={(m) => { setActionsOpenId(null); remove(m.id); }}
        onFlag={(m) => { setActionsOpenId(null); openFlagDialog(m); }}
        onPin={(m) => { setActionsOpenId(null); togglePin(m); }}
      />
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
  highlighted,
  isAdmin,
  isContributor,
  children,
}: {
  highlighted: boolean;
  isAdmin?: boolean;
  isContributor?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex-1 min-w-0 rounded-xl transition-all duration-200 ${isAdmin ? "admin-sparkle border-l-2 border-[var(--gold)] bg-[var(--gold-soft)]/30 pl-2" : isContributor ? "contributor-sparkle border-l-2 border-emerald-500 bg-emerald-500/10 pl-2" : ""} ${
        highlighted ? "bg-primary/10 ring-2 ring-primary/50 px-2 -mx-2" : ""
      }`}
    >
      {children}
    </div>
  );
}

function ActionsSheet({
  msg,
  onClose,
  currentUserId,
  canModerateMessages,
  canFlagMessages,
  isAdmin,
  myFlags,
  onReply,
  onEdit,
  onDelete,
  onFlag,
  onPin,
}: {
  msg: GMsg | null;
  onClose: () => void;
  currentUserId: string | null;
  canModerateMessages: boolean;
  canFlagMessages: boolean;
  isAdmin: boolean;
  myFlags: Record<string, { id: string; reason: string }>;
  onReply: (m: GMsg) => void;
  onEdit: (m: GMsg) => void;
  onDelete: (m: GMsg) => void;
  onFlag: (m: GMsg) => void;
  onPin: (m: GMsg) => void;
}) {
  const open = !!msg;
  const mine = !!msg && !!currentUserId && msg.sender_id === currentUserId;
  const canDelete = mine || canModerateMessages;
  const canEdit = mine;
  const canShowFlag = canFlagMessages && !!msg && !!currentUserId && msg.sender_id !== currentUserId;
  const myFlag = msg ? myFlags[msg.id] : undefined;
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 sm:max-w-md sm:mx-auto"
      >
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-base">Ações da mensagem</SheetTitle>
        </SheetHeader>
        {msg && (
          <div className="px-2 pb-4">
            <p className="mx-2 mb-2 line-clamp-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {msg.content}
            </p>
            <div className="flex flex-col">
              <ActionRow icon={<Reply className="h-5 w-5" />} label="Responder" onClick={() => onReply(msg)} />
              {canEdit && (
                <ActionRow icon={<Pencil className="h-5 w-5" />} label="Editar" onClick={() => onEdit(msg)} />
              )}
              {canShowFlag && (
                <ActionRow
                  icon={<Flag className="h-5 w-5" />}
                  label={myFlag ? "Editar sinalização" : "Sinalizar"}
                  onClick={() => onFlag(msg)}
                  tone="warn"
                />
              )}
              {isAdmin && (
                <ActionRow
                  icon={msg.pinned_at ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                  label={msg.pinned_at ? "Desafixar" : "Fixar"}
                  onClick={() => onPin(msg)}
                />
              )}
              {canDelete && (
                <ActionRow
                  icon={<Trash2 className="h-5 w-5" />}
                  label="Excluir"
                  onClick={() => onDelete(msg)}
                  tone="danger"
                />
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "danger" | "warn";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive hover:bg-destructive/10 active:bg-destructive/20"
      : tone === "warn"
      ? "text-amber-600 hover:bg-amber-500/10 active:bg-amber-500/20"
      : "text-foreground hover:bg-accent active:bg-accent/80";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${toneClass}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const ChatComposer = memo(function ChatComposer({
  approved,
  userId,
  replyTo,
  replyToName,
  replyToStickerUrl,
  onCancelReply,
  onSend,
  onSendSticker,
}: {
  approved: boolean;
  userId: string | null;
  replyTo: GMsg | null;
  replyToName: string;
  replyToStickerUrl: string | null;
  onCancelReply: () => void;
  onSend: (content: string) => Promise<boolean>;
  onSendSticker: (s: Sticker) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [plusOpen, setPlusOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastSentRef = useRef<number>(0);
  const broadcastTyping = useTypingBroadcaster(userId);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => {
      const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - lastSentRef.current));
      setCooldownLeft(remaining);
      if (remaining <= 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  // Garante broadcast em teclados mobile que não disparam onChange a cada caractere
  useEffect(() => {
    if (text.trim().length > 0) broadcastTyping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    const since = Date.now() - lastSentRef.current;
    if (since < COOLDOWN_MS) {
      toast.error(`Aguarde ${Math.ceil((COOLDOWN_MS - since) / 1000)}s para enviar outra mensagem`);
      return;
    }
    setSending(true);
    const ok = await onSend(content);
    setSending(false);
    if (ok) {
      setText("");
      lastSentRef.current = Date.now();
      setCooldownLeft(COOLDOWN_MS);
    }
  }

  async function handleSticker(s: Sticker) {
    const since = Date.now() - lastSentRef.current;
    if (since < COOLDOWN_MS) {
      toast.error(`Aguarde ${Math.ceil((COOLDOWN_MS - since) / 1000)}s para enviar outro sticker`);
      return;
    }
    const ok = await onSendSticker(s);
    if (ok) {
      lastSentRef.current = Date.now();
      setCooldownLeft(COOLDOWN_MS);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0 border-t border-border bg-background/60">
      <TypingIndicator selfId={userId} />
      <div className="flex flex-col gap-2 p-3 pt-2">
      {replyTo && (
        <div className="flex items-stretch gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="w-1 shrink-0 rounded bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">Respondendo a {replyToName}</p>
            {replyToStickerUrl ? (
              <p className="text-xs text-muted-foreground">Sticker</p>
            ) : (
              <p className="line-clamp-1 text-xs text-muted-foreground">{replyTo.content}</p>
            )}
          </div>
          {replyToStickerUrl && (
            <img
              src={replyToStickerUrl}
              alt=""
              className="h-10 w-10 shrink-0 select-none object-contain"
              draggable={false}
            />
          )}
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label="Cancelar resposta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="relative flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setPlusOpen((v) => !v)}
            disabled={!approved}
            aria-label="Mais opções de envio"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <motion.span animate={{ rotate: plusOpen ? 45 : 0 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
              <Plus className="h-4 w-4" />
            </motion.span>
          </button>
          <AnimatePresence>
            {plusOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setPlusOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="absolute bottom-full left-0 z-40 mb-2 min-w-[160px] overflow-hidden rounded-xl border border-border bg-background/95 p-1 shadow-xl backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() => { setPlusOpen(false); setPickerOpen(true); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-accent"
                  >
                    <StickerIcon className="h-4 w-4 text-primary" />
                    Sticker
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <StickerPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={handleSticker} />
        </div>
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim().length > 0) broadcastTyping();
          }}
          placeholder={!approved ? "Aguardando aprovação para enviar mensagens" : "Escreva uma mensagem para a comunidade..."}
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
      </div>
    </form>
  );
});