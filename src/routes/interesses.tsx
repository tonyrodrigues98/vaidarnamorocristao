import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heart, MessageCircle, Sparkles } from "lucide-react";

type ProfileLite = {
  id: string; full_name: string; age: number; city: string; state: string;
  church: string; photo_url: string | null;
};
type ReceivedRow = { id: string; created_at: string; sender: ProfileLite | null };
type SentRow = { id: string; created_at: string; receiver: ProfileLite | null };

export const Route = createFileRoute("/interesses")({ component: Page });

function Page() {
  const { user, loading } = useAuth();
  const [received, setReceived] = useState<ReceivedRow[]>([]);
  const [sent, setSent] = useState<SentRow[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const [rec, snt, mts] = await Promise.all([
      supabase.from("interests").select("id, created_at, sender:profiles!interests_sender_id_fkey(id,full_name,age,city,state,church,photo_url)").eq("receiver_id", user.id).order("created_at", { ascending: false }),
      supabase.from("interests").select("id, created_at, receiver:profiles!interests_receiver_id_fkey(id,full_name,age,city,state,church,photo_url)").eq("sender_id", user.id).order("created_at", { ascending: false }),
      supabase.from("matches").select("user_a, user_b").or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    ]);
    // The FK names may not exist for the join. Fallback: do manual fetch if shapes missing
    if (rec.error || snt.error) {
      // manual fetch fallback
      const r = await supabase.from("interests").select("id, created_at, sender_id").eq("receiver_id", user.id).order("created_at", { ascending: false });
      const s = await supabase.from("interests").select("id, created_at, receiver_id").eq("sender_id", user.id).order("created_at", { ascending: false });
      const ids = Array.from(new Set([...(r.data ?? []).map((x: any) => x.sender_id), ...(s.data ?? []).map((x: any) => x.receiver_id)]));
      const profsRes = ids.length
        ? await supabase.from("profiles").select("id,full_name,age,city,state,church,photo_url").in("id", ids)
        : { data: [] as ProfileLite[] };
      const map = new Map<string, ProfileLite>((profsRes.data ?? []).map((p: any) => [p.id, p]));
      setReceived((r.data ?? []).map((x: any) => ({ id: x.id, created_at: x.created_at, sender: map.get(x.sender_id) ?? null })));
      setSent((s.data ?? []).map((x: any) => ({ id: x.id, created_at: x.created_at, receiver: map.get(x.receiver_id) ?? null })));
    } else {
      setReceived((rec.data ?? []) as unknown as ReceivedRow[]);
      setSent((snt.data ?? []) as unknown as SentRow[]);
    }
    const matched = new Set<string>();
    (mts.data ?? []).forEach((m: any) => matched.add(m.user_a === user.id ? m.user_b : m.user_a));
    setMatchedIds(matched);
  }

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("interests-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  async function retribuir(senderId: string) {
    if (!user) return;
    setBusy(senderId);
    const { error } = await supabase.from("interests").insert({ sender_id: user.id, receiver_id: senderId });
    setBusy(null);
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    toast.success("Match! 💗 Vocês já podem conversar.");
    load();
  }

  async function cancelar(interestId: string) {
    setBusy(interestId);
    await supabase.from("interests").delete().eq("id", interestId);
    setBusy(null);
    load();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="text-4xl font-semibold">Interesses</h1>
          <p className="mt-1 text-muted-foreground">Pessoas que demonstraram interesse e pessoas que você curtiu.</p>
        </div>

        <Tabs defaultValue="received" className="mt-8">
          <TabsList>
            <TabsTrigger value="received"><Sparkles className="mr-1 h-4 w-4" /> Recebidos ({received.length})</TabsTrigger>
            <TabsTrigger value="sent">Enviados ({sent.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6">
            {received.length === 0 ? (
              <Empty text="Você ainda não recebeu interesses. Continue presente — Deus tem o tempo certo." />
            ) : (
              <Grid>
                {received.map((r) => r.sender && (
                  <ProfileCard key={r.id} p={r.sender}>
                    {matchedIds.has(r.sender.id) ? (
                      <Button asChild size="sm" className="w-full"><Link to="/conversas"><MessageCircle className="mr-1 h-4 w-4" /> Conversar</Link></Button>
                    ) : (
                      <Button size="sm" className="w-full" disabled={busy === r.sender.id}
                        onClick={() => retribuir(r.sender!.id)}>
                        <Heart className="mr-1 h-4 w-4" /> Retribuir interesse
                      </Button>
                    )}
                  </ProfileCard>
                ))}
              </Grid>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {sent.length === 0 ? (
              <Empty text="Você ainda não demonstrou interesse em ninguém. Visite os pretendentes." />
            ) : (
              <Grid>
                {sent.map((s) => s.receiver && (
                  <ProfileCard key={s.id} p={s.receiver}>
                    {matchedIds.has(s.receiver.id) ? (
                      <Button asChild size="sm" className="w-full"><Link to="/conversas"><MessageCircle className="mr-1 h-4 w-4" /> Conversar</Link></Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" disabled={busy === s.id} onClick={() => cancelar(s.id)}>
                          Cancelar
                        </Button>
                        <span className="flex-1 rounded-md bg-[var(--petal)]/40 px-3 py-1.5 text-center text-xs text-[var(--rose)]">Aguardando</span>
                      </div>
                    )}
                  </ProfileCard>
                ))}
              </Grid>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
function Empty({ text }: { text: string }) {
  return <div className="glass rounded-2xl p-12 text-center text-muted-foreground shadow-soft">{text}</div>;
}
function ProfileCard({ p, children }: { p: ProfileLite; children: React.ReactNode }) {
  return (
    <div className="glass animate-fade-up overflow-hidden rounded-2xl shadow-soft">
      <Link to="/pretendentes/$id" params={{ id: p.id }} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-muted">
          {p.photo_url ? <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" /> :
            <div className="flex h-full w-full items-center justify-center bg-gradient-love text-5xl text-white">{p.full_name.charAt(0)}</div>}
        </div>
        <div className="p-4">
          <h3 className="font-semibold">{p.full_name.split(" ")[0]}, {p.age}</h3>
          <p className="text-xs text-muted-foreground">{p.city} · {p.state}</p>
        </div>
      </Link>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}