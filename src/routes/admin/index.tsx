import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Ban, ShieldAlert, Flag, Newspaper, Trash2, Users as UsersIcon, ClipboardList, MessageSquareWarning, ShieldX, Heart, Plus, UserPlus, Search, BadgeCheck, LifeBuoy, Settings, AlertTriangle, MessageSquare, Eye, MailOpen, Gavel } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/integrations/supabase/types";
import { ROLE_CONFIG, ROLE_PRIORITY, type AppRole } from "@/lib/roles";
import { RoleBadge } from "@/components/RoleBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { UserBadges, invalidateUserBadges } from "@/components/UserBadges";
import { BADGE_META, type BadgeCode } from "@/lib/badges";
import { Award as AwardIcon } from "lucide-react";
import { BibleVerseSelector, type BibleSelection } from "@/components/BibleVerseSelector";

type Row = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type Report = Database["public"]["Tables"]["reports"]["Row"];
type DailyPost = { id: string; title: string; content: string; published: boolean; published_at: string; kind: "news" | "devotional" };
type DailyPostFull = DailyPost & { bible_reference: string | null; bible_text: string | null };
type PreCadastro = Database["public"]["Tables"]["pre_cadastros"]["Row"];
type RestrictedWord = Database["public"]["Tables"]["restricted_words"]["Row"];
type AdminUserRow = Row & { primaryRole: AppRole };
type AdminUserRowWithSupport = AdminUserRow & { isSupportAgent: boolean };
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
    if (isAdmin) return ["pending","approved","rejected","banned","reports","posts","restricted_words","flags"];
    if (isApresentador) return ["pre_cadastros","reports","posts","restricted_words","flags"];
    if (isModerador) return ["reports","posts","restricted_words","flags"];
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
  const [users, setUsers] = useState<AdminUserRowWithSupport[]>([]);
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
        supabase.from("user_roles").select("user_id, role, is_support_agent"),
      ]);
      if (pe) { toast.error(pe.message); return; }
      const roleMap = new Map<string, AppRole>();
      const supportMap = new Map<string, boolean>();
      for (const r of (roles ?? []) as Array<{ user_id: string; role: AppRole; is_support_agent: boolean | null }>) {
        const cur = roleMap.get(r.user_id);
        if (!cur || ROLE_PRIORITY.indexOf(r.role) < ROLE_PRIORITY.indexOf(cur)) {
          roleMap.set(r.user_id, r.role);
        }
        if (r.is_support_agent) supportMap.set(r.user_id, true);
      }
      setUsers(((profs ?? []) as Row[]).map((p) => ({
        ...p,
        primaryRole: roleMap.get(p.id) ?? "user",
        isSupportAgent: supportMap.get(p.id) ?? false,
      })));
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
    // Tabs com painéis próprios (fazem fetch internamente).
    // Evita query inválida em profiles.status com valores que não são enum.
    if (status === "flags" || status === "restricted_words") {
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

  async function toggleSupportAgent(userId: string, currentRole: AppRole, current: boolean) {
    if (!user) return;
    if (currentRole !== "moderador" && currentRole !== "apresentador") {
      toast.error("Apenas moderadores e apresentadores podem ser agentes de suporte.");
      return;
    }
    setBusy(userId);
    const { error } = await supabase
      .from("user_roles")
      .update({ is_support_agent: !current })
      .eq("user_id", userId)
      .eq("role", currentRole);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "Acesso ao suporte concedido" : "Acesso ao suporte removido");
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
              <Button asChild variant="outline" size="sm" className="mr-2">
                <Link to="/admin/verificacoes">✔ Verificações de perfil</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/fotos">📷 Análise de Fotos</Link>
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
                onToggleSupportAgent={toggleSupportAgent}
                canManageSupportAgents={isSuperAdmin}
              />
            ) : tab === "restricted_words" ? (
              <RestrictedWordsPanel />
            ) : tab === "flags" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Pedidos de oração denunciados
                  </h2>
                  <PrayerReportsPanel isSuperAdmin={isSuperAdmin} />
                </div>
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Mensagens sinalizadas
                  </h2>
                  <FlagsPanel isSuperAdmin={isSuperAdmin} currentUserId={user?.id ?? null} />
                </div>
              </div>
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
            ) : tab === "banned" ? (
              <div className="space-y-6">
                <BannedAppealsPanel />
                {rows.length === 0 ? (
                  <div className="glass rounded-2xl p-10 text-center text-muted-foreground shadow-soft">
                    Nenhum perfil banido.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {rows.map((r) => (
                      <div key={r.id} className="glass flex flex-col gap-4 rounded-2xl p-5 shadow-soft sm:flex-row">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                          {r.photo_url ? (
                            <img src={r.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-love text-2xl text-white">
                              {r.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{r.full_name}, {r.age}</h3>
                          <p className="text-sm text-muted-foreground">
                            {r.sex} · {r.city}/{r.state} · {r.church}
                          </p>
                          {r.banned_reason && (
                            <p className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                              <strong>Motivo:</strong> {r.banned_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 self-center">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === r.id}
                            onClick={async () => {
                              if (!confirm("Remover banimento e reaprovar este usuário?")) return;
                              const { error } = await supabase.rpc("admin_unban_user", { _user_id: r.id });
                              if (error) toast.error(error.message);
                              else { toast.success("Usuário desbanido"); load("banned"); }
                            }}
                          >
                            <Check className="mr-1 h-4 w-4" /> Desbanir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
  users, busy, onChangeRole, onToggleVerified, canVerify, onToggleSupportAgent, canManageSupportAgents,
}: {
  users: AdminUserRowWithSupport[];
  busy: string | null;
  onChangeRole: (userId: string, newRole: AppRole, currentRole: AppRole) => void;
  onToggleVerified: (userId: string, current: boolean) => void;
  canVerify: boolean;
  onToggleSupportAgent: (userId: string, currentRole: AppRole, current: boolean) => void;
  canManageSupportAgents: boolean;
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
              {u.isSupportAgent && (u.primaryRole === "moderador" || u.primaryRole === "apresentador") && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-500">
                  <LifeBuoy className="h-3 w-3" /> Suporte
                </span>
              )}
              <UserBadges userId={u.id} size="xs" max={5} />
            </div>
            <p className="truncate text-xs text-muted-foreground">{u.sex} · {u.city}/{u.state} · {u.status}</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <BadgeAdminControls userId={u.id} userName={u.full_name} />
            <UserGearMenu user={u} />
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
            {canManageSupportAgents && (u.primaryRole === "moderador" || u.primaryRole === "apresentador") && (
              <Button
                size="sm"
                variant={u.isSupportAgent ? "default" : "outline"}
                disabled={busy === u.id}
                onClick={() => onToggleSupportAgent(u.id, u.primaryRole, u.isSupportAgent)}
                title={u.isSupportAgent ? "Revogar acesso ao suporte" : "Conceder acesso ao suporte"}
              >
                <LifeBuoy className="h-4 w-4" />
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

  // Real-time TikTok duplicate detection
  const [tiktokCheckBusy, setTiktokCheckBusy] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState<PreCadastro | null>(null);
  const [duplicateDismissed, setDuplicateDismissed] = useState<string | null>(null);

  const normalizeTiktok = (v: string) =>
    v.trim().toLowerCase().replace(/^@+/, "").replace(/\s+/g, "");

  const currentTiktok = (draft as { tiktok_user?: string | null }).tiktok_user ?? "";

  useEffect(() => {
    if (!isFormOpen) return;
    const raw = currentTiktok;
    const norm = normalizeTiktok(raw);
    if (!norm || norm.length < 2) {
      setDuplicateMatch(null);
      return;
    }
    if (duplicateDismissed && duplicateDismissed === norm) return;

    let cancelled = false;
    setTiktokCheckBusy(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from("pre_cadastros")
        .select("*")
        .ilike("tiktok_user", norm)
        .limit(5);
      if (cancelled) return;
      setTiktokCheckBusy(false);
      if (error) return;
      const found = (data ?? []).find((p) => {
        const t = normalizeTiktok((p as { tiktok_user?: string | null }).tiktok_user ?? "");
        if (t !== norm) return false;
        if (editing && p.id === editing.id) return false;
        return true;
      });
      setDuplicateMatch((found as PreCadastro) ?? null);
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [currentTiktok, isFormOpen, editing, duplicateDismissed]);

  const handleLoadDuplicate = () => {
    if (!duplicateMatch) return;
    setCreating(false);
    onEdit(duplicateMatch);
    setDuplicateMatch(null);
    setDuplicateDismissed(null);
  };
  const handleDismissDuplicate = () => {
    if (duplicateMatch) {
      const t = normalizeTiktok((duplicateMatch as { tiktok_user?: string | null }).tiktok_user ?? "");
      setDuplicateDismissed(t);
    }
    setDuplicateMatch(null);
  };

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
          <div className="space-y-1 sm:col-span-2">
            <Label>Usuário do TikTok</Label>
            <Input
              value={(draft as { tiktok_user?: string | null }).tiktok_user ?? ""}
              onChange={(e) => {
                setDuplicateDismissed(null);
                setDraft({ ...draft, tiktok_user: e.target.value || null } as Partial<PreCadastro>);
              }}
              placeholder="@usuario"
            />
            {tiktokCheckBusy && (
              <p className="text-xs text-muted-foreground">Verificando se já existe…</p>
            )}
            {!tiktokCheckBusy && duplicateDismissed && normalizeTiktok(currentTiktok) === duplicateDismissed && (
              <p className="text-xs text-amber-600">Você optou por criar uma nova ficha com este usuário.</p>
            )}
          </div>
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

      <AlertDialog open={!!duplicateMatch} onOpenChange={(o) => { if (!o) handleDismissDuplicate(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Já existe um cadastro com esse usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Encontramos uma ficha com o usuário do TikTok{" "}
              <strong>@{normalizeTiktok((duplicateMatch as { tiktok_user?: string | null } | null)?.tiktok_user ?? "")}</strong>
              {duplicateMatch?.full_name ? <> de <strong>{duplicateMatch.full_name}</strong></> : null}.
              Deseja carregar essa ficha para editá-la?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDismissDuplicate}>Não, criar nova</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLoadDuplicate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/40"
            >
              Sim, carregar ficha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

function BadgeAdminControls({ userId, userName }: { userId: string; userName: string }) {
  // (PrayerReportsPanel defined below)
  const [busy, setBusy] = useState(false);

  async function award() {
    if (!confirm(`Atribuir badge "Contribuidor" a ${userName} por 30 dias?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("award_contributor_badge", { _user_id: userId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    invalidateUserBadges(userId);
    toast.success("Badge Contribuidor atribuída");
  }

  async function removeBadge(code: BadgeCode) {
    if (!confirm(`Remover badge "${BADGE_META[code].name}" deste usuário?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_remove_badge", { _user_id: userId, _code: code });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    invalidateUserBadges(userId);
    toast.success("Badge removida");
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="outline" disabled={busy} onClick={award} title="Atribuir Contribuidor (30 dias)">
        <AwardIcon className="h-4 w-4" />
      </Button>
      <Select onValueChange={(v) => removeBadge(v as BadgeCode)} disabled={busy}>
        <SelectTrigger className="h-9 w-[44px] px-2"><span className="text-xs">−</span></SelectTrigger>
        <SelectContent>
          {(Object.keys(BADGE_META) as BadgeCode[]).map((c) => (
            <SelectItem key={c} value={c}>Remover: {BADGE_META[c].name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PrayerReportsPanel({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  type ReportRow = {
    id: string;
    request_id: string;
    reporter_id: string;
    reason: string;
    status: string;
    created_at: string;
  };
  type ReqRow = {
    id: string;
    user_id: string;
    title: string;
    content: string;
    moderation_status: string;
    is_anonymous: boolean;
  };
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reqs, setReqs] = useState<Record<string, ReqRow>>({});
  const [profs, setProfs] = useState<Record<string, { full_name: string | null }>>({});

  async function load() {
    const { data, error } = await supabase
      .from("prayer_request_reports")
      .select("id, request_id, reporter_id, reason, status, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    const list = (data ?? []) as ReportRow[];
    setReports(list);
    const reqIds = Array.from(new Set(list.map((r) => r.request_id)));
    const { data: rs } = reqIds.length
      ? await supabase.from("prayer_requests")
          .select("id, user_id, title, content, moderation_status, is_anonymous")
          .in("id", reqIds)
      : { data: [] as ReqRow[] };
    const rMap: Record<string, ReqRow> = {};
    for (const r of (rs ?? []) as ReqRow[]) rMap[r.id] = r;
    setReqs(rMap);
    const userIds = Array.from(new Set([
      ...list.map((r) => r.reporter_id),
      ...Object.values(rMap).map((r) => r.user_id),
    ]));
    const { data: ps } = userIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as Array<{ id: string; full_name: string | null }> };
    const pMap: Record<string, { full_name: string | null }> = {};
    for (const p of ps ?? []) pMap[p.id] = { full_name: p.full_name };
    setProfs(pMap);
  }

  useEffect(() => { load(); }, []);

  async function setModeration(requestId: string, status: "visible" | "hidden" | "removed") {
    const { error } = await supabase
      .from("prayer_requests")
      .update({ moderation_status: status })
      .eq("id", requestId);
    if (error) { toast.error(error.message); return; }
    toast.success(
      status === "visible" ? "Pedido restaurado"
      : status === "hidden" ? "Pedido ocultado"
      : "Pedido marcado como removido",
    );
    load();
  }

  async function resolveReport(id: string) {
    const { error } = await supabase
      .from("prayer_request_reports")
      .update({ status: "resolved" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Denúncia marcada como resolvida");
    load();
  }

  async function deleteReport(id: string) {
    if (!confirm("Excluir esta denúncia?")) return;
    const { error } = await supabase.from("prayer_request_reports").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Denúncia excluída");
    load();
  }

  if (reports.length === 0) {
    return <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-soft">Nenhuma denúncia em pedidos de oração.</div>;
  }

  return (
    <div className="grid gap-3">
      {reports.map((r) => {
        const req = reqs[r.request_id];
        const reporterName = profs[r.reporter_id]?.full_name ?? "Alguém";
        const authorName = req
          ? (req.is_anonymous ? "Anônimo" : (profs[req.user_id]?.full_name ?? "Irmão(a)"))
          : "(pedido removido)";
        const isResolved = r.status === "resolved";
        return (
          <div key={r.id} className="glass rounded-2xl p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  Denunciado por <strong className="text-foreground">{reporterName}</strong>
                  {" · "}{new Date(r.created_at).toLocaleString("pt-BR")}
                  {isResolved && <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400">resolvida</span>}
                </p>
                <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Pedido de {authorName}
                    {req && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide">
                        [{req.moderation_status}]
                      </span>
                    )}
                  </p>
                  {req ? (
                    <>
                      <p className="mt-1 break-words text-sm font-medium">{req.title}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/90">{req.content}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm italic text-muted-foreground">(pedido indisponível)</p>
                  )}
                </div>
                <div className="mt-2 rounded-lg border border-amber-400/40 bg-amber-500/5 p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Motivo da denúncia</p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{r.reason}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col">
                {req && (
                  <>
                    {req.moderation_status !== "hidden" && (
                      <Button size="sm" variant="outline" onClick={() => setModeration(req.id, "hidden")}>
                        Ocultar
                      </Button>
                    )}
                    {req.moderation_status !== "removed" && (
                      <Button size="sm" variant="outline" onClick={() => setModeration(req.id, "removed")}>
                        Remover
                      </Button>
                    )}
                    {req.moderation_status !== "visible" && (
                      <Button size="sm" variant="outline" onClick={() => setModeration(req.id, "visible")}>
                        Restaurar
                      </Button>
                    )}
                  </>
                )}
                {!isResolved && (
                  <Button size="sm" variant="ghost" onClick={() => resolveReport(r.id)}>
                    Marcar resolvida
                  </Button>
                )}
                {isSuperAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => deleteReport(r.id)}>
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

// ============================================================================
// UserGearMenu — menu de engrenagem com ações administrativas por usuário
// ============================================================================
function UserGearMenu({ user }: { user: AdminUserRowWithSupport }) {
  const { user: me } = useAuth();
  const [openRequest, setOpenRequest] = useState(false);
  const [openWarning, setOpenWarning] = useState(false);
  const [openBan, setOpenBan] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const [reqKind, setReqKind] = useState<"photo" | "bio" | "behavior" | "other">("photo");
  const [reqMsg, setReqMsg] = useState("");
  const [warnMsg, setWarnMsg] = useState("");
  const [warnSeverity, setWarnSeverity] = useState<"amber" | "severe">("amber");
  const [banReason, setBanReason] = useState("");
  const [delReason, setDelReason] = useState("");
  const [delConfirm, setDelConfirm] = useState("");

  async function submitRequest() {
    if (!me) return;
    if (reqMsg.trim().length < 5) { toast.error("Descreva a solicitação."); return; }
    setBusy(true);
    const { error } = await supabase.from("user_admin_requests").insert({
      user_id: user.id,
      created_by: me.id,
      kind: reqKind,
      message: reqMsg.trim(),
    });
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        actor_id: me.id,
        type: "admin_request",
        title: "Solicitação da equipe",
        body: reqMsg.trim(),
        link: "/inicio",
      });
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Solicitação enviada");
    setReqMsg(""); setOpenRequest(false);
  }

  async function submitWarning() {
    if (!me) return;
    if (warnMsg.trim().length < 5) { toast.error("Descreva o aviso."); return; }
    setBusy(true);
    const { error } = await supabase.from("user_admin_warnings").insert({
      user_id: user.id,
      created_by: me.id,
      message: warnMsg.trim(),
      severity: warnSeverity,
    });
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        actor_id: me.id,
        type: "admin_warning",
        title: warnSeverity === "severe" ? "Aviso importante da equipe" : "Aviso da equipe",
        body: warnMsg.trim(),
        link: "/perfil",
      });
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Aviso enviado");
    setWarnMsg(""); setOpenWarning(false);
  }

  async function submitBan() {
    if (!me) return;
    if (banReason.trim().length < 5) { toast.error("Informe o motivo do banimento."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("admin_ban_user", { _user_id: user.id, _reason: banReason.trim() });
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        actor_id: me.id,
        type: "account_banned",
        title: "Sua conta foi suspensa",
        body: banReason.trim(),
        link: "/inicio",
      });
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Usuário banido");
    setBanReason(""); setOpenBan(false);
  }

  async function submitDelete() {
    if (delConfirm !== user.full_name) { toast.error("Digite o nome exato para confirmar."); return; }
    if (delReason.trim().length < 5) { toast.error("Informe o motivo."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("admin_hard_delete_user", { _user_id: user.id, _reason: delReason.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Usuário excluído permanentemente");
    setOpenDelete(false);
    window.location.reload();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" title="Ações administrativas">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Gerenciar usuário</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenRequest(true)}>
            <MessageSquare className="mr-2 h-4 w-4" /> Requisitar alteração
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenWarning(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Enviar aviso
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/pretendentes/$id" params={{ id: user.id }}>
              <Eye className="mr-2 h-4 w-4" /> Ver perfil completo
            </Link>
          </DropdownMenuItem>
          {user.status !== "banned" && (
            <DropdownMenuItem className="text-destructive" onClick={() => setOpenBan(true)}>
              <Ban className="mr-2 h-4 w-4" /> Banir
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setOpenDelete(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir permanentemente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Solicitar alteração */}
      <Dialog open={openRequest} onOpenChange={setOpenRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Requisitar alteração — {user.full_name}</DialogTitle>
            <DialogDescription>O usuário verá esta solicitação em /inicio e nas notificações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={reqKind} onValueChange={(v) => setReqKind(v as typeof reqKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">Foto</SelectItem>
                  <SelectItem value="bio">Bio</SelectItem>
                  <SelectItem value="behavior">Comportamento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea
                value={reqMsg}
                onChange={(e) => setReqMsg(e.target.value)}
                placeholder="Descreva o que precisa ser alterado..."
                maxLength={2000}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenRequest(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={submitRequest} disabled={busy}>Enviar solicitação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aviso */}
      <Dialog open={openWarning} onOpenChange={setOpenWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar aviso — {user.full_name}</DialogTitle>
            <DialogDescription>O aviso aparece em destaque no perfil do usuário até ser reconhecido.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Severidade</Label>
              <Select value={warnSeverity} onValueChange={(v) => setWarnSeverity(v as typeof warnSeverity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="amber">Atenção (âmbar)</SelectItem>
                  <SelectItem value="severe">Grave (vermelho)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea
                value={warnMsg}
                onChange={(e) => setWarnMsg(e.target.value)}
                placeholder="Explique o aviso..."
                maxLength={2000}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenWarning(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={submitWarning} disabled={busy}>Enviar aviso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banir */}
      <Dialog open={openBan} onOpenChange={setOpenBan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir {user.full_name}</DialogTitle>
            <DialogDescription>O usuário será restrito a /inicio, /notificacoes, /conta e /suporte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Motivo do banimento</Label>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Explique de forma clara o motivo..."
              maxLength={2000}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenBan(false)} disabled={busy}>Cancelar</Button>
            <Button variant="destructive" onClick={submitBan} disabled={busy}>
              <Ban className="mr-1 h-4 w-4" /> Banir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir permanentemente</DialogTitle>
            <DialogDescription>
              Esta ação <strong>não pode ser desfeita</strong>. Todos os dados públicos do usuário
              serão apagados. O email permanece liberado para recadastro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Motivo</Label>
              <Textarea
                value={delReason}
                onChange={(e) => setDelReason(e.target.value)}
                maxLength={2000}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label className="text-xs">
                Para confirmar, digite o nome exato: <strong>{user.full_name}</strong>
              </Label>
              <Input
                value={delConfirm}
                onChange={(e) => setDelConfirm(e.target.value)}
                placeholder={user.full_name}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)} disabled={busy}>Cancelar</Button>
            <Button variant="destructive" onClick={submitDelete} disabled={busy || delConfirm !== user.full_name}>
              <Trash2 className="mr-1 h-4 w-4" /> Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// BannedAppealsPanel — apelações de usuários banidos
// ============================================================================
type AppealRow = {
  id: string;
  user_id: string;
  appeal_text: string;
  status: string;
  response_text: string | null;
  responded_at: string | null;
  created_at: string;
};

function BannedAppealsPanel() {
  const { user: me } = useAuth();
  const [appeals, setAppeals] = useState<AppealRow[]>([]);
  const [profMap, setProfMap] = useState<Map<string, { full_name: string; photo_url: string | null }>>(new Map());
  const [open, setOpen] = useState<AppealRow | null>(null);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("user_ban_appeals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const items = (data ?? []) as AppealRow[];
    setAppeals(items);
    const ids = Array.from(new Set(items.map((a) => a.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url")
        .in("id", ids);
      const m = new Map<string, { full_name: string; photo_url: string | null }>();
      for (const p of profs ?? []) m.set(p.id, { full_name: p.full_name, photo_url: p.photo_url });
      setProfMap(m);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function respond() {
    if (!open || !me) return;
    if (response.trim().length < 5) { toast.error("Escreva uma resposta."); return; }
    setBusy(true);
    const { error } = await supabase
      .from("user_ban_appeals")
      .update({
        status: "answered",
        response_text: response.trim(),
        responded_by: me.id,
        responded_at: new Date().toISOString(),
      })
      .eq("id", open.id);
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: open.user_id,
        actor_id: me.id,
        type: "appeal_response",
        title: "Resposta à sua apelação",
        body: response.trim(),
        link: "/inicio",
      });
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Resposta enviada");
    setOpen(null); setResponse("");
    void load();
  }

  async function ignore(a: AppealRow) {
    if (!confirm("Marcar esta apelação como ignorada?")) return;
    const { error } = await supabase
      .from("user_ban_appeals")
      .update({ status: "ignored", responded_by: me?.id ?? null, responded_at: new Date().toISOString() })
      .eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Apelação ignorada");
    void load();
  }

  if (appeals.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-soft">
        Nenhuma apelação recebida.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Apelações de banimento ({appeals.filter((a) => a.status === "pending").length} pendentes)
      </h2>
      {appeals.map((a) => {
        const prof = profMap.get(a.user_id);
        const isPending = a.status === "pending";
        const isIgnored = a.status === "ignored";
        return (
          <div
            key={a.id}
            className={`glass rounded-2xl p-4 shadow-soft ${isIgnored ? "opacity-60" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                {prof?.photo_url ? (
                  <img src={prof.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-love text-white">
                    {(prof?.full_name ?? "?").charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{prof?.full_name ?? a.user_id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    isPending ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" :
                    a.status === "answered" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" :
                    "bg-muted text-muted-foreground"
                  }`}>{a.status}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap rounded-lg bg-muted/40 p-2 text-sm">
                  {a.appeal_text}
                </p>
                {a.response_text && (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-900 dark:text-emerald-200">
                    <strong>Resposta:</strong> {a.response_text}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={() => { setOpen(a); setResponse(a.response_text ?? ""); }}>
                  <MailOpen className="mr-1 h-4 w-4" /> Ver apelação
                </Button>
                {isPending && (
                  <Button size="sm" variant="ghost" onClick={() => ignore(a)}>
                    Ignorar
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) { setOpen(null); setResponse(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apelação de {open ? (profMap.get(open.user_id)?.full_name ?? open.user_id) : ""}</DialogTitle>
            <DialogDescription>
              {open && new Date(open.created_at).toLocaleString("pt-BR")} · status: <strong>{open?.status}</strong>
            </DialogDescription>
          </DialogHeader>
          {open && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                {open.appeal_text}
              </div>
              <div>
                <Label className="text-xs">Sua resposta</Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="Escreva uma resposta acolhedora e clara..."
                  maxLength={4000}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(null); setResponse(""); }} disabled={busy}>Fechar</Button>
            {open && open.status !== "ignored" && (
              <Button variant="ghost" onClick={() => open && ignore(open)} disabled={busy}>
                Ignorar
              </Button>
            )}
            <Button onClick={respond} disabled={busy}>
              <Gavel className="mr-1 h-4 w-4" /> Enviar resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
