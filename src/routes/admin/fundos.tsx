import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Coins,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  BACKGROUND_RARITY_STYLE,
  createProfileBackground,
  deleteProfileBackground,
  fetchAllProfileBackgroundsAdmin,
  updateProfileBackground,
  type ProfileBackground,
  type ProfileBackgroundRarity,
} from "@/lib/profileBackgrounds";

export const Route = createFileRoute("/admin/fundos")({
  component: AdminFundosPage,
});

const EMPTY_FORM = {
  name: "",
  description: "",
  image_url: "",
  price: 100,
  rarity: "common" as ProfileBackgroundRarity,
  is_active: true,
  sort_order: 0,
};

const BACKGROUND_IMAGE_BUCKETS = ["profile-backgrounds", "gift-images"] as const;

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
    message.includes("profile_backgrounds") ||
    message.includes("equipped_background_id")
  ) {
    return "Banco ainda sem a migration de Fundos de Perfil. Aplique a migration 20260603120000_profile_backgrounds.sql no Supabase.";
  }

  return message;
}

function AdminFundosPage() {
  const { user, loading: authLoading, isAdmin, role } = useAuth();
  const canAccess = isAdmin || role === "super_admin";
  const [items, setItems] = useState<ProfileBackground[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ProfileBackground | null>(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => `${item.name} ${item.description ?? ""}`.toLowerCase().includes(term));
  }, [items, search]);

  useEffect(() => {
    if (!canAccess) return;
    void load();
  }, [canAccess]);

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchAllProfileBackgroundsAdmin());
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel carregar os fundos"));
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File) {
    setSaving(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      let uploadedUrl: string | null = null;
      let lastError: unknown = null;

      for (const bucket of BACKGROUND_IMAGE_BUCKETS) {
        const fileName = `profile-backgrounds/${Date.now()}-${safeName}`;
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

  async function saveCreate() {
    setSaving(true);
    try {
      await createProfileBackground({
        name: form.name.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        price: Number(form.price),
        rarity: form.rarity,
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      });
      toast.success("Fundo criado");
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
    setSaving(true);
    try {
      await updateProfileBackground(selected.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        price: Number(form.price),
        rarity: form.rarity,
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      });
      toast.success("Fundo atualizado");
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(adminErrorMessage(e, "Nao foi possivel salvar"));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(item: ProfileBackground) {
    setSelected(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      image_url: item.image_url ?? "",
      price: item.price,
      rarity: item.rarity,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setEditOpen(true);
  }

  if (!authLoading && !user) return <Navigate to="/auth/login" />;
  if (!authLoading && !canAccess) return <Navigate to="/admin" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Admin
          </Link>
        </Button>

        <section className="overflow-hidden rounded-3xl border bg-gradient-to-r from-zinc-950 via-rose-950 to-purple-950 p-6 text-white shadow-elegant sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <ImageIcon className="h-8 w-8" />
                <h1 className="text-3xl font-bold sm:text-4xl">Fundos de Perfil</h1>
              </div>
              <p className="max-w-2xl text-sm text-white/80">
                Crie, edite e gerencie fundos premium exibidos no cabecalho dos perfis.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                setForm(EMPTY_FORM);
                setCreateOpen(true);
              }}
              className="bg-white text-black hover:bg-white/90"
            >
              <Plus className="mr-2 h-5 w-5" />
              Novo Fundo
            </Button>
          </div>
        </section>

        <div className="my-6 rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fundo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            Carregando fundos...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const rarity = BACKGROUND_RARITY_STYLE[item.rarity];
              return (
                <Card key={item.id} className={`overflow-hidden border bg-card ${rarity.border}`}>
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-2">
                      <Badge className={item.is_active ? "bg-green-600 text-white" : ""} variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Ativo" : "Oculto"}
                      </Badge>
                      <Badge className={rarity.chip}>{rarity.label}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="line-clamp-1 text-lg font-bold">{item.name}</h3>
                    <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                      {item.description || "Sem descricao"}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Coins className="h-4 w-4 text-amber-500" />
                        {item.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">Ordem {item.sort_order}</span>
                    </div>
                    <div className="mt-5 grid grid-cols-4 gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await updateProfileBackground(item.id, { is_active: !item.is_active });
                          await load();
                        }}
                      >
                        {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="col-span-2"
                        onClick={async () => {
                          if (!confirm("Excluir este fundo?")) return;
                          await deleteProfileBackground(item.id);
                          toast.success("Fundo excluido");
                          await load();
                        }}
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

        <BackgroundDialog
          open={createOpen}
          title="Novo Fundo"
          form={form}
          saving={saving}
          onOpenChange={setCreateOpen}
          onFormChange={setForm}
          onUpload={uploadImage}
          onSave={saveCreate}
          saveLabel="Criar Fundo"
        />
        <BackgroundDialog
          open={editOpen}
          title="Editar Fundo"
          form={form}
          saving={saving}
          onOpenChange={setEditOpen}
          onFormChange={setForm}
          onUpload={uploadImage}
          onSave={saveEdit}
          saveLabel="Salvar Alteracoes"
        />
      </main>
    </div>
  );
}

function BackgroundDialog({
  open,
  title,
  form,
  saving,
  onOpenChange,
  onFormChange,
  onUpload,
  onSave,
  saveLabel,
}: {
  open: boolean;
  title: string;
  form: typeof EMPTY_FORM;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: typeof EMPTY_FORM) => void;
  onUpload: (file: File) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <Label>Imagem do fundo</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition hover:bg-muted/50">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="font-medium">Clique para enviar imagem</span>
              <span className="text-sm text-muted-foreground">PNG, JPG ou WEBP</span>
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
            {form.image_url && (
              <div className="overflow-hidden rounded-2xl border">
                <img src={form.image_url} alt="preview" className="h-56 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Preco</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => onFormChange({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Raridade</Label>
              <Select
                value={form.rarity}
                onValueChange={(value) => onFormChange({ ...form, rarity: value as ProfileBackgroundRarity })}
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
            <Switch checked={form.is_active} onCheckedChange={(value) => onFormChange({ ...form, is_active: value })} />
          </label>

          <Button disabled={saving || !form.name.trim()} onClick={onSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
