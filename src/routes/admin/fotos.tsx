import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/fotos")({ component: AdminFotos });

type Status = "pending" | "approved" | "rejected";
type Item = {
  id: string;
  user_id: string;
  photo_url: string;
  scope: "avatar" | "extra";
  photo_id: string | null;
  ai_result: { confidence?: number; reason?: string } | null;
  status: Status;
  created_at: string;
  profile?: { full_name: string | null } | null;
};

function AdminFotos() {
  const { user, isAdmin, role, loading } = useAuth();
  const isSuper = role === "super_admin";
  const canAccess = isAdmin || isSuper;
  const [tab, setTab] = useState<Status>("pending");
  const [list, setList] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("photo_moderation_queue")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      toast.error(error.message);
      return;
    }
    const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as Array<{ id: string; full_name: string | null }> };
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    setList(
      (data ?? []).map((r) => ({
        ...(r as unknown as Item),
        profile: map.get(r.user_id) ?? null,
      }))
    );
  }

  useEffect(() => {
    if (canAccess) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, tab]);

  async function approve(item: Item) {
    setBusy(item.id);
    const { error } = await supabase
      .from("photo_moderation_queue")
      .update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      setBusy(null);
      return;
    }
    if (item.scope === "avatar") {
      await supabase
        .from("profiles")
        .update({ avatar_ai_verified: true })
        .eq("id", item.user_id);
    } else if (item.photo_id) {
      await supabase
        .from("profile_photos")
        .update({ ai_verified: true })
        .eq("id", item.photo_id);
    }
    toast.success("Foto aprovada");
    setBusy(null);
    void load();
  }

  async function reject(item: Item) {
    if (!confirm("Rejeitar e remover esta foto?")) return;
    setBusy(item.id);
    // remove storage object
    const marker = "/profile-photos/";
    const idx = item.photo_url.indexOf(marker);
    if (idx > -1) {
      const path = item.photo_url.substring(idx + marker.length).split("?")[0];
      await supabase.storage.from("profile-photos").remove([path]);
    }
    if (item.scope === "avatar") {
      await supabase
        .from("profiles")
        .update({ photo_url: null, avatar_ai_verified: false })
        .eq("id", item.user_id);
    } else if (item.photo_id) {
      await supabase.from("profile_photos").delete().eq("id", item.photo_id);
    }
    const { error } = await supabase
      .from("photo_moderation_queue")
      .update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else toast.success("Foto rejeitada");
    setBusy(null);
    void load();
  }

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;
  if (!canAccess) return <Navigate to="/inicio" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Admin
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Moderação de fotos (IA)</h1>
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-4 flex gap-2">
          {(["pending", "approved", "rejected"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-full border px-3 py-1 text-sm ${
                tab === s ? "bg-foreground text-background" : "bg-card"
              }`}
            >
              {s === "pending" ? "Pendentes" : s === "approved" ? "Aprovadas" : "Rejeitadas"}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada por aqui.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((it) => (
              <div key={it.id} className="overflow-hidden rounded-2xl border bg-card">
                <img src={it.photo_url} alt="" className="aspect-square w-full object-cover" />
                <div className="space-y-2 p-3">
                  <div className="text-sm font-medium">
                    {it.profile?.full_name ?? "—"}{" "}
                    <span className="text-xs text-muted-foreground">({it.scope})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confiança: {Math.round((it.ai_result?.confidence ?? 0) * 100)}%
                  </div>
                  {it.ai_result?.reason && (
                    <p className="text-xs text-muted-foreground">{it.ai_result.reason}</p>
                  )}
                  {tab === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => approve(it)}
                        disabled={busy === it.id}
                        className="flex-1"
                      >
                        <Check className="mr-1 h-4 w-4" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reject(it)}
                        disabled={busy === it.id}
                        className="flex-1"
                      >
                        <X className="mr-1 h-4 w-4" /> Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}