import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Ban, ShieldAlert, Flag, Newspaper, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type Report = Database["public"]["Tables"]["reports"]["Row"];
type DailyPost = { id: string; title: string; content: string; published: boolean; published_at: string; kind: "news" | "devotional" };

export const Route = createFileRoute("/admin/")({ component: Admin });

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "banned" | "reports" | "posts">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [reports, setReports] = useState<Array<Report & { reporter?: { full_name: string | null }; reported?: { full_name: string | null; id: string } }>>([]);
  const [posts, setPosts] = useState<DailyPost[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newKind, setNewKind] = useState<"news" | "devotional">("news");
  const [postBusy, setPostBusy] = useState(false);

  async function load(status: typeof tab) {
    if (status === "reports") {
      const { data: rs, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (error) { toast.error(error.message); return; }
      const ids = Array.from(new Set([...(rs ?? []).map((r) => r.reporter_id), ...(rs ?? []).map((r) => r.reported_id)]));
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] as { id: string; full_name: string | null }[] };
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      setReports((rs ?? []).map((r) => ({ ...r, reporter: map.get(r.reporter_id) ?? undefined, reported: map.get(r.reported_id) ? { id: r.reported_id, full_name: map.get(r.reported_id)!.full_name } : undefined })));
      return;
    }
    if (status === "posts") {
      const { data, error } = await supabase
        .from("daily_posts")
        .select("id, title, content, published, published_at, kind")
        .order("published_at", { ascending: false });
      if (error) { toast.error(error.message); return; }
      setPosts((data ?? []) as DailyPost[]);
      return;
    }
    const { data, error } = await supabase
      .from("profiles").select("*").eq("status", status as "pending" | "approved" | "rejected" | "banned").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => { if (isAdmin) load(tab); }, [isAdmin, tab]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (!loading && !isAdmin) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl">Acesso restrito</h1>
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

  async function createPost() {
    if (!user) return;
    const t = newTitle.trim(); const c = newContent.trim();
    if (!t || !c) { toast.error("Preencha título e conteúdo"); return; }
    setPostBusy(true);
    const { error } = await supabase.from("daily_posts").insert({ author_id: user.id, title: t, content: c, published: true, kind: newKind });
    setPostBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Publicado");
    setNewTitle(""); setNewContent("");
    load("posts");
  }

  async function togglePublish(p: DailyPost) {
    const { error } = await supabase.from("daily_posts").update({ published: !p.published }).eq("id", p.id);
    if (error) toast.error(error.message); else load("posts");
  }

  async function deletePost(id: string) {
    if (!confirm("Excluir esta publicação?")) return;
    const { error } = await supabase.from("daily_posts").delete().eq("id", id);
    if (error) toast.error(error.message); else load("posts");
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="text-4xl font-semibold">Painel administrativo</h1>
          <p className="mt-1 text-muted-foreground">Aprovação de perfis, denúncias e conteúdo</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-8">
          <TabsList>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
            <TabsTrigger value="banned">Banidos</TabsTrigger>
            <TabsTrigger value="reports"><Flag className="mr-1 h-3 w-3" /> Denúncias</TabsTrigger>
            <TabsTrigger value="posts"><Newspaper className="mr-1 h-3 w-3" /> Texto Diário</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {tab === "posts" ? (
              <div className="space-y-6">
                <div className="glass rounded-2xl p-5 shadow-soft">
                  <h3 className="text-lg font-semibold">Nova publicação</h3>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewKind("news")}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        newKind === "news" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      Feed (Notícia)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewKind("devotional")}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        newKind === "devotional" ? "bg-[var(--rose)] text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      Devocional
                    </button>
                  </div>
                  <Input className="mt-3" placeholder="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={200} />
                  <Textarea className="mt-2 min-h-[140px]" placeholder={newKind === "devotional" ? "Escreva uma reflexão devocional..." : "Escreva uma notícia ou aviso para a comunidade..."} value={newContent} onChange={(e) => setNewContent(e.target.value)} maxLength={10000} />
                  <div className="mt-3 flex justify-end">
                    <Button onClick={createPost} disabled={postBusy}>Publicar</Button>
                  </div>
                </div>
                {posts.length === 0 ? (
                  <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhuma publicação.</div>
                ) : (
                  <div className="grid gap-3">
                    {posts.map((p) => (
                      <div key={p.id} className="glass rounded-2xl p-5 shadow-soft">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">
                              <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${p.kind === "devotional" ? "bg-[var(--rose)] text-white" : "bg-foreground/10 text-foreground/70"}`}>
                                {p.kind === "devotional" ? "Devocional" : "Feed"}
                              </span>
                              {new Date(p.published_at).toLocaleString("pt-BR")} · {p.published ? "publicado" : "rascunho"}
                            </div>
                            <h4 className="mt-1 text-lg font-semibold">{p.title}</h4>
                            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{p.content}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                              {p.published ? "Despublicar" : "Publicar"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deletePost(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : tab === "reports" ? (
              reports.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhuma denúncia.</div>
              ) : (
                <div className="grid gap-4">
                  {reports.map((r) => (
                    <div key={r.id} className="glass rounded-2xl p-5 shadow-soft">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString("pt-BR")} · status: <span className="font-semibold">{r.status}</span>
                          </div>
                          <p className="mt-1"><strong>{r.reporter?.full_name ?? r.reporter_id}</strong> denunciou <strong>{r.reported?.full_name ?? r.reported_id}</strong></p>
                          <p className="mt-2 rounded-lg bg-muted p-3 text-sm">{r.reason}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {r.reported && (
                            <Button asChild size="sm" variant="outline">
                              <Link to="/pretendentes/$id" params={{ id: r.reported.id }}>Ver perfil</Link>
                            </Button>
                          )}
                          {r.status === "open" && (
                            <>
                              <Button size="sm" onClick={async () => {
                                await supabase.from("reports").update({ status: "reviewed" }).eq("id", r.id);
                                toast.success("Marcada como revisada"); load("reports");
                              }}>Revisar</Button>
                              <Button size="sm" variant="ghost" onClick={async () => {
                                await supabase.from("reports").update({ status: "dismissed" }).eq("id", r.id);
                                load("reports");
                              }}>Descartar</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : rows.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhum perfil aqui.</div>
            ) : (
              <div className="grid gap-4">
                {rows.map((r) => (
                  <div key={r.id} className="glass flex flex-col gap-4 rounded-2xl p-5 shadow-soft sm:flex-row">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                      {r.photo_url ? <img src={r.photo_url} alt="" className="h-full w-full object-cover" /> :
                        <div className="flex h-full w-full items-center justify-center bg-gradient-love text-2xl text-white">{r.full_name.charAt(0)}</div>}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{r.full_name}, {r.age}</h3>
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
