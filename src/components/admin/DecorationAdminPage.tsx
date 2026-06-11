import { Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Coins,
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  DECORATION_RARITY_STYLE,
  assetFor,
  createDecoration,
  deleteDecoration,
  fetchAdminDecorations,
  getDecorationUsage,
  reorderDecorations,
  updateDecoration,
  type Decoration,
  type DecorationRarity,
  type DecorationType,
} from "@/lib/decorations";

type ManagedType = Extract<DecorationType, "frame" | "aura">;

type DecorationForm = {
  slug: string;
  name: string;
  description: string;
  image_url: string;
  css_value: string;
  price_coins: number;
  rarity: DecorationRarity;
  active: boolean;
  sort_order: number;
};

const DECORATION_IMAGE_BUCKETS = ["gift-images"] as const;

const EMPTY_FORM: DecorationForm = {
  slug: "",
  name: "",
  description: "",
  image_url: "",
  css_value: "",
  price_coins: 100,
  rarity: "common",
  active: true,
  sort_order: 0,
};

const CONFIG: Record<
  ManagedType,
  {
    title: string;
    singular: string;
    newLabel: string;
    description: string;
    gradient: string;
    icon: typeof ImageIcon;
    help: string;
  }
> = {
  frame: {
    title: "Molduras de Perfil",
    singular: "Moldura",
    newLabel: "Nova Moldura",
    description: "Gerencie molduras premium exibidas ao redor da foto do perfil.",
    gradient: "from-amber-950 via-rose-950 to-purple-950",
    icon: ImageIcon,
    help: "Use PNG ou WebP transparente, 1:1, minimo recomendado 1024x1024. O centro deve ficar transparente para nao cobrir o rosto.",
  },
  aura: {
    title: "Auras de Perfil",
    singular: "Aura",
    newLabel: "Nova Aura",
    description: "Gerencie auras premium exibidas atras ou ao redor da foto do perfil.",
    gradient: "from-violet-950 via-fuchsia-950 to-rose-950",
    icon: Sparkles,
    help: "Use PNG ou WebP transparente, 1:1, minimo recomendado 1024x1024. A aura deve ficar suave no centro para nao cobrir o rosto.",
  },
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function withSequentialSortOrder(items: Decoration[]) {
  return items.map((item, index) => ({ ...item, sort_order: index + 1 }));
}

function moveItem(items: Decoration[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function adminErrorMessage(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : fallback;
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (
    code === "42P01" ||
    code === "42703" ||
    message.includes("avatar_decorations") ||
    message.includes("description") ||
    message.includes("rarity")
  ) {
    return "Banco ainda sem a migration de administracao de molduras e auras. Aplique a migration 20260604103000_admin_avatar_decorations.sql no Supabase.";
  }

  return message;
}

export function DecorationAdminPage({ type }: { type: ManagedType }) {
  const cfg = CONFIG[type];
  const Icon = cfg.icon;
  const { user, loading: authLoading, isAdmin, role } = useAuth();
  const canAccess = isAdmin || role === "super_admin";
  const [items, setItems] = useState<Decoration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<DecorationForm>(EMPTY_FORM);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Decoration | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Decoration | null>(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) =>
      `${item.name} ${item.description ?? ""} ${item.slug}`.toLowerCase().includes(term),
    );
  }, [items, search]);

  useEffect(() => {
    if (!canAccess) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, type]);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchAdminDecorations(type));
    } catch (e) {
      toast.error(adminErrorMessage(e, `Nao foi possivel carregar ${cfg.title.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  }

  async function persistOrder(nextItems: Decoration[]) {
    const previous = items;
    const ordered = withSequentialSortOrder(nextItems);
    setItems(ordered);
    setOrdering(true);
    try {
      await reorderDecorations(
        ordered.map((item) => ({
          id: item.id,
          sort_order: item.sort_order,
        })),
      );
      toast.success("Ordem salva");
    } catch (e) {
      setItems(previous);
      toast.error(adminErrorMessage(e, "Nao foi possivel salvar a ordem"));
    } finally {
      setOrdering(false);
    }
  }

  function handleDropOn(targetId: string) {
    if (!draggingId || draggingId === targetId || search.trim()) return;
    const fromIndex = items.findIndex((item) => item.id === draggingId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    setDraggingId(null);
    setDragOverId(null);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    void persistOrder(moveItem(items, fromIndex, toIndex));
  }

  function moveByButton(itemId: string, direction: -1 | 1) {
    if (search.trim()) return;
    const fromIndex = items.findIndex((item) => item.id === itemId);
    const toIndex = fromIndex + direction;
    if (fromIndex < 0 || toIndex < 0 || toIndex >= items.length) return;
    void persistOrder(moveItem(items, fromIndex, toIndex));
  }

  async function uploadImage(file: File) {
    setSaving(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      let uploadedUrl: string | null = null;
      let lastError: unknown = null;

      for (const bucket of DECORATION_IMAGE_BUCKETS) {
        const fileName = `avatar-decorations/${type}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

        if (error) {
          lastError = error;
          continue;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        uploadedUrl = data.publicUrl;
        break;
      }

      if (!uploadedUrl) throw lastError;

      setForm((current) => ({ ...current, image_url: uploadedUrl }));
      toast.success("Imagem enviada");
    } catch (e) {
      const message = adminErrorMessage(e, "Verifique o bucket e as permissoes do Storage");
      toast.error(`Falha ao enviar imagem: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  function formPayload(): DecorationForm {
    return {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
      name: form.name.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      css_value: form.css_value.trim(),
      price_coins: Number(form.price_coins),
      sort_order: Number(form.sort_order),
    };
  }

  function validateForm(next: DecorationForm) {
    if (!next.name) return "Informe o nome.";
    if (!next.slug) return "Informe o slug.";
    if (next.price_coins < 0) return "O preco nao pode ser negativo.";
    if (type === "frame" && !next.image_url) return "Informe ou envie a imagem da moldura.";
    if (type === "aura" && !next.image_url && !next.css_value) {
      return "Informe uma imagem da aura ou uma cor CSS para o brilho.";
    }
    return null;
  }

  async function saveCreate() {
    const next = formPayload();
    const validation = validateForm(next);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      await createDecoration({
        type,
        slug: next.slug,
        name: next.name,
        description: next.description || null,
        image_url: next.image_url || null,
        css_value: next.css_value || null,
        price_coins: next.price_coins,
        rarity: next.rarity,
        active: next.active,
        sort_order: next.sort_order || items.length + 1,
      });
      toast.success(`${cfg.singular} criada`);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel criar"));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!selected) return;
    const next = formPayload();
    const validation = validateForm(next);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      await updateDecoration(selected.id, {
        type,
        slug: next.slug,
        name: next.name,
        description: next.description || null,
        image_url: next.image_url || null,
        css_value: next.css_value || null,
        price_coins: next.price_coins,
        rarity: next.rarity,
        active: next.active,
        sort_order: next.sort_order,
      });
      toast.success(`${cfg.singular} atualizada`);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel salvar"));
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      rarity: type === "aura" ? "rare" : "common",
      price_coins: type === "aura" ? 120 : 100,
      sort_order: items.length + 1,
    });
    setCreateOpen(true);
  }

  function openEdit(item: Decoration) {
    setSelected(item);
    setForm({
      slug: item.slug,
      name: item.name,
      description: item.description ?? "",
      image_url: item.image_url ?? "",
      css_value: item.css_value ?? "",
      price_coins: item.price_coins,
      rarity: item.rarity ?? "common",
      active: item.active ?? true,
      sort_order: item.sort_order,
    });
    setEditOpen(true);
  }

  async function toggleActive(item: Decoration) {
    try {
      await updateDecoration(item.id, { active: !item.active });
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, active: !item.active } : candidate,
        ),
      );
      toast.success(!item.active ? `${cfg.singular} ativada` : `${cfg.singular} ocultada`);
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel alterar status"));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const usage = await getDecorationUsage(deleteTarget.id);
      if (usage.ownedCount > 0 || usage.equippedCount > 0) {
        await updateDecoration(deleteTarget.id, { active: false });
        toast.success(`${cfg.singular} esta em uso e foi apenas ocultada`);
      } else {
        await deleteDecoration(deleteTarget.id);
        toast.success(`${cfg.singular} excluida`);
      }
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel excluir"));
    } finally {
      setSaving(false);
    }
  }

  if (!authLoading && !user) return <Navigate to="/auth/login" />;
  if (!authLoading && !canAccess) return <Navigate to="/admin" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminTopNav compact />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Admin
          </Link>
        </Button>

        <section
          className={`overflow-hidden rounded-3xl border bg-gradient-to-r ${cfg.gradient} p-6 text-white shadow-elegant sm:p-8`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Icon className="h-8 w-8" />
                <h1 className="text-3xl font-bold sm:text-4xl">{cfg.title}</h1>
              </div>
              <p className="max-w-2xl text-sm text-white/80">{cfg.description}</p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={openCreate}
              className="bg-white text-black hover:bg-white/90"
            >
              <Plus className="mr-2 h-5 w-5" />
              {cfg.newLabel}
            </Button>
          </div>
        </section>

        <div className="my-6 rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${cfg.singular.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Arraste os cards pela alca para reorganizar. A nova ordem e salva automaticamente.
            {search.trim() ? " Limpe a busca para alterar a ordem." : null}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            Carregando {cfg.title.toLowerCase()}...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-sm text-muted-foreground">
            Nenhum item encontrado.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const rarity = DECORATION_RARITY_STYLE[item.rarity ?? "common"];
              const orderIndex = items.findIndex((decoration) => decoration.id === item.id);
              const dragDisabled = Boolean(search.trim()) || ordering;
              return (
                <Card
                  key={item.id}
                  draggable={!dragDisabled}
                  onDragStart={(event) => {
                    if (dragDisabled) return;
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.id);
                    setDraggingId(item.id);
                  }}
                  onDragOver={(event) => {
                    if (dragDisabled || !draggingId || draggingId === item.id) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDropOn(item.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  className={`overflow-hidden border bg-card transition ${rarity.border} ${
                    draggingId === item.id ? "opacity-60" : ""
                  } ${dragOverId === item.id ? "ring-2 ring-[var(--rose)]" : ""}`}
                >
                  <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-muted via-card to-muted">
                    <DecorationPreview item={item} type={type} />
                    <button
                      type="button"
                      className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white shadow-sm backdrop-blur transition ${
                        dragDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-grab active:cursor-grabbing"
                      }`}
                      aria-label={`Arrastar ${cfg.singular.toLowerCase()} para ordenar`}
                      disabled={dragDisabled}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute left-3 top-3 flex gap-2">
                      <Badge
                        className={item.active ? "bg-green-600 text-white" : ""}
                        variant={item.active ? "default" : "secondary"}
                      >
                        {item.active ? "Ativo" : "Oculto"}
                      </Badge>
                      <Badge className={rarity.chip}>{rarity.label}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-lg font-bold">{item.name}</h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          #{item.slug}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Ordem {item.sort_order}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                      {item.description || "Sem descricao"}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Coins className="h-4 w-4 text-amber-500" />
                        {item.price_coins.toLocaleString()}
                      </span>
                      {type === "aura" && item.css_value ? (
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="h-3 w-3 rounded-full border"
                            style={{ backgroundColor: item.css_value }}
                          />
                          {item.css_value}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-5 grid grid-cols-6 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={dragDisabled || orderIndex <= 0}
                        onClick={() => moveByButton(item.id, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={dragDisabled || orderIndex < 0 || orderIndex >= items.length - 1}
                        onClick={() => moveByButton(item.id, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(item)}>
                        {item.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="col-span-2"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DecorationDialog
          open={createOpen}
          title={cfg.newLabel}
          type={type}
          form={form}
          saving={saving}
          help={cfg.help}
          onOpenChange={setCreateOpen}
          onFormChange={setForm}
          onUpload={uploadImage}
          onSave={saveCreate}
          saveLabel={cfg.newLabel}
        />
        <DecorationDialog
          open={editOpen}
          title={`Editar ${cfg.singular}`}
          type={type}
          form={form}
          saving={saving}
          help={cfg.help}
          onOpenChange={setEditOpen}
          onFormChange={setForm}
          onUpload={uploadImage}
          onSave={saveEdit}
          saveLabel="Salvar Alteracoes"
        />

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {cfg.singular.toLowerCase()}?</AlertDialogTitle>
              <AlertDialogDescription>
                Se este item ja foi comprado ou esta equipado por algum usuario, ele sera apenas
                ocultado para nao quebrar perfis existentes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
              <Button variant="destructive" disabled={saving} onClick={confirmDelete}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

function DecorationDialog({
  open,
  title,
  type,
  form,
  saving,
  help,
  onOpenChange,
  onFormChange,
  onUpload,
  onSave,
  saveLabel,
}: {
  open: boolean;
  title: string;
  type: ManagedType;
  form: DecorationForm;
  saving: boolean;
  help: string;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: DecorationForm) => void;
  onUpload: (file: File) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  const hasVisual =
    type === "frame" ? Boolean(form.image_url) : Boolean(form.image_url || form.css_value);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{help}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    onFormChange({
                      ...form,
                      name,
                      slug: form.slug || slugify(name),
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => onFormChange({ ...form, slug: slugify(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={form.description}
                onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>{type === "frame" ? "Imagem da moldura" : "Imagem da aura"}</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition hover:bg-muted/50">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Clique para enviar imagem</span>
                <span className="text-sm text-muted-foreground">PNG, WEBP ou JPG</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                  }}
                />
              </label>
              <Input
                placeholder="Ou cole uma URL publica / caminho de asset"
                value={form.image_url}
                onChange={(e) => onFormChange({ ...form, image_url: e.target.value })}
              />
            </div>

            {type === "aura" && (
              <div className="space-y-2">
                <Label>Cor CSS do brilho opcional</Label>
                <Input
                  placeholder="#a855f7"
                  value={form.css_value}
                  onChange={(e) => onFormChange({ ...form, css_value: e.target.value })}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Preco</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price_coins}
                  onChange={(e) => onFormChange({ ...form, price_coins: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Raridade</Label>
                <Select
                  value={form.rarity}
                  onValueChange={(value) =>
                    onFormChange({ ...form, rarity: value as DecorationRarity })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Comum</SelectItem>
                    <SelectItem value="rare">Raro</SelectItem>
                    <SelectItem value="epic">Epico</SelectItem>
                    <SelectItem value="legendary">Lendario</SelectItem>
                    <SelectItem value="exclusive">Exclusivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => onFormChange({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <label className="flex items-center justify-between rounded-xl border bg-card/50 p-4">
              <span className="text-sm font-medium">Ativo</span>
              <Switch
                checked={form.active}
                onCheckedChange={(value) => onFormChange({ ...form, active: value })}
              />
            </label>

            <Button disabled={saving || !form.name.trim() || !hasVisual} onClick={onSave}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
            </Button>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preview no avatar
            </p>
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-background/70">
              <DecorationPreview
                type={type}
                item={{
                  id: "preview",
                  type,
                  slug: form.slug,
                  name: form.name,
                  description: form.description || null,
                  image_url: form.image_url || null,
                  css_value: form.css_value || null,
                  price_coins: form.price_coins,
                  rarity: form.rarity,
                  sort_order: form.sort_order,
                  active: form.active,
                  created_at: "",
                  updated_at: null,
                }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              O preview usa uma foto circular de exemplo para mostrar se o centro da imagem fica
              livre e se a moldura/aura encaixa sem cobrir o rosto.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DecorationPreview({ item, type }: { item: Decoration; type: ManagedType }) {
  const image = assetFor(item);
  const photo = (
    <div className="absolute left-1/2 top-1/2 z-10 h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-gradient-love shadow-lg">
      <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
        C
      </div>
    </div>
  );

  return (
    <div className="relative h-36 w-36">
      {type === "aura" && item.css_value && (() => {
        const raw = item.css_value.trim();
        const isBoxShadow =
          /^box-shadow\s*:/i.test(raw) || (/\d+px/.test(raw) && /(rgba?|#)/i.test(raw));
        if (isBoxShadow) {
          const shadow = raw.replace(/^box-shadow\s*:\s*/i, "").replace(/;+\s*$/, "");
          return (
            <div
              aria-hidden
              className="absolute inset-6 rounded-full"
              style={{ boxShadow: shadow }}
            />
          );
        }
        return (
          <div
            aria-hidden
            className="absolute inset-2 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, ${raw}66 0%, ${raw}33 45%, transparent 72%)`,
            }}
          />
        );
      })()}
      {type === "aura" && image && (
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      {photo}
      {type === "frame" && image && (
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 z-20 h-full w-full object-contain"
        />
      )}
      {!image && type === "frame" && (
        <div className="absolute inset-0 z-20 rounded-full border-4 border-dashed border-muted-foreground/30" />
      )}
    </div>
  );
}
