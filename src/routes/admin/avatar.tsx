import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Crown,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LegacyQuarantineNotice,
  legacyRetirementState,
} from "@/v2/platform/legacy-retirement";

export const Route = createFileRoute("/admin/avatar")({
  component: AdminAvatarPage,
});

type Category = { id: string; slug: string; name: string };
type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  rarity: string;
  is_premium: boolean;
  gender: string;
  is_active: boolean;
  sort_order: number;
};

const RARITIES = ["common", "rare", "epic", "legendary"] as const;
const GENDERS = [
  { value: "unisex", label: "Unissex" },
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
];

const emptyForm = {
  id: "",
  name: "",
  description: "",
  category_id: "",
  price: 0,
  rarity: "common",
  is_premium: false,
  gender: "unisex",
  is_active: true,
  sort_order: 0,
  image_url: "",
};

function AdminAvatarPage() {
  if (legacyRetirementState.characterAvatarQuarantined) {
    return <LegacyQuarantineNotice context="admin-avatar" />;
  }

  return <LegacyAdminAvatarPage />;
}

function LegacyAdminAvatarPage() {
  const { user, role, loading: authLoading } = useAuth();
  const isSuperAdmin = role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSuperAdmin) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  async function load() {
    setLoading(true);
    const [c, i] = await Promise.all([
      supabase.from("avatar_categories").select("*").order("sort_order"),
      supabase.from("avatar_items").select("*").order("sort_order"),
    ]);
    setCategories((c.data ?? []) as Category[]);
    setItems((i.data ?? []) as Item[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filterCat === "all") return items;
    return items.filter((i) => i.category_id === filterCat);
  }, [items, filterCat]);

  function openCreate() {
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? "" });
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      category_id: item.category_id,
      price: item.price,
      rarity: item.rarity,
      is_premium: item.is_premium,
      gender: item.gender,
      is_active: item.is_active,
      sort_order: item.sort_order,
      image_url: item.image_url,
    });
    setDialogOpen(true);
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `items/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatar-items").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
    });
    if (error) {
      toast.error("Erro no upload: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatar-items").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Nome obrigatório");
    if (!form.category_id) return toast.error("Categoria obrigatória");
    if (!form.image_url) return toast.error("Imagem obrigatória");
    if (form.price < 0) return toast.error("Preço inválido");

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id,
      price: form.price,
      rarity: form.rarity,
      is_premium: form.is_premium,
      gender: form.gender,
      is_active: form.is_active,
      sort_order: form.sort_order,
      image_url: form.image_url,
    };

    const res = form.id
      ? await supabase.from("avatar_items").update(payload).eq("id", form.id)
      : await supabase.from("avatar_items").insert(payload);

    setSaving(false);
    if (res.error) {
      toast.error("Erro: " + res.error.message);
      return;
    }
    toast.success(form.id ? "Item atualizado" : "Item criado");
    setDialogOpen(false);
    void load();
  }

  async function handleDelete(item: Item) {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    const { error } = await supabase.from("avatar_items").delete().eq("id", item.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Item excluído");
    void load();
  }

  async function toggleActive(item: Item) {
    const { error } = await supabase
      .from("avatar_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    if (error) return toast.error("Erro: " + error.message);
    void load();
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth/login" />;
  if (!isSuperAdmin) return <Navigate to="/inicio" />;

  return (
    <>
      <Header />
      <AdminTopNav eyebrow="Avatar" compact />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Itens do Avatar</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre roupas, acessórios, cabelos e mais para a loja /avatar.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> Novo item
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCat("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              filterCat === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                filterCat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">Nenhum item nesta categoria.</p>
              <Button onClick={openCreate} variant="outline">
                <Plus className="mr-1 h-4 w-4" /> Criar primeiro item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => {
              const cat = categories.find((c) => c.id === item.category_id);
              return (
                <Card key={item.id} className={cn("overflow-hidden", !item.is_active && "opacity-60")}>
                  <div className="relative aspect-square bg-gradient-to-b from-muted/50 to-muted">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-contain p-2"
                      loading="lazy"
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      {item.is_premium && (
                        <span className="rounded-full bg-amber-400 p-1 text-white">
                          <Crown className="h-3 w-3" />
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          item.rarity === "legendary" && "bg-amber-100 text-amber-900",
                          item.rarity === "epic" && "bg-purple-100 text-purple-900",
                          item.rarity === "rare" && "bg-sky-100 text-sky-900",
                          item.rarity === "common" && "bg-gray-100 text-gray-700",
                        )}
                      >
                        {item.rarity}
                      </span>
                    </div>
                  </div>
                  <CardContent className="space-y-2 p-3">
                    <div>
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat?.name} · {item.price.toLocaleString("pt-BR")} moedas
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(item)}
                        title={item.is_active ? "Desativar" : "Ativar"}
                      >
                        {item.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Imagem (PNG transparente recomendado)</Label>
              <div className="mt-1 flex items-center gap-3">
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt=""
                    className="h-20 w-20 rounded-lg border bg-muted object-contain p-1"
                  />
                )}
                <div className="flex-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    onChange={handleUpload}
                    className="hidden"
                    id="avatar-item-upload"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-1 h-4 w-4" />
                    )}
                    {form.image_url ? "Trocar imagem" : "Enviar imagem"}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Vestido Esperança"
                maxLength={100}
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gênero</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preço (moedas)</Label>
                <Input
                  type="text" inputMode="decimal"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Raridade</Label>
                <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RARITIES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="text" inputMode="decimal"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Premium</Label>
                <p className="text-xs text-muted-foreground">Marca como item premium</p>
              </div>
              <Switch checked={form.is_premium} onCheckedChange={(v) => setForm({ ...form, is_premium: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Ativo</Label>
                <p className="text-xs text-muted-foreground">Visível na loja</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
