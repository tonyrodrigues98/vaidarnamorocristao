import { PhotoImg } from "@/components/PhotoImg";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, ShieldAlert, Check, X, RefreshCw, Eye, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/verificacoes")({ component: AdminVerifs });

type Status = "pending" | "approved" | "rejected" | "more_info";
type Req = {
  id: string;
  user_id: string;
  status: Status;
  selfie_path: string;
  document_path: string;
  document_type: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: { full_name: string | null; photo_url: string | null } | null;
};

function AdminVerifs() {
  const { user, isAdmin, role, loading } = useAuth();
  const isSuper = role === "super_admin";
  const canAccess = isAdmin || isSuper;
  const [tab, setTab] = useState<Status>("pending");
  const [list, setList] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<{ url: string; title: string } | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  async function load() {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, full_name, photo_url").in("id", ids)
      : { data: [] as Array<{ id: string; full_name: string | null; photo_url: string | null }> };
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    setList((data ?? []).map((r) => ({ ...(r as Req), profile: map.get(r.user_id) ?? null })));
  }

  useEffect(() => {
    if (canAccess) load();
  }, [canAccess, tab]);

  async function preview(path: string, title: string) {
    const { data, error } = await supabase.storage
      .from("verifications")
      .createSignedUrl(path, 60 * 5);
    if (error || !data?.signedUrl) {
      toast.error("Não foi possível abrir o arquivo");
      return;
    }
    setPreviewing({ url: data.signedUrl, title });
  }

  async function decide(req: Req, decision: "approved" | "rejected" | "more_info") {
    if (!user) return;
    setBusy(req.id);
    const notes = (notesById[req.id] ?? "").trim().slice(0, 1000) || null;
    const { error } = await supabase
      .from("verification_requests")
      .update({
        status: decision,
        admin_notes: notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.id);
    if (error) {
      setBusy(null);
      toast.error(error.message);
      return;
    }

    if (decision === "approved") {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ verified: true, verified_at: new Date().toISOString(), verified_by: user.id })
        .eq("id", req.user_id);
      if (pErr) toast.error(pErr.message);
    } else if (decision === "rejected") {
      // ensure not verified
      await supabase
        .from("profiles")
        .update({ verified: false, verified_at: null, verified_by: null })
        .eq("id", req.user_id);
    }
    setBusy(null);
    toast.success("Solicitação atualizada");
    load();
  }

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (!loading && !canAccess)
    return (
      <div className="min-h-screen">
        <Header />
      <AdminTopNav compact />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl">Acesso restrito</h1>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen">
      <Header />
      <AdminTopNav compact />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="mt-4 flex items-center gap-2 text-3xl font-semibold">
          <ShieldCheck className="h-7 w-7 text-sky-500" /> Verificações
        </h1>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)} className="mt-6">
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="more_info">Mais info</TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-4">
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item nesta aba.</p>
            ) : (
              list.map((req) => (
                <div key={req.id} className="glass rounded-2xl p-5 shadow-soft">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                      {req.profile?.photo_url ? (
                        <PhotoImg
                          src={req.profile.photo_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-love text-white">
                          {(req.profile?.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{req.profile?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.document_type.toUpperCase()} · enviado em{" "}
                        {new Date(req.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Link
                      to="/pretendentes/$id"
                      params={{ id: req.user_id }}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver perfil
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => preview(req.selfie_path, "Selfie")}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Ver selfie
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => preview(req.document_path, "Documento")}
                    >
                      <Eye className="mr-2 h-4 w-4" /> Ver documento
                    </Button>
                  </div>

                  {tab === "pending" || tab === "more_info" ? (
                    <>
                      <Textarea
                        rows={2}
                        placeholder="Observações (opcional, visível ao usuário se rejeitar / pedir mais info)"
                        className="mt-3"
                        value={notesById[req.id] ?? ""}
                        onChange={(e) => setNotesById((s) => ({ ...s, [req.id]: e.target.value }))}
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={busy === req.id}
                          onClick={() => decide(req, "approved")}
                        >
                          <Check className="mr-1 h-4 w-4" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === req.id}
                          onClick={() => decide(req, "more_info")}
                        >
                          <RefreshCw className="mr-1 h-4 w-4" /> Pedir mais info
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy === req.id}
                          onClick={() => decide(req, "rejected")}
                        >
                          <X className="mr-1 h-4 w-4" /> Rejeitar
                        </Button>
                      </div>
                    </>
                  ) : (
                    req.admin_notes && (
                      <p className="mt-3 text-sm text-muted-foreground">Obs.: {req.admin_notes}</p>
                    )
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewing?.title}</DialogTitle>
          </DialogHeader>
          {previewing &&
            (previewing.url.toLowerCase().includes(".pdf") ? (
              <iframe src={previewing.url} className="h-[70vh] w-full rounded-lg" />
            ) : (
              <img
                src={previewing.url}
                alt={previewing.title}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
