import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { MessageCircle } from "lucide-react";

type Item = {
  matchId: string;
  partner: { id: string; full_name: string; photo_url: string | null; city: string; state: string };
  lastMessage: string | null;
  lastAt: string;
  unread: boolean;
};

export const Route = createFileRoute("/conversas/")({ component: List });

function List() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  async function load() {
    if (!user) return;
    const { data: matches } = await supabase
      .from("matches").select("id, user_a, user_b, created_at")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (!matches?.length) { setItems([]); setLoadingList(false); return; }
    const partnerIds = matches.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
    const { data: profs } = await supabase.from("profiles").select("id,full_name,photo_url,city,state").in("id", partnerIds);
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
    const list: Item[] = await Promise.all(matches.map(async (m) => {
      const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
      const { data: msgs } = await supabase
        .from("messages").select("content, sender_id, created_at, read_at")
        .eq("match_id", m.id).order("created_at", { ascending: false }).limit(1);
      const last = msgs?.[0];
      return {
        matchId: m.id,
        partner: profMap.get(partnerId) ?? { id: partnerId, full_name: "—", photo_url: null, city: "", state: "" },
        lastMessage: last?.content ?? null,
        lastAt: last?.created_at ?? m.created_at,
        unread: !!last && last.sender_id !== user.id && !last.read_at,
      };
    }));
    list.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    setItems(list); setLoadingList(false);
  }

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
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
          ) : items.map((i) => (
            <Link key={i.matchId} to="/conversas/$matchId" params={{ matchId: i.matchId }}
              className="glass hover-lift flex items-center gap-4 rounded-2xl p-4 shadow-soft">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                {i.partner.photo_url ? <img src={i.partner.photo_url} alt="" className="h-full w-full object-cover" /> :
                  <div className="flex h-full w-full items-center justify-center bg-gradient-love text-xl text-white">{i.partner.full_name.charAt(0)}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-semibold">{i.partner.full_name.split(" ")[0]}</h3>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(i.lastAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className={`truncate text-sm ${i.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {i.lastMessage ?? "Diga olá 👋"}
                </p>
              </div>
              {i.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--rose)]" />}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}