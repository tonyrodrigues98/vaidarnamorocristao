import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Ban, ShieldAlert, Flag, Newspaper, Trash2, Users as UsersIcon, ClipboardList, MessageSquareWarning } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import { ROLE_CONFIG, ROLE_PRIORITY, type AppRole } from "@/lib/roles";
import { RoleBadge } from "@/components/RoleBadge";

type Row = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type Report = Database["public"]["Tables"]["reports"]["Row"];
type DailyPost = { id: string; title: string; content: string; published: boolean; published_at: string; kind: "news" | "devotional" };
type PreCadastro = Database["public"]["Tables"]["pre_cadastros"]["Row"];
type AdminUserRow = Row & { primaryRole: AppRole };

export const Route = createFileRoute("/admin/")({ component: Admin });

function Admin() {
  const { user, isAdmin, role, loading } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const isApresentador = role === "apresentador";
  const isModerador = role === "moderador";
  const canSeeAdminPanel = isAdmin || isApresentador || isModerador;

  type TabKey = "pending" | "approved" | "rejected" | "banned" | "reports" | "posts" | "users" | "pre_cadastros";

  const availableTabs = useMemo<TabKey[]>(() => {
    if (isSuperAdmin) return ["pending","approved","rejected","banned","reports","posts","users","pre_cadastros"];
    if (isAdmin) return ["pending","approved","rejected","banned","reports","posts"];
    if (isApresentador) return ["pre_cadastros"];
    return [];
  }, [isAdmin, isSuperAdmin, isApresentador]);

  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<TabKey>("pending");

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(tab)) {
      setTab(availableTabs[0]);
    }
  }, [availableTabs, tab]);

  const [busy, setBusy] = useState<string | null>(null);
  const [reports, setReports] = useState<Array<Report & { reporter?: { full_name: string | null }; reported?: { full_name: string | null; id: string } }>>([]);
  const [posts, setPosts] = useState<DailyPost[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [preCads, setPreCads] = useState<PreCadastro[]>([]);
  const [editingPC, setEditingPC] = useState<PreCadastro | null>(null);
  const [pcDraft, setPcDraft] = useState<Partial<PreCadastro>>({});
  const [pcBusy, setPcBusy] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newKind, setNewKind] = useState<"news" | "devotional">("news");
  const [postBusy, setPostBusy] = useState(false);

  async function load(status: TabKey) {
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
    if (status === "users") {
      const [{ data: profs, error: pe }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) { toast.error(pe.message); return; }
      const roleMap = new Map<string, AppRole>();
      for (const r of (roles ?? []) as Array<{ user_id: string; role: AppRole }>) {
        const cur = roleMap.get(r.user_id);
        if (!cur || ROLE_PRIORITY.indexOf(r.role) < ROLE_PRIORITY.indexOf(cur)) {
          roleMap.set(r.user_id, r.role);
        }
      }
      setUsers(((profs ?? []) as Row[]).map((p) => ({ ...p, primaryRole: roleMap.get(p.id) ?? "user" })));
      return;
    }
    if (status === "pre_cadastros") {
      const { data, error } = await supabase
        .from("pre_cadastros")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { toast.error(error.message); return; }
      setPreCads((data ?? []) as PreCadastro[]);
      return;
    }
    const { data, error } = await supabase
      .from("profiles").select("*").eq("status", status as "pending" | "approved" | "rejected" | "banned").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => { if (canSeeAdminPanel) load(tab); }, [canSeeAdminPanel, tab]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (!loading && !canSeeAdminPanel) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta página é apenas para administradores.</p>
      </main>
    </div>
  );

  // Moderador: simple landing
  if (!loading && isModerador) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="glass rounded-3xl p-8 text-center shadow-soft">
            <MessageSquareWarning className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-semibold">Painel do Moderador</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Como Moderador, você pode excluir mensagens inadequadas diretamente na Comunidade.
            </p>
            <Button asChild className="mt-6"><Link to="/comunidade">Ir para a Comunidade</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  async function update(id: string, patch: ProfileUpdate) {
    setBusy(id);
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Atualizado");
    load(tab);
  }

  async function changeUserRole(userId: string, newRole: AppRole, currentRole: AppRole) {
    if (!user) return;
    if (newRole === currentRole) return;
    setBusy(userId);
    // Remove current non-user role(s) and add new one (or just set to user)
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delErr) { setBusy(null); toast.error(delErr.message); return; }
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    setBusy(null);
    if (insErr) { toast.error(insErr.message); return; }
    toast.success(`Papel atualizado para ${ROLE_CONFIG[newRole].label}`);
    load("users");
  }

  async function savePreCadastro() {
    if (!user) return;
    setPcBusy(true);
    if (editingPC) {
      const { error } = await supabase
        .from("pre_cadastros")
        .update({ ...pcDraft })
        .eq("id", editingPC.id);
      setPcBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Pré-cadastro atualizado");
    } else {
      const { error } = await supabase
        .from("pre_cadastros")
        .insert({ ...pcDraft, created_by: user.id });
      setPcBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Pré-cadastro salvo");
    }
    setEditingPC(null);
    setPcDraft({});
    load("pre_cadastros");
  }

  async function deletePreCadastro(id: string) {
    if (!confirm("Excluir este pré-cadastro?")) return;
    const { error } = await supabase.from("pre_cadastros").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); load("pre_cadastros"); }
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
          <p className="mt-1 text-muted-foreground">
            {isSuperAdmin ? "Gestão completa da plataforma" :
             isApresentador ? "Pré-cadastros para controle de pessoas" :
             "Aprovação de perfis, denúncias e conteúdo"}
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-8">
          <TabsList className="flex-wrap">
            {availableTabs.includes("pending") && <TabsTrigger value="pending">Pendentes</TabsTrigger>}
            {availableTabs.includes("approved") && <TabsTrigger value="approved">Aprovados</TabsTrigger>}
            {availableTabs.includes("rejected") && <TabsTrigger value="rejected">Rejeitados</TabsTrigger>}
            {availableTabs.includes("banned") && <TabsTrigger value="banned">Banidos</TabsTrigger>}
            {availableTabs.includes("reports") && <TabsTrigger value="reports"><Flag className="mr-1 h-3 w-3" /> Denúncias</TabsTrigger>}
            {availableTabs.includes("posts") && <TabsTrigger value="posts"><Newspaper className="mr-1 h-3 w-3" /> Texto Diário</TabsTrigger>}
            {availableTabs.includes("users") && <TabsTrigger value="users"><UsersIcon className="mr-1 h-3 w-3" /> Usuários</TabsTrigger>}
            {availableTabs.includes("pre_cadastros") && <TabsTrigger value="pre_cadastros"><ClipboardList className="mr-1 h-3 w-3" /> Pré-cadastros</TabsTrigger>}
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {tab === "users" ? (
              <UsersPanel
                users={users}
                busy={busy}
                onChangeRole={changeUserRole}
              />
            ) : tab === "pre_cadastros" ? (
              <PreCadastrosPanel
                items={preCads}
                editing={editingPC}
                draft={pcDraft}
                setDraft={setPcDraft}
                onEdit={(p: PreCadastro) => { setEditingPC(p); setPcDraft(p); }}
                onCancel={() => { setEditingPC(null); setPcDraft({}); }}
                onSave={savePreCadastro}
                onDelete={deletePreCadastro}
                busy={pcBusy}
              />
            ) : tab === "posts" ? (
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

function UsersPanel({
  users, busy, onChangeRole,
}: {
  users: AdminUserRow[];
  busy: string | null;
  onChangeRole: (userId: string, newRole: AppRole, currentRole: AppRole) => void;
}) {
  if (users.length === 0) {
    return <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhum usuário.</div>;
  }
  return (
    <div className="grid gap-3">
      {users.map((u) => (
        <div key={u.id} className="glass flex flex-col gap-3 rounded-2xl p-4 shadow-soft sm:flex-row sm:items-center">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
            {u.photo_url ? <img src={u.photo_url} alt="" className="h-full w-full object-cover" /> :
              <div className="flex h-full w-full items-center justify-center bg-gradient-love text-white">{u.full_name.charAt(0)}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{u.full_name}, {u.age}</h3>
              <RoleBadge role={u.primaryRole} />
            </div>
            <p className="truncate text-xs text-muted-foreground">{u.sex} · {u.city}/{u.state} · {u.status}</p>
          </div>
          <div className="w-full sm:w-52">
            <Select
              value={u.primaryRole}
              onValueChange={(v) => onChangeRole(u.id, v as AppRole, u.primaryRole)}
              disabled={busy === u.id}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_CONFIG) as AppRole[]).map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}

function PreCadastrosPanel({
  items, editing, draft, setDraft, onEdit, onCancel, onSave, onDelete, busy,
}: {
  items: PreCadastro[];
  editing: PreCadastro | null;
  draft: Partial<PreCadastro>;
  setDraft: (d: Partial<PreCadastro>) => void;
  onEdit: (p: PreCadastro) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const set = <K extends keyof PreCadastro>(k: K, v: PreCadastro[K] | null) =>
    setDraft({ ...draft, [k]: v });
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<PreCadastro | null>(null);

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `pre-cadastros/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) { toast.error(upErr.message); return; }
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      setDraft({ ...draft, photo_url: data.publicUrl });
      toast.success("Foto enviada");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h3 className="text-lg font-semibold">{editing ? "Editar pré-cadastro" : "Novo pré-cadastro"}</h3>
        <p className="mt-1 text-xs text-muted-foreground">Nenhum campo é obrigatório. Preencha o que tiver.</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
            {draft.photo_url ? (
              <img src={draft.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem foto</div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pc-photo" className="text-xs text-muted-foreground">Foto (opcional)</Label>
            <Input
              id="pc-photo"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
            />
            {draft.photo_url && (
              <button
                type="button"
                className="self-start text-xs text-muted-foreground underline hover:text-foreground"
                onClick={() => set("photo_url", null)}
              >
                Remover foto
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><Label>Nome completo</Label><Input value={draft.full_name ?? ""} onChange={(e) => set("full_name", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={draft.email ?? ""} onChange={(e) => set("email", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Telefone</Label><Input value={draft.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Idade</Label><Input type="number" value={draft.age ?? ""} onChange={(e) => set("age", numOrNull(e.target.value))} /></div>
          <div className="space-y-1"><Label>Altura (cm)</Label><Input type="number" value={draft.height_cm ?? ""} onChange={(e) => set("height_cm", numOrNull(e.target.value))} /></div>
          <div className="space-y-1"><Label>Sexo</Label><Input value={draft.sex ?? ""} onChange={(e) => set("sex", e.target.value || null)} placeholder="masculino / feminino" /></div>
          <div className="space-y-1"><Label>Estado civil</Label><Input value={draft.marital ?? ""} onChange={(e) => set("marital", e.target.value || null)} placeholder="solteiro / divorciado" /></div>
          <div className="space-y-1"><Label>Cidade</Label><Input value={draft.city ?? ""} onChange={(e) => set("city", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Estado (UF)</Label><Input value={draft.state ?? ""} onChange={(e) => set("state", e.target.value || null)} maxLength={2} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Igreja</Label><Input value={draft.church ?? ""} onChange={(e) => set("church", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Anos de batismo</Label><Input type="number" value={draft.years_baptized ?? ""} onChange={(e) => set("years_baptized", numOrNull(e.target.value))} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Sobre</Label><Textarea value={draft.bio ?? ""} onChange={(e) => set("bio", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Idade desejada (mín)</Label><Input type="number" value={draft.pref_age_min ?? ""} onChange={(e) => set("pref_age_min", numOrNull(e.target.value))} /></div>
          <div className="space-y-1"><Label>Idade desejada (máx)</Label><Input type="number" value={draft.pref_age_max ?? ""} onChange={(e) => set("pref_age_max", numOrNull(e.target.value))} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Localização desejada</Label><Input value={draft.pref_location_scope ?? ""} onChange={(e) => set("pref_location_scope", e.target.value || null)} placeholder="regiao / brasil / mundo / personalizado" /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Qualidade que busca</Label><Input value={draft.pref_desired_quality ?? ""} onChange={(e) => set("pref_desired_quality", e.target.value || null)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Sobre o que procura</Label><Textarea value={draft.pref_looking_for_bio ?? ""} onChange={(e) => set("pref_looking_for_bio", e.target.value || null)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Notas internas</Label><Textarea value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} /></div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={onSave} disabled={busy}>{editing ? "Salvar alterações" : "Adicionar"}</Button>
          {editing && <Button variant="outline" onClick={onCancel}>Cancelar</Button>}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhum pré-cadastro ainda.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className="glass rounded-2xl p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setViewing(p)}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted transition hover:opacity-80"
                  aria-label="Ver detalhes"
                >
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-love text-lg text-white">
                      {(p.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold">{p.full_name ?? "(sem nome)"}{p.age ? `, ${p.age}` : ""}</h4>
                  <p className="text-xs text-muted-foreground">
                    {[p.sex, p.marital, p.city && p.state ? `${p.city}/${p.state}` : p.city || p.state, p.church].filter(Boolean).join(" · ")}
                  </p>
                  {p.bio && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{p.bio}</p>}
                  {p.notes && <p className="mt-1 text-xs italic text-muted-foreground">📝 {p.notes}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="sm" variant="outline" onClick={() => setViewing(p)}>Visualizar</Button>
                  <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.full_name ?? "Pré-cadastro"}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              {viewing.photo_url && (
                <img src={viewing.photo_url} alt="" className="w-full rounded-xl object-cover" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Idade" value={viewing.age?.toString()} />
                <Field label="Altura" value={viewing.height_cm ? `${viewing.height_cm} cm` : null} />
                <Field label="Sexo" value={viewing.sex} />
                <Field label="Estado civil" value={viewing.marital} />
                <Field label="Cidade" value={viewing.city} />
                <Field label="Estado" value={viewing.state} />
                <Field label="Igreja" value={viewing.church} />
                <Field label="Anos batismo" value={viewing.years_baptized?.toString()} />
                <Field label="Email" value={viewing.email} />
                <Field label="Telefone" value={viewing.phone} />
              </div>
              {viewing.bio && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sobre</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{viewing.bio}</p>
                </div>
              )}
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preferências</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <Field label="Idade mín" value={viewing.pref_age_min?.toString()} />
                  <Field label="Idade máx" value={viewing.pref_age_max?.toString()} />
                  <Field label="Localização" value={viewing.pref_location_scope} />
                  <Field label="Aceita filhos" value={viewing.pref_accepts_children == null ? null : viewing.pref_accepts_children ? "Sim" : "Não"} />
                </div>
                {viewing.pref_desired_quality && (
                  <p className="mt-2 text-sm"><span className="text-muted-foreground">Qualidade: </span>{viewing.pref_desired_quality}</p>
                )}
                {viewing.pref_looking_for_bio && (
                  <p className="mt-1 whitespace-pre-wrap text-sm"><span className="text-muted-foreground">Procura: </span>{viewing.pref_looking_for_bio}</p>
                )}
              </div>
              {viewing.notes && (
                <div className="rounded-xl border border-dashed p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">📝 Notas internas</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{viewing.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
