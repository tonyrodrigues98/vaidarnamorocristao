import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User as UserIcon, HeartCrack } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { PhotoImg } from "@/components/PhotoImg";
import { CommitmentPauseCard } from "@/components/commitment/CommitmentPauseCard";
import { getActiveCommitmentByUser, type RelationshipCommitment } from "@/lib/commitments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type MatchItem = {
  matchId: string;
  createdAt: string;
  partner: {
    id: string;
    full_name: string;
    age: number;
    city: string;
    state: string;
    photo_url: string | null;
    verified: boolean;
    equipped_frame_id: string | null;
    equipped_aura_id: string | null;
    equipped_sticker_id: string | null;
  };
};

type MatchesPayload = {
  items: MatchItem[];
  commitment: RelationshipCommitment | null;
};

async function fetchMatches(userId: string): Promise<MatchesPayload> {
  const commitment = await getActiveCommitmentByUser(userId);
  if (commitment) return { items: [], commitment };
  const { data: matches } = await supabase
    .from("matches")
    .select("id, user_a, user_b, created_at")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (!matches?.length) return { items: [], commitment: null };
  const partnerIds = matches.map((m) => (m.user_a === userId ? m.user_b : m.user_a));
  const { data: profs } = await supabase
    .from("profiles")
    .select(
      "id, full_name, age, city, state, photo_url, verified, equipped_frame_id, equipped_aura_id, equipped_sticker_id",
    )
    .in("id", partnerIds);
  const map = new Map((profs ?? []).map((p) => [p.id, p]));
  const items: MatchItem[] = matches
    .map((m) => {
      const pid = m.user_a === userId ? m.user_b : m.user_a;
      const p = map.get(pid);
      if (!p) return null;
      return { matchId: m.id, createdAt: m.created_at, partner: p } satisfies MatchItem;
    })
    .filter((x): x is MatchItem => !!x);
  return { items, commitment: null };
}

export const Route = createFileRoute("/matches")({
  component: () => (
    <RequireApproved>
      <MatchesPage />
    </RequireApproved>
  ),
});

function MatchesPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["matches", user?.id] as const;

  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => fetchMatches(user!.id),
    enabled: !!user,
  });
  const items = data?.items ?? [];
  const activeCommitment = data?.commitment ?? null;
  const loadingList = isPending && !!user;

  useEffect(() => {
    if (!user) return;
    const invalidate = () => qc.invalidateQueries({ queryKey });
    const ch = supabase
      .channel("matches-list")
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

  const unmatchMut = useMutation({
    mutationFn: async (matchId: string) => {
      const { error } = await supabase.rpc("unmatch", { _match_id: matchId });
      if (error) throw error;
      return matchId;
    },
    onSuccess: (matchId) => {
      toast.success("Match desfeito.");
      qc.setQueryData<MatchesPayload>(queryKey, (prev) =>
        prev ? { ...prev, items: prev.items.filter((i) => i.matchId !== matchId) } : prev,
      );
      qc.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const busy = unmatchMut.isPending ? unmatchMut.variables ?? null : null;

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const unmatch = (matchId: string) => unmatchMut.mutate(matchId);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Seus matches</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Conexões com interesse mútuo. Cuide bem delas.
            </p>
          </div>
          <span className="rounded-full bg-[var(--petal)] px-3 py-1 text-xs font-medium text-[var(--rose)]">
            {items.length} {items.length === 1 ? "match" : "matches"}
          </span>
        </div>

        {activeCommitment ? (
          <CommitmentPauseCard
            matchId={activeCommitment.match_id}
            className="mt-10 animate-fade-up"
            description="Você está em um propósito ativo. Por isso, seus matches ficam arquivados e fora de vista enquanto esse compromisso estiver firmado."
          />
        ) : loadingList ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass h-80 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="glass animate-fade-up mt-10 rounded-3xl p-12 text-center shadow-soft">
            <Heart className="mx-auto mb-3 h-8 w-8 text-[var(--rose)]" />
            <p className="text-muted-foreground">
              Você ainda não tem matches. Demonstre interesse em alguém — quando for recíproco,
              aparece aqui.
            </p>
            <Button asChild className="mt-5">
              <Link to="/pretendentes">Ver pretendentes</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <article
                key={it.matchId}
                className="glass animate-fade-up overflow-hidden rounded-2xl shadow-soft hover-lift"
              >
                <Link to="/pretendentes/$id" params={{ id: it.partner.id }} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {it.partner.photo_url ? (
                      <PhotoImg
                        src={it.partner.photo_url}
                        alt={it.partner.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-love text-5xl text-white">
                        {it.partner.full_name.charAt(0)}
                      </div>
                    )}
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--rose)] shadow-soft backdrop-blur">
                      <Heart className="h-3 w-3" fill="currentColor" /> Match
                    </span>
                    {(it.partner.equipped_frame_id ||
                      it.partner.equipped_aura_id ||
                      it.partner.equipped_sticker_id) && (
                      <div className="absolute bottom-3 left-3">
                        <DecoratedAvatar
                          photoUrl={it.partner.photo_url}
                          fallback={it.partner.full_name.charAt(0)}
                          size={56}
                          frameId={it.partner.equipped_frame_id}
                          auraId={it.partner.equipped_aura_id}
                          stickerId={it.partner.equipped_sticker_id}
                        />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="flex items-center gap-1.5 text-lg font-semibold">
                      {it.partner.full_name.split(" ")[0]}, {it.partner.age}
                      {it.partner.verified && <VerifiedBadge size="sm" />}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {it.partner.city} · {it.partner.state}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link to="/conversas/$matchId" params={{ matchId: it.matchId }}>
                        <MessageCircle className="mr-1 h-4 w-4" /> Conversar
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/pretendentes/$id" params={{ id: it.partner.id }}>
                        <UserIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === it.matchId}
                          title="Desfazer match"
                        >
                          <HeartCrack className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Desfazer match com {it.partner.full_name.split(" ")[0]}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação remove o match, apaga as mensagens trocadas e os interesses
                            entre vocês. Não é possível desfazer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => unmatch(it.matchId)}>
                            Desfazer match
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
