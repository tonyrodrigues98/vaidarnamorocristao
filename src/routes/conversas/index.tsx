import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { MessageCircle, Search, UsersRound } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { CommitmentPauseCard } from "@/components/commitment/CommitmentPauseCard";
import { getActiveCommitmentByUser, type RelationshipCommitment } from "@/lib/commitments";

type Item = {
  matchId: string;
  partner: {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
    verified?: boolean | null;
    equipped_frame_id?: string | null;
    equipped_aura_id?: string | null;
    committed?: boolean;
  };
  lastMessage: string | null;
  lastAt: string;
  unread: boolean;
};

export const Route = createFileRoute("/conversas/")({
  component: () => (
    <RequireApproved>
      <List />
    </RequireApproved>
  ),
});

function List() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeCommitment, setActiveCommitment] = useState<RelationshipCommitment | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    if (!user) return;
    const commitment = await getActiveCommitmentByUser(user.id);
    setActiveCommitment(commitment);
    if (commitment) {
      setItems([]);
      setLoadingList(false);
      return;
    }
    const { data: bl } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const blockedSet = new Set((bl ?? []).map((b) => b.blocked_id as string));
    const { data: matches } = await supabase
      .from("matches")
      .select("id, user_a, user_b, created_at")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (!matches?.length) {
      setItems([]);
      setLoadingList(false);
      return;
    }
    const visibleMatches = matches.filter((m) => {
      const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
      return !blockedSet.has(partnerId);
    });
    if (!visibleMatches.length) {
      setItems([]);
      setLoadingList(false);
      return;
    }
    const partnerIds = visibleMatches.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
    const { data: commitments } = await supabase
      .from("relationship_commitments")
      .select(
        `
      user_a,
      user_b,
      status
    `,
      )
      .eq("status", "active");
    const committedUsers = new Set<string>();

    (commitments ?? []).forEach((c) => {
      committedUsers.add(c.user_a);
      committedUsers.add(c.user_b);
    });
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,full_name,photo_url,city,state,verified,equipped_frame_id,equipped_aura_id")
      .in("id", partnerIds);
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
    const list: Item[] = await Promise.all(
      visibleMatches.map(async (m) => {
        const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, sender_id, created_at, read_at")
          .eq("match_id", m.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const last = msgs?.[0];
        return {
          matchId: m.id,
          partner: {
            ...(profMap.get(partnerId) ?? {
              id: partnerId,
              full_name: "—",
              photo_url: null,
              city: "",
              state: "",
            }),

            committed: committedUsers.has(partnerId),
          },
          lastMessage: last?.content ?? null,
          lastAt: last?.created_at ?? m.created_at,
          unread: !!last && last.sender_id !== user.id && !last.read_at,
        };
      }),
    );
    list.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    setItems(list);
    setLoadingList(false);
  }

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "relationship_commitments" },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? items.filter((i) => i.partner.full_name.toLowerCase().includes(q))
    : items;
  const COMMUNITY_KEYWORDS = ["comunidade", "geral", "chat", "comunidade geral"];
  const showCommunity = !q || COMMUNITY_KEYWORDS.some((k) => k.includes(q) || q.includes(k));

  return (
    <div className="min-h-screen bg-[oklch(0.99_0.005_60)] dark:bg-background">
      <Header />
      <MobileAppHeader title="Conversas" subtitle="Mensagens e comunidade" />
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-4 sm:pt-8">
        <div className="hidden animate-fade-up sm:block">
          <h1 className="text-3xl font-semibold tracking-tight">Conversas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mensagens e comunidade.</p>
        </div>

        {/* Search */}
        <div className="mt-4 sm:mt-6">
          <label className="relative block">
            <span className="sr-only">Buscar conversas</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar conversas"
              className="h-11 w-full rounded-2xl border border-border/60 bg-card/80 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-[var(--rose)]/50 focus:ring-2 focus:ring-[var(--rose)]/20"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {/* Pinned: Comunidade Geral */}
          {showCommunity && (
            <Link
              to="/conversas/comunidade"
              className="group flex items-center gap-4 rounded-2xl border border-[var(--rose)]/15 bg-gradient-to-br from-[oklch(0.98_0.02_25)] to-[oklch(0.97_0.03_20)] p-4 shadow-sm transition hover:shadow-md dark:from-[oklch(0.22_0.04_20)] dark:to-[oklch(0.18_0.03_20)]"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rose)] to-[oklch(0.72_0.15_30)] text-white shadow-sm">
                <UsersRound className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                    Comunidade Geral
                  </h3>
                  <span className="shrink-0 rounded-full bg-[var(--rose)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--rose)]">
                    Fixado
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  Chat global do VaiDarNamoro
                </p>
              </div>
            </Link>
          )}

          {activeCommitment ? (
            <CommitmentPauseCard
              matchId={activeCommitment.match_id}
              description="Você está em um propósito ativo. Por isso, suas outras conversas ficam arquivadas e fora de vista enquanto esse compromisso estiver firmado."
            />
          ) : loadingList ? (
            <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card/70 p-10 text-center text-sm text-muted-foreground shadow-sm">
              <MessageCircle className="mx-auto mb-3 h-7 w-7 text-[var(--rose)]" />
              Quando houver interesse mútuo, suas conversas aparecerão aqui.
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 p-6 text-center text-sm text-muted-foreground">
              Nenhuma conversa encontrada para "{query}".
            </div>
          ) : (
            filteredItems.map((i) => (
              <Link
                key={i.matchId}
                to="/conversas/$matchId"
                params={{ matchId: i.matchId }}
                className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/80 p-3.5 shadow-sm transition hover:bg-card hover:shadow-md active:scale-[0.997]"
              >
                <div className="relative flex shrink-0 items-center justify-center">
                  <DecoratedAvatar
                    photoUrl={i.partner.photo_url}
                    fallback={i.partner.full_name.charAt(0)}
                    size={44}
                    frameId={i.partner.equipped_frame_id ?? null}
                    auraId={i.partner.equipped_aura_id ?? null}
                    isCommitted={i.partner.committed}
                  />
                  <span className="absolute bottom-0 right-0">
                    <OnlineDot userId={i.partner.id} size="sm" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="flex min-w-0 items-center gap-1.5 truncate font-semibold">
                      <span className="truncate">{i.partner.full_name.split(" ")[0]}</span>
                      {i.partner.verified && <VerifiedBadge size="sm" />}
                    </h3>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(i.lastAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <UserBadges userId={i.partner.id} size="xs" max={2} className="mt-0.5" />
                  <p
                    className={`truncate text-sm ${i.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {i.lastMessage ?? "Diga olá"}
                  </p>
                </div>
                {i.unread && (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--rose)]" />
                )}
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
