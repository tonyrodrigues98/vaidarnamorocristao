import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Ban, ShieldAlert, Flag, Newspaper, Trash2, Users as UsersIcon, ClipboardList, MessageSquareWarning, ShieldX, Heart, Plus, UserPlus, Search, BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/integrations/supabase/types";
import { ROLE_CONFIG, ROLE_PRIORITY, type AppRole } from "@/lib/roles";
import { RoleBadge } from "@/components/RoleBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { BibleVerseSelector, type BibleSelection } from "@/components/BibleVerseSelector";

type Row = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type Report = Database["public"]["Tables"]["reports"]["Row"];
type DailyPost = { id: string; title: string; content: string; published: boolean; published_at: string; kind: "news" | "devotional" };
type DailyPostFull = DailyPost & { bible_reference: string | null; bible_text: string | null };
type PreCadastro = Database["public"]["Tables"]["pre_cadastros"]["Row"];
type RestrictedWord = Database["public"]["Tables"]["restricted_words"]["Row"];
type AdminUserRow = Row & { primaryRole: AppRole };
type CoupleStatus = "aceitaram_conversar" | "namorando" | "casamento_marcado";
type PreMatchRow = {
  id: string;
  pre_cadastro_id: string;
  partner_pre_cadastro_id: string | null;
  partner_user_id: string | null;
  partner_full_name: string | null;
  partner_username: string | null;
  partner_age: number | null;
  partner_height_cm: number | null;
  partner_sex: string | null;
  partner_marital: string | null;
  partner_city: string | null;
  partner_state: string | null;
  partner_church: string | null;
  partner_has_children: boolean | null;
  partner_children_count: number | null;
  internal_notes: string | null;
  status: CoupleStatus | null;
  created_by: string;
  created_at: string;
};

const COUPLE_STATUS_LABEL: Record<CoupleStatus, string> = {
  aceitaram_conversar: "Aceitaram conversar",
  namorando: "Namorando",
  casamento_marcado: "Casamento marcado",
};

export const Route = createFileRoute("/admin/")({ component: Admin });

function Admin() {
  const { user, isAdmin, role, loading } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const isApresentador = role === "apresentador";
  const isModerador = role === "moderador";
  const canSeeAdminPanel = isAdmin || isApresentador || isModerador;

  type TabKey = "pending" | "approved" | "rejected" | "banned" | "reports" | "posts" | "users" | "pre_cadastros" | "restricted_words" | "flags";

  const availableTabs = useMemo<TabKey[]>(() => {
    if (isSuperAdmin) return ["pending","approved","rejected","banned","reports","posts","users","pre_cadastros","restricted_words","flags"];
    if (isAdmin) return ["pending","approved","rejected","banned","reports","posts","flags"];
    if (isApresentador) return ["pre_cadastros","flags"];
    if (isModerador) return ["flags"];
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
  const [bibleSel, setBibleSel] = useState<BibleSelection | null>(null);
  const [editingPost, setEditingPost] = useState<DailyPostFull | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editBibleSel, setEditBibleSel] = useState<BibleSelection | null>(null);
  const [editBusy, setEditBusy] = useState(false);

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
        .select("id, title, content, published, published_at, kind, bible_reference, bible_text")
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

  async function toggleVerified(userId: string, current: boolean) {
    if (!user) return;
    setBusy(userId);
    const patch: ProfileUpdate = current
      ? { verified: false, verified_at: null, verified_by: null }
      : { verified: true, verified_at: new Date().toISOString(), verified_by: user.id };
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(current ? "Verificação removida" : "Perfil verificado");
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
    const { error } = await supabase.from("daily_posts").insert({
      author_id: user.id,
      title: t,
      content: c,
      published: true,
      kind: newKind,
      bible_reference: newKind === "devotional" ? bibleSel?.reference ?? null : null,
      bible_text: newKind === "devotional" ? bibleSel?.text ?? null : null,
    });
    setPostBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Publicado");
    setNewTitle(""); setNewContent(""); setBibleSel(null);
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

  function openEditPost(p: DailyPost) {
    const full = p as DailyPostFull;
    setEditingPost(full);
    setEditTitle(full.title);
    setEditContent(full.content);
    if (full.kind === "devotional" && full.bible_reference) {
      // Try to parse "Livro 3:16" back into a selection placeholder
      const m = full.bible_reference.match(/^(.+)\s+(\d+):(\d+)$/);
      if (m) {
        setEditBibleSel({
          book: m[1],
          abbrev: "",
          chapter: parseInt(m[2], 10),
          verse: parseInt(m[3], 10),
          reference: full.bible_reference,
          text: full.bible_text ?? "",
        });
      } else {
        setEditBibleSel(null);
      }
    } else {
      setEditBibleSel(null);
    }
  }

  async function saveEditPost() {
    if (!editingPost) return;
    const t = editTitle.trim(); const c = editContent.trim();
    if (!t || !c) { toast.error("Preencha título e conteúdo"); return; }
    setEditBusy(true);
    const patch: { title: string; content: string; bible_reference: string | null; bible_text: string | null } = {
      title: t,
      content: c,
      bible_reference: editingPost.kind === "devotional" ? editBibleSel?.reference ?? null : null,
      bible_text: editingPost.kind === "devotional" ? editBibleSel?.text ?? null : null,
    };
    const { error } = await supabase.from("daily_posts").update(patch).eq("id", editingPost.id);
    setEditBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Publicação atualizada");
    setEditingPost(null);
    load("posts");
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
          {(isAdmin || isSuperAdmin) && (
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/verificacoes">✔ Verificações de perfil</Link>
              </Button>
            </div>
          )}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-8">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto">
            {availableTabs.includes("pending") && <TabsTrigger value="pending">Pendentes</TabsTrigger>}
            {availableTabs.includes("approved") && <TabsTrigger value="approved">Aprovados</TabsTrigger>}
            {availableTabs.includes("rejected") && <TabsTrigger value="rejected">Rejeitados</TabsTrigger>}
            {availableTabs.includes("banned") && <TabsTrigger value="banned">Banidos</TabsTrigger>}
            {availableTabs.includes("reports") && <TabsTrigger value="reports"><Flag className="mr-1 h-3 w-3" /> Denúncias</TabsTrigger>}
            {availableTabs.includes("posts") && <TabsTrigger value="posts"><Newspaper className="mr-1 h-3 w-3" /> Texto Diário</TabsTrigger>}
            {availableTabs.includes("users") && <TabsTrigger value="users"><UsersIcon className="mr-1 h-3 w-3" /> Usuários</TabsTrigger>}
            {availableTabs.includes("pre_cadastros") && <TabsTrigger value="pre_cadastros"><ClipboardList className="mr-1 h-3 w-3" /> Pré-cadastros</TabsTrigger>}
            {availableTabs.includes("restricted_words") && <TabsTrigger value="restricted_words"><ShieldX className="mr-1 h-3 w-3" /> Palavras Restritas</TabsTrigger>}
            {availableTabs.includes("flags") && <TabsTrigger value="flags"><MessageSquareWarning className="mr-1 h-3 w-3" /> Sinalizações</TabsTrigger>}
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            {tab === "users" ? (
              <UsersPanel
                users={users}
                busy={busy}
                onChangeRole={changeUserRole}
                onToggleVerified={toggleVerified}
                canVerify={isSuperAdmin || isAdmin}
              />
            ) : tab === "restricted_words" ? (
              <RestrictedWordsPanel />
            ) : tab === "flags" ? (
              <FlagsPanel isSuperAdmin={isSuperAdmin} currentUserId={user?.id ?? null} />
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
                currentUserId={user?.id ?? null}
                isSuperAdmin={isSuperAdmin}
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
                  {newKind === "devotional" && (
                    <div className="mt-3 rounded-xl border border-dashed border-[var(--rose)]/30 bg-[var(--petal)]/20 p-3">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto bíblico base (opcional)</Label>
                      <div className="mt-2">
                        <BibleVerseSelector value={bibleSel} onChange={setBibleSel} />
                      </div>
                    </div>
                  )}
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
                            <Button size="sm" variant="outline" onClick={() => openEditPost(p)}>
                              Editar
                            </Button>
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
                <Dialog open={!!editingPost} onOpenChange={(o) => { if (!o) setEditingPost(null); }}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar {editingPost?.kind === "devotional" ? "devocional" : "notícia"}</DialogTitle>
                      <DialogDescription>
                        Atualize o conteúdo {editingPost?.kind === "devotional" ? "e a referência bíblica" : ""}. As alterações ficam visíveis imediatamente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Título</Label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={200} />
                      </div>
                      {editingPost?.kind === "devotional" && (
                        <div className="rounded-xl border border-dashed border-[var(--rose)]/30 bg-[var(--petal)]/20 p-3">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Texto bíblico base</Label>
                          <div className="mt-2">
                            <BibleVerseSelector value={editBibleSel} onChange={setEditBibleSel} />
                          </div>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Conteúdo</Label>
                        <Textarea className="min-h-[160px]" value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={10000} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setEditingPost(null)} disabled={editBusy}>Cancelar</Button>
                      <Button onClick={saveEditPost} disabled={editBusy}>Salvar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
  users, busy, onChangeRole, onToggleVerified, canVerify,
}: {
  users: AdminUserRow[];
  busy: string | null;
  onChangeRole: (userId: string, newRole: AppRole, currentRole: AppRole) => void;
  onToggleVerified: (userId: string, current: boolean) => void;
  canVerify: boolean;
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
              {u.verified && <VerifiedBadge size="sm" />}
            </div>
            <p className="truncate text-xs text-muted-foreground">{u.sex} · {u.city}/{u.state} · {u.status}</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {canVerify && (
              <Button
                size="sm"
                variant={u.verified ? "default" : "outline"}
                disabled={busy === u.id}
                onClick={() => onToggleVerified(u.id, !!u.verified)}
                title={u.verified ? "Remover verificação" : "Verificar perfil"}
              >
                <BadgeCheck className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 sm:w-52">
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
        </div>
      ))}
    </div>
  );
}

function PreCadastrosPanel({
  items, editing, draft, setDraft, onEdit, onCancel, onSave, onDelete, busy, currentUserId, isSuperAdmin,
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
  currentUserId: string | null;
  isSuperAdmin: boolean;
}) {
  const set = <K extends keyof PreCadastro>(k: K, v: PreCadastro[K] | null) =>
    setDraft({ ...draft, [k]: v });
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<PreCadastro | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [filterMatches, setFilterMatches] = useState(false);
  const [matches, setMatches] = useState<PreMatchRow[]>([]);
  const [matchTarget, setMatchTarget] = useState<PreCadastro | null>(null);
  const [editingMatch, setEditingMatch] = useState<PreMatchRow | null>(null);

  const isFormOpen = creating || !!editing;

  const loadMatches = async () => {
    const { data, error } = await supabase
      .from("pre_cadastro_matches")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setMatches((data ?? []) as PreMatchRow[]);
  };

  useEffect(() => { loadMatches(); }, [items]);

  const matchesByPC = useMemo(() => {
    const map = new Map<string, PreMatchRow[]>();
    for (const m of matches) {
      const arr = map.get(m.pre_cadastro_id) ?? [];
      arr.push(m);
      map.set(m.pre_cadastro_id, arr);
    }
    return map;
  }, [matches]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (filterMatches) list = list.filter((p) => matchesByPC.has(p.id));
    if (q) {
      list = list.filter((p) => {
        const name = (p.full_name ?? "").toLowerCase();
        const tk = ((p as { tiktok_user?: string | null }).tiktok_user ?? "").toLowerCase();
        return name.includes(q) || tk.includes(q);
      });
    }
    return list;
  }, [items, search, filterMatches, matchesByPC]);

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

  const handleCancel = () => {
    setCreating(false);
    onCancel();
  };
  const handleSave = async () => {
    await onSave();
    setCreating(false);
  };
  const startCreate = () => {
    setDraft({});
    setCreating(true);
  };

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 shadow-soft">
        <div>
          <h3 className="text-lg font-semibold">Pré-cadastros</h3>
          <p className="text-xs text-muted-foreground">Cadastre fichas, registre matches e acompanhe o casal.</p>
        </div>
        <Button onClick={startCreate}><Plus className="mr-1 h-4 w-4" /> Cadastrar Ficha</Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(o) => { if (!o) handleCancel(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar pré-cadastro" : "Novo pré-cadastro"}</DialogTitle>
            <DialogDescription>Nenhum campo é obrigatório. Preencha o que tiver.</DialogDescription>
          </DialogHeader>
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
          <div className="space-y-1 sm:col-span-2"><Label>Usuário do TikTok</Label><Input value={(draft as { tiktok_user?: string | null }).tiktok_user ?? ""} onChange={(e) => setDraft({ ...draft, tiktok_user: e.target.value || null } as Partial<PreCadastro>)} placeholder="@usuario" /></div>
          <div className="space-y-1"><Label>Idade</Label><Input type="number" value={draft.age ?? ""} onChange={(e) => set("age", numOrNull(e.target.value))} /></div>
          <div className="space-y-1"><Label>Altura (cm)</Label><Input type="number" value={draft.height_cm ?? ""} onChange={(e) => set("height_cm", numOrNull(e.target.value))} /></div>
          <div className="space-y-1">
            <Label>Sexo</Label>
            <Select value={draft.sex ?? ""} onValueChange={(v) => set("sex", v || null)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Estado civil</Label>
            <Select value={draft.marital ?? ""} onValueChange={(v) => set("marital", v || null)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro</SelectItem>
                <SelectItem value="divorciado">Divorciado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Cidade</Label><Input value={draft.city ?? ""} onChange={(e) => set("city", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Estado (UF)</Label><Input value={draft.state ?? ""} onChange={(e) => set("state", e.target.value || null)} maxLength={2} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Igreja</Label><Input value={draft.church ?? ""} onChange={(e) => set("church", e.target.value || null)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Sobre</Label><Textarea value={draft.bio ?? ""} onChange={(e) => set("bio", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Idade desejada (mín)</Label><Input type="number" value={draft.pref_age_min ?? ""} onChange={(e) => set("pref_age_min", numOrNull(e.target.value))} /></div>
          <div className="space-y-1"><Label>Idade desejada (máx)</Label><Input type="number" value={draft.pref_age_max ?? ""} onChange={(e) => set("pref_age_max", numOrNull(e.target.value))} /></div>
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3 sm:col-span-2">
            <div>
              <Label className="text-sm">Tem problema com distância?</Label>
              <p className="text-xs text-muted-foreground">Ative se a distância <strong>não</strong> é problema</p>
            </div>
            <Switch
              checked={draft.pref_distance_ok ?? false}
              onCheckedChange={(v) => set("pref_distance_ok", v)}
            />
          </div>
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Tem filhos?</Label>
                <p className="text-xs text-muted-foreground">Indique se a pessoa já tem filhos</p>
              </div>
              <Switch
                checked={draft.has_children ?? false}
                onCheckedChange={(v) => setDraft({ ...draft, has_children: v, children_count: v ? draft.children_count ?? null : null })}
              />
            </div>
            {draft.has_children && (
              <div className="space-y-1">
                <Label className="text-xs">Quantidade de filhos</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.children_count ?? ""}
                  onChange={(e) => set("children_count", numOrNull(e.target.value))}
                />
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <div>
                <Label className="text-sm">Aceita pessoa com filhos?</Label>
                <p className="text-xs text-muted-foreground">Aceitaria um(a) parceiro(a) que já tem filhos</p>
              </div>
              <Switch
                checked={draft.accepts_partner_with_children ?? false}
                onCheckedChange={(v) => set("accepts_partner_with_children", v)}
              />
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2"><Label>Qualidade que busca</Label><Input value={draft.pref_desired_quality ?? ""} onChange={(e) => set("pref_desired_quality", e.target.value || null)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Sobre o que procura</Label><Textarea value={draft.pref_looking_for_bio ?? ""} onChange={(e) => set("pref_looking_for_bio", e.target.value || null)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Notas internas</Label><Textarea value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} /></div>
        </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            <Button onClick={handleSave} disabled={busy}>{editing ? "Salvar alterações" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="glass rounded-2xl p-4 shadow-soft">
        <Label htmlFor="pc-search" className="text-xs text-muted-foreground">Buscar</Label>
        <Input
          id="pc-search"
          className="mt-1"
          placeholder="Pesquisar por nome ou usuário do TikTok..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setFilterMatches((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
              filterMatches ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            <Heart className="h-3 w-3" /> Matches
          </button>
          <p className="text-xs text-muted-foreground">
            {filteredItems.length} de {items.length} pré-cadastro{items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhum pré-cadastro ainda.</div>
      ) : filteredItems.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhum resultado para "{search}".</div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((p) => (
            <PreCadastroCard
              key={p.id}
              p={p}
              matches={matchesByPC.get(p.id) ?? []}
              onView={setViewing}
              onEdit={onEdit}
              onDelete={onDelete}
              onMatch={() => setMatchTarget(p)}
              onEditMatch={(m) => setEditingMatch(m)}
              onDeleteMatch={async (m) => {
                if (!confirm("Remover este match?")) return;
                const { error } = await supabase.from("pre_cadastro_matches").delete().eq("id", m.id);
                if (error) { toast.error(error.message); return; }
                toast.success("Match removido");
                loadMatches();
              }}
            />
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
                <Field label="TikTok" value={(viewing as { tiktok_user?: string | null }).tiktok_user} />
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
                  <Field label="Distância OK" value={viewing.pref_distance_ok == null ? null : viewing.pref_distance_ok ? "Sim" : "Não"} />
                  <Field label="Tem filhos" value={viewing.has_children == null ? null : viewing.has_children ? `Sim${viewing.children_count ? ` (${viewing.children_count})` : ""}` : "Não"} />
                  <Field label="Aceita c/ filhos" value={viewing.accepts_partner_with_children == null ? null : viewing.accepts_partner_with_children ? "Sim" : "Não"} />
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

      <MatchDialog
        target={matchTarget}
        editing={editingMatch}
        currentUserId={currentUserId}
        onClose={() => { setMatchTarget(null); setEditingMatch(null); }}
        onSaved={() => { setMatchTarget(null); setEditingMatch(null); loadMatches(); }}
      />
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

function RestrictedWordsPanel() {
  const [words, setWords] = useState<RestrictedWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("restricted_words")
      .select("*")
      .order("word", { ascending: true });
    if (error) { toast.error(error.message); return; }
    setWords((data ?? []) as RestrictedWord[]);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    setBusy(true);
    const { error } = await supabase.from("restricted_words").insert({ word: w });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setNewWord("");
    toast.success("Palavra adicionada");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover esta palavra?")) return;
    const { error } = await supabase.from("restricted_words").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removida");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h3 className="text-lg font-semibold">Palavras restritas</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Mensagens contendo essas palavras serão bloqueadas no chat da comunidade e nas conversas privadas, com aviso ao remetente.
        </p>
        <div className="mt-4 flex gap-2">
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Adicionar palavra..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            maxLength={60}
          />
          <Button onClick={add} disabled={busy || !newWord.trim()}>Adicionar</Button>
        </div>
      </div>
      {words.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">
          Nenhuma palavra cadastrada.
        </div>
      ) : (
        <div className="glass rounded-2xl p-4 shadow-soft">
          <div className="flex flex-wrap gap-2">
            {words.map((w) => (
              <div
                key={w.id}
                className="group flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{w.word}</span>
                <button
                  type="button"
                  onClick={() => remove(w.id)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remover ${w.word}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreCadastroCard({
  p, matches, onView, onEdit, onDelete, onMatch, onEditMatch, onDeleteMatch,
}: {
  p: PreCadastro;
  matches: PreMatchRow[];
  onView: (p: PreCadastro) => void;
  onEdit: (p: PreCadastro) => void;
  onDelete: (id: string) => void;
  onMatch: () => void;
  onEditMatch: (m: PreMatchRow) => void;
  onDeleteMatch: (m: PreMatchRow) => void;
}) {
  const hasMatch = matches.length > 0;
  return (
    <div className={`glass rounded-2xl p-4 shadow-soft ${hasMatch ? "ring-1 ring-pink-400/40" : ""}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onView(p)}
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
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{p.full_name ?? "(sem nome)"}{p.age ? `, ${p.age}` : ""}</h4>
            {hasMatch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-pink-600 dark:text-pink-300">
                <Heart className="h-3 w-3" /> Match
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {[p.sex, p.marital, p.city && p.state ? `${p.city}/${p.state}` : p.city || p.state, p.church].filter(Boolean).join(" · ")}
          </p>
          {p.bio && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{p.bio}</p>}
          {p.notes && <p className="mt-1 text-xs italic text-muted-foreground">📝 {p.notes}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant="outline" onClick={() => onView(p)}>Visualizar</Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Editar</Button>
          <Button size="sm" variant="outline" className="border-pink-400/60 text-pink-600 hover:bg-pink-500/10" onClick={onMatch}>
            <Heart className="mr-1 h-3 w-3" /> Match
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {hasMatch && (
        <div className="mt-3 space-y-2 rounded-xl border border-pink-300/40 bg-pink-500/5 p-3">
          {matches.map((m) => (
            <div key={m.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  💕 {m.partner_full_name ?? "(par sem nome)"}
                  {m.partner_age ? `, ${m.partner_age}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[m.partner_sex, m.partner_marital, m.partner_city && m.partner_state ? `${m.partner_city}/${m.partner_state}` : m.partner_city || m.partner_state, m.partner_church].filter(Boolean).join(" · ")}
                </p>
                {m.status && (
                  <span className="mt-1 inline-block rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-foreground/80">
                    {COUPLE_STATUS_LABEL[m.status]}
                  </span>
                )}
                {m.internal_notes && (
                  <p className="mt-1 text-xs italic text-muted-foreground">📝 {m.internal_notes}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => onEditMatch(m)}><Pencil1 /></Button>
                <Button size="sm" variant="ghost" onClick={() => onDeleteMatch(m)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pencil1() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function MatchDialog({
  target, editing, currentUserId, onClose, onSaved,
}: {
  target: PreCadastro | null;
  editing: PreMatchRow | null;
  currentUserId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!target || !!editing;
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [draft, setDraft] = useState<Partial<PreMatchRow>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Array<{ kind: "pc" | "user"; id: string; name: string; age: number | null; sex: string | null; city: string | null; state: string | null; church: string | null; marital: string | null; height_cm: number | null; }>>([]);

  // Determinar sexo oposto baseado no target
  const targetSex = target?.sex ?? null;
  const oppositeSex = targetSex === "masculino" ? "feminino" : targetSex === "feminino" ? "masculino" : null;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDraft(editing);
      setMode(editing.partner_pre_cadastro_id || editing.partner_user_id ? "existing" : "new");
    } else {
      setDraft({ partner_sex: oppositeSex });
      setMode("new");
      setSearch("");
      setResults([]);
    }
  }, [open, editing, oppositeSex]);

  const set = <K extends keyof PreMatchRow>(k: K, v: PreMatchRow[K] | null) => setDraft((d) => ({ ...d, [k]: v }));
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

  async function runSearch(q: string) {
    setSearch(q);
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    const [{ data: pcs }, { data: profs }] = await Promise.all([
      supabase
        .from("pre_cadastros")
        .select("id, full_name, age, sex, marital, city, state, church, height_cm, tiktok_user")
        .ilike("full_name", `%${term}%`)
        .limit(8),
      supabase
        .from("profiles")
        .select("id, full_name, age, sex, marital, city, state, church, height_cm")
        .eq("status", "approved")
        .ilike("full_name", `%${term}%`)
        .limit(8),
    ]);
    const a = (pcs ?? [])
      .filter((r) => r.id !== target?.id)
      .map((r) => ({ kind: "pc" as const, id: r.id, name: r.full_name ?? "(sem nome)", age: r.age, sex: r.sex, city: r.city, state: r.state, church: r.church, marital: r.marital, height_cm: r.height_cm }));
    const b = (profs ?? []).map((r) => ({ kind: "user" as const, id: r.id, name: r.full_name, age: r.age, sex: r.sex, city: r.city, state: r.state, church: r.church, marital: r.marital, height_cm: r.height_cm }));
    setResults([...a, ...b]);
  }

  function pickResult(r: { kind: "pc" | "user"; id: string; name: string; age: number | null; sex: string | null; city: string | null; state: string | null; church: string | null; marital: string | null; height_cm: number | null }) {
    setDraft((d) => ({
      ...d,
      partner_pre_cadastro_id: r.kind === "pc" ? r.id : null,
      partner_user_id: r.kind === "user" ? r.id : null,
      partner_full_name: r.name,
      partner_age: r.age,
      partner_sex: r.sex,
      partner_city: r.city,
      partner_state: r.state,
      partner_church: r.church,
      partner_marital: r.marital,
      partner_height_cm: r.height_cm,
    }));
  }

  async function save() {
    if (!currentUserId) return;
    const pcId = editing?.pre_cadastro_id ?? target?.id;
    if (!pcId) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("pre_cadastro_matches")
        .update({
          partner_pre_cadastro_id: draft.partner_pre_cadastro_id ?? null,
          partner_user_id: draft.partner_user_id ?? null,
          partner_full_name: draft.partner_full_name ?? null,
          partner_username: draft.partner_username ?? null,
          partner_age: draft.partner_age ?? null,
          partner_height_cm: draft.partner_height_cm ?? null,
          partner_sex: draft.partner_sex ?? null,
          partner_marital: draft.partner_marital ?? null,
          partner_city: draft.partner_city ?? null,
          partner_state: draft.partner_state ?? null,
          partner_church: draft.partner_church ?? null,
          partner_has_children: draft.partner_has_children ?? null,
          partner_children_count: draft.partner_children_count ?? null,
          internal_notes: draft.internal_notes ?? null,
          status: draft.status ?? null,
        })
        .eq("id", editing.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Match atualizado");
    } else {
      const { error } = await supabase
        .from("pre_cadastro_matches")
        .insert({
          pre_cadastro_id: pcId,
          created_by: currentUserId,
          partner_pre_cadastro_id: draft.partner_pre_cadastro_id ?? null,
          partner_user_id: draft.partner_user_id ?? null,
          partner_full_name: draft.partner_full_name ?? null,
          partner_username: draft.partner_username ?? null,
          partner_age: draft.partner_age ?? null,
          partner_height_cm: draft.partner_height_cm ?? null,
          partner_sex: draft.partner_sex ?? null,
          partner_marital: draft.partner_marital ?? null,
          partner_city: draft.partner_city ?? null,
          partner_state: draft.partner_state ?? null,
          partner_church: draft.partner_church ?? null,
          partner_has_children: draft.partner_has_children ?? null,
          partner_children_count: draft.partner_children_count ?? null,
          internal_notes: draft.internal_notes ?? null,
          status: draft.status ?? null,
        });
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Match criado");
    }
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Match" : "Novo Match"}</DialogTitle>
          <DialogDescription>
            {target ? `Para ${target.full_name ?? "(sem nome)"}` : editing ? "Edição do match existente" : ""}
            {oppositeSex && !editing ? ` · sexo do par será ${oppositeSex}` : ""}
          </DialogDescription>
        </DialogHeader>

        {!editing && (
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>
              <UserPlus className="mr-1 h-4 w-4" /> Novo Match (ficha)
            </Button>
            <Button size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>
              <Search className="mr-1 h-4 w-4" /> Usuário Existente
            </Button>
          </div>
        )}

        {mode === "existing" && !editing && (
          <div className="space-y-2">
            <Input placeholder="Buscar pelo nome..." value={search} onChange={(e) => runSearch(e.target.value)} />
            {results.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                {results.map((r) => (
                  <button
                    key={`${r.kind}-${r.id}`}
                    type="button"
                    onClick={() => pickResult(r)}
                    className={`flex w-full items-center justify-between gap-2 border-b border-border p-2 text-left text-sm hover:bg-accent ${
                      (r.kind === "pc" && draft.partner_pre_cadastro_id === r.id) || (r.kind === "user" && draft.partner_user_id === r.id) ? "bg-primary/10" : ""
                    }`}
                  >
                    <span>
                      <span className="font-medium">{r.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{r.age ? `${r.age} anos · ` : ""}{r.city}/{r.state}</span>
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {r.kind === "pc" ? "Ficha" : "Usuário"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><Label>Nome</Label><Input value={draft.partner_full_name ?? ""} onChange={(e) => set("partner_full_name", e.target.value || null)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Usuário</Label><Input value={draft.partner_username ?? ""} onChange={(e) => set("partner_username", e.target.value || null)} placeholder="@usuario" /></div>
          <div className="space-y-1"><Label>Idade</Label><Input type="number" value={draft.partner_age ?? ""} onChange={(e) => set("partner_age", numOrNull(e.target.value))} /></div>
          <div className="space-y-1"><Label>Altura (cm)</Label><Input type="number" value={draft.partner_height_cm ?? ""} onChange={(e) => set("partner_height_cm", numOrNull(e.target.value))} /></div>
          <div className="space-y-1">
            <Label>Sexo</Label>
            <Select value={draft.partner_sex ?? ""} onValueChange={(v) => set("partner_sex", v || null)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
            {!editing && oppositeSex && draft.partner_sex && draft.partner_sex !== oppositeSex && (
              <p className="text-[11px] text-amber-600">Atenção: sexo cadastrado não é o oposto do principal.</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Estado civil</Label>
            <Select value={draft.partner_marital ?? ""} onValueChange={(v) => set("partner_marital", v || null)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro</SelectItem>
                <SelectItem value="divorciado">Divorciado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Cidade</Label><Input value={draft.partner_city ?? ""} onChange={(e) => set("partner_city", e.target.value || null)} /></div>
          <div className="space-y-1"><Label>Estado (UF)</Label><Input value={draft.partner_state ?? ""} onChange={(e) => set("partner_state", e.target.value || null)} maxLength={2} /></div>
          <div className="space-y-1 sm:col-span-2"><Label>Igreja</Label><Input value={draft.partner_church ?? ""} onChange={(e) => set("partner_church", e.target.value || null)} /></div>
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Tem filhos?</Label>
              <Switch
                checked={draft.partner_has_children ?? false}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, partner_has_children: v, partner_children_count: v ? d.partner_children_count ?? null : null }))}
              />
            </div>
            {draft.partner_has_children && (
              <div className="space-y-1">
                <Label className="text-xs">Quantidade</Label>
                <Input type="number" min={1} value={draft.partner_children_count ?? ""} onChange={(e) => set("partner_children_count", numOrNull(e.target.value))} />
              </div>
            )}
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Status do casal</Label>
            <Select value={draft.status ?? ""} onValueChange={(v) => set("status", (v || null) as CoupleStatus | null)}>
              <SelectTrigger><SelectValue placeholder="(sem status)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aceitaram_conversar">Aceitaram conversar</SelectItem>
                <SelectItem value="namorando">Namorando</SelectItem>
                <SelectItem value="casamento_marcado">Casamento marcado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2"><Label>Nota interna</Label><Textarea value={draft.internal_notes ?? ""} onChange={(e) => set("internal_notes", e.target.value || null)} /></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{editing ? "Salvar" : "Criar Match"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FlagsPanel({ isSuperAdmin, currentUserId }: { isSuperAdmin: boolean; currentUserId: string | null }) {
  type FlagRow = {
    id: string;
    message_id: string;
    flagged_by: string;
    reason: string;
    created_at: string;
  };
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [messages, setMessages] = useState<Record<string, { content: string; sender_id: string; created_at: string }>>({});
  const [profs, setProfs] = useState<Record<string, { full_name: string | null }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("message_flags")
      .select("id, message_id, flagged_by, reason, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const list = (data ?? []) as FlagRow[];
    setFlags(list);
    const msgIds = Array.from(new Set(list.map((f) => f.message_id)));
    const { data: msgs } = msgIds.length
      ? await supabase.from("global_messages").select("id, content, sender_id, created_at").in("id", msgIds)
      : { data: [] as Array<{ id: string; content: string; sender_id: string; created_at: string }> };
    const mMap: Record<string, { content: string; sender_id: string; created_at: string }> = {};
    for (const m of msgs ?? []) mMap[m.id] = { content: m.content, sender_id: m.sender_id, created_at: m.created_at };
    setMessages(mMap);
    const userIds = Array.from(new Set([
      ...list.map((f) => f.flagged_by),
      ...Object.values(mMap).map((m) => m.sender_id),
    ]));
    const { data: ps } = userIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as Array<{ id: string; full_name: string | null }> };
    const pMap: Record<string, { full_name: string | null }> = {};
    for (const p of ps ?? []) pMap[p.id] = { full_name: p.full_name };
    setProfs(pMap);
  }

  useEffect(() => { load(); }, []);

  async function deleteFlag(id: string) {
    if (!confirm("Excluir esta sinalização?")) return;
    const { error } = await supabase.from("message_flags").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Sinalização excluída");
    load();
  }

  async function saveEdit(id: string) {
    const reason = editText.trim();
    if (!reason) return;
    const { error } = await supabase.from("message_flags").update({ reason }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingId(null);
    setEditText("");
    toast.success("Atualizada");
    load();
  }

  if (flags.length === 0) {
    return <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">Nenhuma sinalização.</div>;
  }

  return (
    <div className="grid gap-3">
      {flags.map((f) => {
        const msg = messages[f.message_id];
        const senderName = msg ? (profs[msg.sender_id]?.full_name ?? "Alguém") : "(mensagem removida)";
        const flagger = profs[f.flagged_by]?.full_name ?? "Alguém";
        const isMine = f.flagged_by === currentUserId;
        const canDelete = isSuperAdmin || isMine;
        return (
          <div key={f.id} className="glass rounded-2xl p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  Sinalizada por <strong className="text-foreground">{flagger}</strong> · {new Date(f.created_at).toLocaleString("pt-BR")}
                </p>
                <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Mensagem de {senderName}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{msg?.content ?? "(mensagem indisponível)"}</p>
                </div>
                <div className="mt-2 rounded-lg border border-amber-400/40 bg-amber-500/5 p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Motivo</p>
                  {editingId === f.id ? (
                    <div className="mt-1 space-y-2">
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} maxLength={500} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(f.id)}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditText(""); }}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">{f.reason}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {isSuperAdmin && msg && (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/pretendentes/$id" params={{ id: msg.sender_id }}>Ver perfil</Link>
                  </Button>
                )}
                {isMine && editingId !== f.id && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(f.id); setEditText(f.reason); }}>Editar</Button>
                )}
                {canDelete && (
                  <Button size="sm" variant="ghost" onClick={() => deleteFlag(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
