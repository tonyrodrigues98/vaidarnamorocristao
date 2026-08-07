import { PhotoImg } from "@/components/PhotoImg";
import { friendlyError } from "@/lib/errors";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { markSeen } from "@/lib/lastSeen";
import { CommitmentPauseCard } from "@/components/commitment/CommitmentPauseCard";
import { getActiveCommitmentByUser, type RelationshipCommitment } from "@/lib/commitments";
import { NativeDatingNavigation } from "@/components/dating/native/NativeDatingNavigation";

type ProfileLite = {
  id: string;
  full_name: string;
  age: number;
  city: string;
  state: string;
  church: string;
  photo_url: string | null;
  verified: boolean;
};
type ReceivedRow = { id: string; created_at: string; sender: ProfileLite | null };
type SentRow = { id: string; created_at: string; receiver: ProfileLite | null };

type InterestsPayload = {
  received: ReceivedRow[];
  sent: SentRow[];
  matchedIds: string[];
  commitment: RelationshipCommitment | null;
};

async function fetchInterests(userId: string): Promise<InterestsPayload> {
  const commitment = await getActiveCommitmentByUser(userId);
  if (commitment) {
    return { received: [], sent: [], matchedIds: [], commitment };
  }
  const [r, s, mts] = await Promise.all([
    supabase
      .from("interests")
      .select("id, created_at, sender_id")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("interests")
      .select("id, created_at, receiver_id")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("matches").select("user_a, user_b").or(`user_a.eq.${userId},user_b.eq.${userId}`),
  ]);
  const ids = Array.from(
    new Set<string>([
      ...(r.data ?? []).map((x) => x.sender_id),
      ...(s.data ?? []).map((x) => x.receiver_id),
    ]),
  );
  const profsRes = ids.length
    ? await supabase
        .from("profiles")
        .select("id,full_name,age,city,state,church,photo_url,verified")
        .in("id", ids)
    : { data: [] as ProfileLite[] };
  const map = new Map<string, ProfileLite>(
    (profsRes.data ?? []).map((p) => [p.id, p as ProfileLite]),
  );
  const received: ReceivedRow[] = (r.data ?? []).map((x) => ({
    id: x.id,
    created_at: x.created_at,
    sender: map.get(x.sender_id) ?? null,
  }));
  const sent: SentRow[] = (s.data ?? []).map((x) => ({
    id: x.id,
    created_at: x.created_at,
    receiver: map.get(x.receiver_id) ?? null,
  }));
  const matchedIds: string[] = [];
  (mts.data ?? []).forEach((m) => matchedIds.push(m.user_a === userId ? m.user_b : m.user_a));
  return { received, sent, matchedIds, commitment: null };
}

export const Route = createFileRoute("/interesses")({
  component: () => (
    <RequireApproved>
      <Page />
    </RequireApproved>
  ),
});

function Page() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["interests", user?.id] as const;

  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => fetchInterests(user!.id),
    enabled: !!user,
  });
  const received = data?.received ?? [];
  const sent = data?.sent ?? [];
  const matchedIds = new Set(data?.matchedIds ?? []);
  const activeCommitment = data?.commitment ?? null;
  const loadingList = isPending && !!user;

  useEffect(() => {
    if (!user) return;
    markSeen(user.id, "interests");
    const invalidate = () => qc.invalidateQueries({ queryKey });
    const ch = supabase
      .channel("interests-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, invalidate)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "relationship_commitments" },
        invalidate,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const retribuirMut = useMutation({
    mutationFn: async (senderId: string) => {
      if (!user) throw new Error("Sem sessão");
      const { error } = await supabase
        .from("interests")
        .insert({ sender_id: user.id, receiver_id: senderId });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      toast.success("Match! Vocês já podem conversar.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast.error(friendlyError(err)),
  });
  const cancelarMut = useMutation({
    mutationFn: async (interestId: string) => {
      await supabase.from("interests").delete().eq("id", interestId);
      return interestId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
  const busy =
    retribuirMut.isPending && retribuirMut.variables
      ? retribuirMut.variables
      : cancelarMut.isPending && cancelarMut.variables
        ? cancelarMut.variables
        : null;

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const retribuir = (senderId: string) => retribuirMut.mutate(senderId);
  const cancelar = (interestId: string) => cancelarMut.mutate(interestId);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <NativeDatingNavigation />
        <div className="animate-fade-up">
          <h1 className="text-4xl font-semibold">Interesses</h1>
          <p className="mt-1 text-muted-foreground">
            Pessoas que demonstraram interesse e pessoas que você curtiu.
          </p>
        </div>

        {activeCommitment ? (
          <CommitmentPauseCard
            matchId={activeCommitment.match_id}
            className="mt-8 animate-fade-up"
            description="Você está em um propósito ativo. Por isso, interesses recebidos e enviados ficam arquivados até esse compromisso ser interrompido."
          />
        ) : loadingList ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass h-80 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="received" className="mt-8">
            <TabsList>
              <TabsTrigger value="received">
                <Sparkles className="mr-1 h-4 w-4" /> Recebidos ({received.length})
              </TabsTrigger>
              <TabsTrigger value="sent">Enviados ({sent.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="mt-6">
              {received.length === 0 ? (
                <Empty text="Você ainda não recebeu interesses. Continue presente — Deus tem o tempo certo." />
              ) : (
                <Grid>
                  {received.map(
                    (r) =>
                      r.sender && (
                        <ProfileCard key={r.id} p={r.sender}>
                          {matchedIds.has(r.sender.id) ? (
                            <Button asChild size="sm" className="w-full">
                              <Link to="/conversas">
                                <MessageCircle className="mr-1 h-4 w-4" /> Conversar
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={busy === r.sender.id}
                              onClick={() => retribuir(r.sender!.id)}
                            >
                              <Heart className="mr-1 h-4 w-4" /> Retribuir interesse
                            </Button>
                          )}
                        </ProfileCard>
                      ),
                  )}
                </Grid>
              )}
            </TabsContent>

            <TabsContent value="sent" className="mt-6">
              {sent.length === 0 ? (
                <Empty text="Você ainda não demonstrou interesse em ninguém. Visite os pretendentes." />
              ) : (
                <Grid>
                  {sent.map(
                    (s) =>
                      s.receiver && (
                        <ProfileCard key={s.id} p={s.receiver}>
                          {matchedIds.has(s.receiver.id) ? (
                            <Button asChild size="sm" className="w-full">
                              <Link to="/conversas">
                                <MessageCircle className="mr-1 h-4 w-4" /> Conversar
                              </Link>
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                disabled={busy === s.id}
                                onClick={() => cancelar(s.id)}
                              >
                                Cancelar
                              </Button>
                              <span className="flex-1 rounded-md bg-[var(--petal)]/40 px-3 py-1.5 text-center text-xs text-[var(--rose)]">
                                Aguardando
                              </span>
                            </div>
                          )}
                        </ProfileCard>
                      ),
                  )}
                </Grid>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
function Empty({ text }: { text: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center text-muted-foreground shadow-soft">
      {text}
    </div>
  );
}
function ProfileCard({ p, children }: { p: ProfileLite; children: React.ReactNode }) {
  return (
    <div className="glass animate-fade-up overflow-hidden rounded-2xl shadow-soft">
      <Link to="/pretendentes/$id" params={{ id: p.id }} className="block">
        <div className="aspect-[4/5] overflow-hidden bg-muted">
          {p.photo_url ? (
            <PhotoImg src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-love text-5xl text-white">
              {p.full_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="flex items-center gap-1.5 font-semibold">
            {p.full_name.split(" ")[0]}, {p.age}
            {p.verified && <VerifiedBadge size="sm" />}
          </h3>
          <p className="text-xs text-muted-foreground">
            {p.city} · {p.state}
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}
