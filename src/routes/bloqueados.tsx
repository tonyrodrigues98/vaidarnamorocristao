import { PhotoImg } from "@/components/PhotoImg";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Ban, ShieldOff, ArrowLeft } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { OfflineState } from "@/components/ui/OfflineState";

export const Route = createFileRoute("/bloqueados")({
  component: () => (
    <RequireApproved>
      <BlockedPage />
    </RequireApproved>
  ),
});

type Row = {
  blocked_id: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
  } | null;
};

function BlockedPage() {
  const { user, loading } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const queryKey = ["blocked-users", user?.id] as const;
  const blockedQuery = useQuery({
    queryKey,
    enabled: !!user,
    staleTime: 60_000,
    refetchOnReconnect: true,
    queryFn: async (): Promise<Row[]> => {
      if (!user) return [];
      const { data: blocks, error } = await supabase
        .from("blocks")
        .select("blocked_id, created_at")
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (blocks ?? []).map((b) => b.blocked_id as string);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, city, state")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (blocks ?? []).map((b: any) => ({
        blocked_id: b.blocked_id,
        created_at: b.created_at,
        profile: map.get(b.blocked_id) ?? null,
      }));
    },
  });

  const rows = blockedQuery.data ?? null;

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("not-authenticated");
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", id);
      if (error) throw error;
      return id;
    },
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (id) => {
      toast.success("Perfil desbloqueado");
      qc.setQueryData<Row[]>(queryKey, (prev) =>
        (prev ?? []).filter((r) => r.blocked_id !== id),
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Não foi possível desbloquear");
    },
  });

  function unblock(id: string) {
    if (!isOnline) {
      toast.info("Disponível online. Reconecte-se para desbloquear.");
      return;
    }
    unblockMutation.mutate(id);
  }

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  const showStaleNotice = !isOnline && rows !== null && rows.length > 0;
  const showOfflineEmpty = !isOnline && (rows === null || rows.length === 0) && !blockedQuery.isLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/perfil">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Ban className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bloqueados</h1>
            <p className="text-sm text-muted-foreground">
              Perfis bloqueados não aparecem em pretendentes, matches ou conversas.
            </p>
          </div>
        </div>

        {showStaleNotice ? <StaleDataNotice className="mb-3" /> : null}

        {showOfflineEmpty ? (
          <OfflineState
            title="Lista indisponível offline"
            description="Conecte-se à internet para ver os perfis que você bloqueou."
            actionLabel="Tentar novamente"
            onAction={() => blockedQuery.refetch()}
            compact
          />
        ) : rows === null || blockedQuery.isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Ban className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Você não bloqueou ninguém.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.blocked_id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                  {r.profile?.photo_url ? (
                    <PhotoImg
                      src={r.profile.photo_url}
                      alt=""
                      className="h-full w-full object-cover grayscale"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {r.profile?.full_name ?? "Perfil indisponível"}
                  </p>
                  {r.profile && (
                    <p className="truncate text-xs text-muted-foreground">
                      {r.profile.city} – {r.profile.state}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === r.blocked_id || !isOnline}
                  title={!isOnline ? "Disponível online." : undefined}
                  onClick={() => unblock(r.blocked_id)}
                >
                  <ShieldOff className="mr-1 h-4 w-4" />
                  {!isOnline ? "Indisponível offline" : "Desbloquear"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
