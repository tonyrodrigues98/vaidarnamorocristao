import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, Save, X } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPet,
  deletePet,
  listAllPetsAdmin,
  slugify,
  updatePet,
  uploadPetImage,
  type PetWritable,
} from "@/lib/pets";
import {
  PET_RARITY_COLOR,
  PET_RARITY_LABEL,
  type Pet,
  type PetRarity,
} from "@/types/pet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pets")({ component: PetsAdmin });

const RARITIES: PetRarity[] = ["common", "rare", "epic", "legendary"];

function PetsAdmin() {
  const { user, role, loading, rolesLoaded } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";

  const [pets, setPets] = useState<Pet[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PetWritable | null>(null);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      setPets(await listAllPetsAdmin());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    void reload();
  }, [isAdmin]);

  if (loading || (user && !rolesLoaded)) return null;
  if (!user) return <Navigate to="/auth/login" />;
  if (!isAdmin) return <Navigate to="/admin" />;

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setDraft({
      name: "",
      slug: "",
      species: "",
      description: "",
      rarity: "common",
      is_active: true,
      sort_order: pets.length * 10,
      image_url: null,
    });
  }

  function startEdit(p: Pet) {
    setCreating(false);
    setEditingId(p.id);
    setDraft({
      name: p.name,
      slug: p.slug,
      species: p.species,
      description: p.description ?? "",
      rarity: p.rarity,
      is_active: p.is_active,
      sort_order: p.sort_order,
      image_url: null, // só atualiza se reupload
    });
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setDraft(null);
  }

  async function save() {
    if (!draft) return;
    const name = draft.name.trim();
    const slug = (draft.slug || slugify(name)).trim();
    const species = draft.species.trim();
    if (!name || !slug || !species) {
      toast.error("Nome, slug e espécie são obrigatórios.");
      return;
    }
    setBusy(true);
    try {
      if (creating) {
        await createPet({
          ...draft,
          name,
          slug,
          species,
          description: draft.description?.trim() || null,
        });
        toast.success("Pet criado");
      } else if (editingId) {
        const patch: Partial<PetWritable> = {
          name,
          slug,
          species,
          description: draft.description?.trim() || null,
          rarity: draft.rarity,
          is_active: draft.is_active,
          sort_order: draft.sort_order,
        };
        if (draft.image_url) patch.image_url = draft.image_url;
        await updatePet(editingId, patch);
        toast.success("Pet atualizado");
      }
      cancel();
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | null) {
    if (!file || !draft) return;
    setBusy(true);
    try {
      const path = await uploadPetImage(file);
      setDraft({ ...draft, image_url: path });
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(p: Pet, value: boolean) {
    try {
      await updatePet(p.id, { is_active: value });
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(p: Pet) {
    if (!confirm(`Excluir o pet "${p.name}"? Esta ação remove ele de todos os usuários.`)) return;
    try {
      await deletePet(p.id);
      toast.success("Pet excluído");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      <Header />
      <AdminTopNav eyebrow="Pets" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">Pets</h1>
            <p className="text-sm text-muted-foreground">
              Cada usuário escolhe um pet companheiro. Imagens 1024×1024 PNG transparente.
            </p>
          </div>
          <Button onClick={startCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo pet
          </Button>
        </div>

        {draft && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {creating ? "Novo pet" : "Editar pet"}
              </h2>
              <Button variant="ghost" size="sm" onClick={cancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                      slug: creating ? slugify(e.target.value) : draft.slug,
                    })
                  }
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                />
              </div>
              <div>
                <Label>Espécie</Label>
                <Input
                  value={draft.species}
                  onChange={(e) => setDraft({ ...draft, species: e.target.value })}
                  placeholder="gato, cachorro, coelho..."
                />
              </div>
              <div>
                <Label>Raridade</Label>
                <Select
                  value={draft.rarity}
                  onValueChange={(v) => setDraft({ ...draft, rarity: v as PetRarity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RARITIES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {PET_RARITY_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição / vantagem</Label>
                <Textarea
                  rows={3}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Companheiro tranquilo que..."
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={draft.sort_order ?? 0}
                  onChange={(e) =>
                    setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={draft.is_active ?? true}
                    onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                  />
                  <Label className="!m-0">Ativo</Label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label>Imagem (PNG transparente, 1024×1024)</Label>
                <div className="mt-1 flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    type="button"
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    {draft.image_url ? "Trocar" : "Enviar"} imagem
                  </Button>
                  {draft.image_url && (
                    <span className="text-xs text-muted-foreground">
                      Arquivo pronto. Salve para aplicar.
                    </span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={cancel} disabled={busy}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={busy} className="gap-1.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((p) => (
            <div
              key={p.id}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-sm",
                p.is_active ? "border-border" : "border-dashed border-border opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">sem imagem</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        PET_RARITY_COLOR[p.rarity],
                      )}
                    >
                      {PET_RARITY_LABEL[p.rarity]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.species} · ordem {p.sort_order}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {p.description ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(v) => void toggleActive(p, v)}
                  />
                  <span className="text-muted-foreground">Ativo</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void remove(p)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {pets.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum pet cadastrado ainda.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}