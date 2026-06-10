import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Gift,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Coins,
  Search,
  Trash2,
  Upload,
  Crown,
  Heart,
  Sparkles,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { supabase } from "@/integrations/supabase/client";

import {
  listAllGiftsAdmin,
  createGift,
  updateGift,
  deleteGift,
  toggleGift,
  CATEGORY_LABELS,
  RARITY_STYLE,
  type VirtualGift,
  type GiftCategory,
  type GiftRarity,
} from "@/lib/gifts";

export const Route = createFileRoute("/admin/presentes")({
  component: AdminPresentesPage,
});

function AdminPresentesPage() {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);

  const [saving, setSaving] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    image_url: "",
    emoji: "",
    price_coins: 500,
    category: "romantic" as GiftCategory,
    rarity: "common" as GiftRarity,
    active: true,
  });

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const text = `${gift.name} ${gift.description ?? ""}`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [gifts, search]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await listAllGiftsAdmin();
      setGifts(data);
    } finally {
      setLoading(false);
    }
  }
  async function moveGift(gift: VirtualGift, direction: "up" | "down") {
    const currentIndex = gifts.findIndex((g) => g.id === gift.id);

    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= gifts.length) {
      return;
    }

    const targetGift = gifts[targetIndex];

    try {
      await updateGift(gift.id, {
        sort_order: targetGift.sort_order,
      });

      await updateGift(targetGift.id, {
        sort_order: gift.sort_order,
      });

      await load();
    } catch (err) {
      console.error(err);
    }
  }

  async function reorderGifts(sourceId: string, targetId: string) {
    const items = [...gifts];

    const sourceIndex = items.findIndex((g) => g.id === sourceId);

    const targetIndex = items.findIndex((g) => g.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const [moved] = items.splice(sourceIndex, 1);

    items.splice(targetIndex, 0, moved);

    const optimisticItems = items.map((gift, index) => ({
      ...gift,
      sort_order: index,
    }));

    setGifts(optimisticItems);

    try {
      const rarityBase = {
        common: 0,
        rare: 1000,
        epic: 2000,
        legendary: 3000,
        exclusive: 4000,
      };

      const rarityCounters = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        exclusive: 0,
      };

      for (const gift of items) {
        const base = rarityBase[gift.rarity];

        const nextOrder = base + rarityCounters[gift.rarity];

        rarityCounters[gift.rarity]++;

        await updateGift(gift.id, {
          sort_order: nextOrder,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminTopNav compact />

      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8 overflow-hidden rounded-3xl border bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 p-8 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Gift className="h-8 w-8" />

                <h1 className="text-4xl font-bold">Gestão de Presentes</h1>
              </div>

              <p className="max-w-2xl text-white/90">
                Crie, edite e gerencie todos os presentes virtuais da plataforma.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setCreateOpen(true)}
              className="bg-white text-black hover:bg-white/90"
            >
              <Plus className="mr-2 h-5 w-5" />
              Novo Presente
            </Button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            <Card className="border-white/20 bg-white/10 backdrop-blur">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Total</p>

                    <h3 className="text-3xl font-bold">{gifts.length}</h3>
                  </div>

                  <Gift className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/20 bg-white/10 backdrop-blur">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Ativos</p>

                    <h3 className="text-3xl font-bold">{gifts.filter((g) => g.active).length}</h3>
                  </div>

                  <Eye className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/20 bg-white/10 backdrop-blur">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Ocultos</p>

                    <h3 className="text-3xl font-bold">{gifts.filter((g) => !g.active).length}</h3>
                  </div>

                  <EyeOff className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Buscar presente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>

            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Presente
            </Button>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Presente</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              <Input
                placeholder="Nome"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;

                  const slug = name
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replaceAll(" ", "-");

                  setForm({
                    ...form,
                    name,
                    slug,
                  });
                }}
              />

              <Input
                placeholder="Slug"
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value,
                  })
                }
              />

              <Textarea
                placeholder="Descrição"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
              <div className="space-y-3">
                <label className="text-sm font-medium">Imagem do presente</label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition hover:bg-muted/50">
                  <Upload className="mb-3 h-10 w-10 text-muted-foreground" />

                  <span className="font-medium">Clique para enviar imagem</span>

                  <span className="text-sm text-muted-foreground">PNG, JPG ou WEBP</span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];

                      if (!file) return;

                      try {
                        setSaving(true);

                        const fileName = `${Date.now()}-${file.name}`;

                        const { error } = await supabase.storage
                          .from("gift-images")
                          .upload(fileName, file);

                        if (error) throw error;

                        const { data: publicUrlData } = supabase.storage
                          .from("gift-images")
                          .getPublicUrl(fileName);

                        setForm({
                          ...form,
                          image_url: publicUrlData.publicUrl,
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </label>

                {form.image_url && (
                  <div className="overflow-hidden rounded-2xl border">
                    <img src={form.image_url} alt="preview" className="h-56 w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      category: v as GiftCategory,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="romantic">Romântico</SelectItem>
                    <SelectItem value="spiritual">Espiritual</SelectItem>
                    <SelectItem value="caring">Carinhoso</SelectItem>
                    <SelectItem value="friendship">Amizade</SelectItem>
                    <SelectItem value="fun">Divertido</SelectItem>
                    <SelectItem value="legendary">Lendário</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={form.rarity}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      rarity: v as GiftRarity,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="common">Comum</SelectItem>
                    <SelectItem value="rare">Raro</SelectItem>
                    <SelectItem value="epic">Épico</SelectItem>
                    <SelectItem value="legendary">Lendário</SelectItem>
                    <SelectItem value="exclusive">Exclusivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span>Ativo</span>

                <Switch
                  checked={form.active}
                  onCheckedChange={(v) =>
                    setForm({
                      ...form,
                      active: v,
                    })
                  }
                />
              </div>

              <Input
                type="number"
                placeholder="Preço"
                value={form.price_coins}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price_coins: Number(e.target.value),
                  })
                }
              />

              <Button
                disabled={saving}
                onClick={async () => {
                  try {
                    setSaving(true);

                    await createGift({
                      slug: form.slug,
                      name: form.name,
                      description: form.description,
                      image_url: form.image_url,
                      emoji: null,
                      price_coins: form.price_coins,
                      category: form.category,
                      rarity: form.rarity,
                      active: form.active,
                    });

                    await load();

                    setCreateOpen(false);
                    toast.success("Presente criado com sucesso.");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Não foi possível criar o presente.",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Criar Presente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Presente</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              <Input
                placeholder="Nome"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />

              <Input
                placeholder="Slug"
                value={form.slug}
                onChange={(e) =>
                  setForm({
                    ...form,
                    slug: e.target.value,
                  })
                }
              />

              <Textarea
                placeholder="Descrição"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              <div className="space-y-3">
                <label className="text-sm font-medium">Imagem do presente</label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition hover:bg-muted/50">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />

                  <span>Alterar imagem</span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];

                      if (!file) return;

                      try {
                        setSaving(true);

                        const fileName = `${Date.now()}-${file.name}`;

                        const { error } = await supabase.storage
                          .from("gift-images")
                          .upload(fileName, file);

                        if (error) throw error;

                        const { data } = supabase.storage
                          .from("gift-images")
                          .getPublicUrl(fileName);

                        setForm({
                          ...form,
                          image_url: data.publicUrl,
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </label>

                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="h-56 w-full rounded-xl object-cover"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      category: v as GiftCategory,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="romantic">Romântico</SelectItem>
                    <SelectItem value="spiritual">Espiritual</SelectItem>
                    <SelectItem value="caring">Carinhoso</SelectItem>
                    <SelectItem value="friendship">Amizade</SelectItem>
                    <SelectItem value="fun">Divertido</SelectItem>
                    <SelectItem value="legendary">Lendário</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={form.rarity}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      rarity: v as GiftRarity,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="common">Comum</SelectItem>
                    <SelectItem value="rare">Raro</SelectItem>
                    <SelectItem value="epic">Épico</SelectItem>
                    <SelectItem value="legendary">Lendário</SelectItem>
                    <SelectItem value="exclusive">Exclusivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span>Ativo</span>

                <Switch
                  checked={form.active}
                  onCheckedChange={(v) =>
                    setForm({
                      ...form,
                      active: v,
                    })
                  }
                />
              </div>

              <Input
                type="number"
                value={form.price_coins}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price_coins: Number(e.target.value),
                  })
                }
              />

              <Button
                disabled={saving || !selectedGift}
                onClick={async () => {
                  if (!selectedGift) return;

                  try {
                    setSaving(true);

                    await updateGift(selectedGift.id, {
                      slug: form.slug,
                      name: form.name,
                      description: form.description,
                      image_url: form.image_url,
                      price_coins: form.price_coins,
                      category: form.category,
                      rarity: form.rarity,
                      active: form.active,
                    });

                    await load();

                    setEditOpen(false);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir presente?</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</div>

            <div className="mt-4 flex justify-end gap-2">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>

              <Button
                variant="destructive"
                onClick={async () => {
                  if (!selectedGift) return;

                  try {
                    await deleteGift(selectedGift.id);
                    setDeleteOpen(false);
                    setSelectedGift(null);
                    await load();
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {loading ? (
          <div>Carregando...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filteredGifts.map((gift, index) => (
              <Card
                key={gift.id}
                draggable
                onDragStart={(e) => {
                  setDraggingId(gift.id);

                  e.dataTransfer.effectAllowed = "move";

                  e.dataTransfer.setData("text/gift-id", gift.id);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={async (e) => {
                  e.preventDefault();

                  const sourceId = e.dataTransfer.getData("text/gift-id") || draggingId;

                  if (!sourceId || sourceId === gift.id) {
                    return;
                  }

                  try {
                    await reorderGifts(sourceId, gift.id);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`group overflow-hidden border bg-card transition-all duration-300
hover:-translate-y-1
hover:shadow-xl
cursor-grab
active:cursor-grabbing
${draggingId === gift.id ? "opacity-40" : ""}
`}
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100">
                  {gift.image_url ? (
                    <img
                      src={gift.image_url}
                      alt={gift.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Gift className="h-20 w-20 text-rose-300" />
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    {gift.active ? (
                      <Badge className="bg-green-600 text-white">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Oculto</Badge>
                    )}
                  </div>

                  <div className="absolute right-3 top-3">
                    <Badge className={RARITY_STYLE[gift.rarity].chip}>
                      {RARITY_STYLE[gift.rarity].label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="line-clamp-1 text-lg font-bold">{gift.name}</h3>

                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {gift.description || "Sem descrição"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">{CATEGORY_LABELS[gift.category].label}</Badge>

                    <Badge variant="outline">#{gift.slug}</Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold">
                      <Coins className="h-4 w-4 text-amber-500" />
                      {gift.price_coins.toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-5 gap-2">
                    <Button size="sm" variant="outline" onClick={() => moveGift(gift, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => moveGift(gift, "down")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedGift(gift);

                        setForm({
                          slug: gift.slug,
                          name: gift.name,
                          description: gift.description ?? "",
                          image_url: gift.image_url ?? "",
                          emoji: gift.emoji ?? "",
                          price_coins: gift.price_coins,
                          category: gift.category,
                          rarity: gift.rarity,
                          active: gift.active,
                        });

                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await toggleGift(gift.id, !gift.active);

                        load();
                      }}
                    >
                      {gift.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedGift(gift);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
