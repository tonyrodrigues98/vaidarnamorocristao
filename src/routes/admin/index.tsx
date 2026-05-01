import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Ban, ShieldAlert } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const Route = createFileRoute("/admin/")({ component: Admin });

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "banned">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  async function load(status: typeof tab) {
    const { data, error } = await supabase
      .from("profiles").select("*").eq("status", status).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => { if (isAdmin) load(tab); }, [isAdmin, tab]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (!loading && !isAdmin) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="font-serif text-2xl">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta página é apenas para administradores.</p>
      </main>
    </div>
  );

  async function update(id: string, patch: ProfileUpdate) {
    setBusy(id);
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Atualizado");
    load(tab);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="font-serif text-4xl font-semibold">Painel administrativo</h1>
          <p className="mt-1 text-muted-foreground">Aprovação de perfis</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-8">
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
            <TabsTrigger value="banned">Banidos</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {rows.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhum perfil aqui.</div>
            ) : (
              <div className="grid gap-4">
                {rows.map((r) => (
                  <div key={r.id} className="glass flex flex-col gap-4 rounded-2xl p-5 shadow-soft sm:flex-row">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      {r.photo_url ? <img src={r.photo_url} alt="" className="h-full w-full object-cover" /> :
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--gold-soft)] to-[var(--accent)] font-serif text-2xl text-white">{r.full_name.charAt(0)}</div>}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-semibold">{r.full_name}, {r.age}</h3>
                      <p className="text-sm text-muted-foreground">{r.sex} · {r.city}/{r.state} · {r.church}</p>
                      {r.bio && <p className="mt-2 text-sm text-foreground/80">{r.bio}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 self-center">
                      {r.status !== "approved" && (
                        <Button size="sm" disabled={busy === r.id} onClick={() => update(r.id, { status: "approved", rejection_reason: null })}>
                          <Check className="mr-1 h-4 w-4" /> Aprovar
                        </Button>
                      )}
                      {r.status !== "rejected" && (
                        <Button size="sm" variant="outline" disabled={busy === r.id}
                          onClick={() => {
                            const reason = window.prompt("Motivo (opcional):") ?? "";
                            update(r.id, { status: "rejected", rejection_reason: reason || null });
                          }}>
                          <X className="mr-1 h-4 w-4" /> Rejeitar
                        </Button>
                      )}
                      {r.status !== "banned" && (
                        <Button size="sm" variant="destructive" disabled={busy === r.id}
                          onClick={() => { if (confirm("Banir esta conta?")) update(r.id, { status: "banned" }); }}>
                          <Ban className="mr-1 h-4 w-4" /> Banir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
