import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Search, UsersRound } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { OnlineDot } from "@/components/OnlineDot";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getActiveCommitmentByUser } from "@/lib/commitments";

export type ConversationShortcut = {
  matchId: string;
  partner: {
    id: string;
    full_name: string;
    photo_url: string | null;
    verified?: boolean | null;
    equipped_frame_id?: string | null;
    equipped_aura_id?: string | null;
  };
  lastMessage: string | null;
  lastAt: string;
  unread: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMatchId?: string;
  currentType?: "private" | "community";
};

const COMMUNITY_KEYWORDS = ["comunidade", "geral", "chat", "comunidade geral", "global"];

/**
 * Reusable drawer that lists the user's conversations with the global
 * community pinned at the top. Loads its own data lazily when opened.
 */
export function ConversationDrawer({
  open,
  onOpenChange,
  currentMatchId,
  currentType,
}: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<ConversationShortcut[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const commitment = await getActiveCommitmentByUser(user.id);
      const { data: matches } = await supabase
        .from("matches")
        .select("id, user_a, user_b, created_at")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });
      const visible = commitment
        ? (matches ?? []).filter((m) => m.id === commitment.match_id)
        : (matches ?? []);
      if (!visible.length) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const partnerIds = visible.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, verified, equipped_frame_id, equipped_aura_id")
        .in("id", partnerIds);
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      const list = await Promise.all(
        visible.map(async (m) => {
          const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
          const { data: msgs } = await supabase
            .from("messages")
            .select("content, sender_id, created_at, read_at")
            .eq("match_id", m.id)
            .order("created_at", { ascending: false })
            .limit(1);
          const last = msgs?.[0] ?? null;
          const p = profMap.get(partnerId);
          return {
            matchId: m.id,
            partner: {
              id: partnerId,
              full_name: p?.full_name ?? "Conversa",
              photo_url: p?.photo_url ?? null,
              verified: p?.verified ?? null,
              equipped_frame_id: p?.equipped_frame_id ?? null,
              equipped_aura_id: p?.equipped_aura_id ?? null,
            },
            lastMessage: last?.content ?? null,
            lastAt: last?.created_at ?? m.created_at,
            unread: !!last && last.sender_id !== user.id && !last.read_at,
          } satisfies ConversationShortcut;
        }),
      );
      list.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? items.filter((i) => i.partner.full_name.toLowerCase().includes(q)) : items),
    [items, q],
  );
  const showCommunity = !q || COMMUNITY_KEYWORDS.some((k) => k.includes(q) || q.includes(k));
  const communityActive = currentType === "community";

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col p-0">
        <SheetHeader className="border-b border-border px-4 pb-3 pt-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            Conversas
          </SheetTitle>
        </SheetHeader>
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="mobile-chat-scroll flex-1 overflow-y-auto p-3 space-y-2">
          {showCommunity && (
            <Link
              to="/conversas/comunidade"
              onClick={close}
              className={`tap flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                communityActive
                  ? "border-primary/40 bg-primary/10"
                  : "border-[var(--rose)]/15 bg-gradient-to-br from-[oklch(0.98_0.02_25)] to-[oklch(0.97_0.03_20)] hover:bg-muted/40 dark:from-[oklch(0.22_0.04_20)] dark:to-[oklch(0.18_0.03_20)]"
              }`}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rose)] to-[oklch(0.72_0.15_30)] text-white shadow-sm">
                <UsersRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">Comunidade Geral</p>
                  <span className="shrink-0 rounded-full bg-[var(--rose)]/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--rose)]">
                    Fixado
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  Chat global do VaiDarNamoro
                </p>
              </div>
            </Link>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : filtered.length === 0 && !showCommunity ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
              <MessageCircle className="mb-3 h-8 w-8 text-muted-foreground/60" />
              Nenhuma conversa encontrada.
            </div>
          ) : filtered.length === 0 ? null : (
            filtered.map((item) => {
              const active = currentType === "private" && item.matchId === currentMatchId;
              return (
                <Link
                  key={item.matchId}
                  to="/conversas/$matchId"
                  params={{ matchId: item.matchId }}
                  onClick={close}
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
                    <OnlineDot userId={item.partner.id} className="absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{item.partner.full_name}</p>
                      {item.partner.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.lastMessage ?? "Nenhuma mensagem ainda"}
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
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}