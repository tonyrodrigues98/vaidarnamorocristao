import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, BookOpen, Loader2, Plus, Search, Sparkles, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/support";

type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  featured: boolean;
  published: boolean;
  sort_order: number;
  views_count: number;
  created_at: string;
  updated_at: string;
};

export const Route = createFileRoute("/suporte/ajuda")({
  component: AjudaPage,
});

function AjudaPage() {
  const { user, isAdmin, role, loading } = useAuth();
  const isStaff = isAdmin || role === "super_admin";
  const [items, setItems] = useState<Article[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setBusy(true);
    const { data, error } = await supabase
      .from("support_articles")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Article[]);
    setBusy(false);
  }

  useEffect(() => { if (user) load(); }, [user]);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (!isStaff && !a.published) return false;
      if (cat !== "all" && a.category !== cat) return false;
      if (q) {
        const s = (a.title + " " + (a.summary ?? "") + " " + a.content).toLowerCase();
        if (!s.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, cat, q, isStaff]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/suporte" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao suporte
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold">
              <BookOpen className="h-7 w-7 text-[var(--rose)]" /> Central de Ajuda
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Antes de abrir um chamado, veja se sua dúvida já foi respondida.
            </p>
          </div>
          {isStaff && (
            <Button onClick={() => setCreating(true)} className="rounded-full shadow-glow">
              <Plus className="mr-1 h-4 w-4" /> Novo artigo
            </Button>
          )}
        </div>

        <div className="glass mt-6 flex flex-wrap items-center gap-3 rounded-2xl p-3 shadow-soft">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar artigos e FAQ" className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {busy && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}

        {!busy && filtered.some((a) => a.featured) && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
              <Sparkles className="h-3 w-3" /> Em destaque
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.filter((a) => a.featured).map((a) => (
                <ArticleCard key={a.id} article={a} isStaff={isStaff} onEdit={() => setEditing(a)} onDeleted={load} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {filtered.filter((a) => !a.featured).map((a) => (
            <ArticleCard key={a.id} article={a} isStaff={isStaff} compact onEdit={() => setEditing(a)} onDeleted={load} />
          ))}
          {!busy && filtered.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
              Nenhum artigo encontrado. <Link to="/suporte" className="text-[var(--rose)] underline">Abrir um chamado</Link>.
            </div>
          )}
        </div>
      </main>

      {(creating || editing) && (
        <ArticleEditor
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function ArticleCard({ article, isStaff, compact, onEdit, onDeleted }: {
  article: Article; isStaff: boolean; compact?: boolean;
  onEdit: () => void; onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  async function trackView() {
    if (!open) {
      await supabase.rpc("increment_article_views", { _slug: article.slug });
    }
    setOpen((v) => !v);
  }
  async function remove() {
    if (!confirm("Excluir este artigo?")) return;
    const { error } = await supabase.from("support_articles").delete().eq("id", article.id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); onDeleted(); }
  }
  const catLabel = CATEGORIES.find((c) => c.value === article.category)?.label ?? article.category;
  return (
    <div className={`glass rounded-2xl shadow-soft ${compact ? "p-4" : "p-5"}`}>
      <button onClick={trackView} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {catLabel}
            </span>
            {!article.published && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                Rascunho
              </span>
            )}
          </div>
          <h3 className="mt-1 font-semibold">{article.title}</h3>
          {article.summary && <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" /> {article.views_count}
        </span>
      </button>
      {open && (
        <div className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm leading-relaxed">
          {article.content}
        </div>
      )}
      {isStaff && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="mr-1 h-3 w-3" /> Editar</Button>
          <Button size="sm" variant="outline" onClick={remove} className="text-destructive">
            <Trash2 className="mr-1 h-3 w-3" /> Excluir
          </Button>
        </div>
      )}
    </div>
  );
}

function ArticleEditor({ initial, onClose, onSaved }: {
  initial: Article | null; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "other");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (title.trim().length < 3) return toast.error("Título muito curto");
    if (content.trim().length < 10) return toast.error("Conteúdo muito curto");
    const finalSlug = (slug || title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    setBusy(true);
    const payload = { title: title.trim(), slug: finalSlug, summary: summary || null, content,
      category: category as any, featured, published };
    const { error } = initial
      ? await supabase.from("support_articles").update(payload).eq("id", initial.id)
      : await supabase.from("support_articles").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Editar artigo" : "Novo artigo"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Slug (opcional)</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto a partir do título" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2"><Switch checked={featured} onCheckedChange={setFeatured} /><Label>Destaque</Label></div>
              <div className="flex items-center gap-2"><Switch checked={published} onCheckedChange={setPublished} /><Label>Publicado</Label></div>
            </div>
          </div>
          <div><Label>Resumo</Label><Input value={summary ?? ""} onChange={(e) => setSummary(e.target.value)} maxLength={200} /></div>
          <div><Label>Conteúdo</Label><Textarea rows={10} value={content} onChange={(e) => setContent(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}