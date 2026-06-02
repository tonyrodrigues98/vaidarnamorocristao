import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { MessageCircle } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";

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

  async function load() {
    if (!user) return;
    const { data: bl } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
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
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="text-4xl font-semibold">Conversas</h1>
          <p className="mt-1 text-muted-foreground">Suas conexões com interesse mútuo.</p>
        </div>

        <div className="mt-8 space-y-3">
          {loadingList ? (
            <div className="glass h-24 animate-pulse rounded-2xl" />
          ) : items.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-muted-foreground shadow-soft">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[var(--rose)]" />
              Quando houver interesse mútuo, suas conversas aparecerão aqui.
            </div>
          ) : (
            items.map((i) => (
              <Link
                key={i.matchId}
                to="/conversas/$matchId"
                params={{ matchId: i.matchId }}
                className="glass hover-lift flex items-center gap-4 rounded-2xl p-4 shadow-soft"
              >
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                  <DecoratedAvatar
                    photoUrl={i.partner.photo_url}
                    fallback={i.partner.full_name.charAt(0)}
                    size={56}
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
                    {i.lastMessage ?? "Diga olá 👋"}
                  </p>
                </div>
                {i.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--rose)]" />}
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
