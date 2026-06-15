import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { listAll, slugify } from "@/lib/petCatalog";
import {
  createBackground,
  deleteBackground,
  listAdminBackgrounds,
  setBackgroundCompat,
  updateBackground,
  uploadBackgroundImage,
  type BackgroundWritable,
} from "@/lib/petBackgrounds";
import type {
  PetBackgroundCompat,
  PetBackgroundWithCompat,
} from "@/types/petBackground";
import { PET_RARITY_COLOR, PET_RARITY_LABEL, type PetRarity } from "@/types/pet";
import type { PetCategory, PetSpecies } from "@/types/petCatalog";
import { cn } from "@/lib/utils";

type Draft = BackgroundWritable & {
  id?: string;
  compat: { category_id: string; species_id: string | null }[];
};

const RARITIES: PetRarity[] = ["common", "rare", "epic", "legendary"];

function emptyDraft(sort: number): Draft {
  return {
    name: "",
    slug: "",
    description: "",
    image_url_day: null,
    image_url_night: null,
    rarity: "common",
    is_exclusive: false,
    price_coins: 0,
    active: true,
    sort_order: sort,
    min_level: 1,
    compat: [],
  };
}

export function PetBackgroundsPanel() {
  const [rows, setRows] = useState<PetBackgroundWithCompat[]>([]);
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [species, setSpecies] = useState<PetSpecies[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function reload() {
    try {
      const [bgs, cats, sps] = await Promise.all([
        listAdminBackgrounds(),
        listAll<PetCategory>("pet_categories"),
        listAll<PetSpecies>("pet_species"),
      ]);
      setRows(bgs);
      setCategories(cats);
      setSpecies(sps);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function openCreate() {
    setDraft(emptyDraft(rows.length * 10));
  }

  function openEdit(row: PetBackgroundWithCompat) {
    setDraft({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image_url_day: row.image_url_day,
      image_url_night: row.image_url_night,
      rarity: row.rarity,
      is_exclusive: row.is_exclusive,
      price_coins: row.price_coins,
      active: row.active,
      sort_order: row.sort_order,
      min_level: row.min_level ?? 1,
      compat: row.compat.map((c) => ({ category_id: c.category_id, species_id: c.species_id })),
    });
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error("Nome obrigatório");
    if (!draft.image_url_day || !draft.image_url_night)
      return toast.error("Envie as duas imagens (dia e noite)");
    if (!draft.compat.length) return toast.error("Marque ao menos um tipo compatível");
    setBusy(true);
    try {
      const payload: BackgroundWritable = {
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugify(draft.name),
        description: draft.description?.trim() || null,
        image_url_day: draft.image_url_day,
        image_url_night: draft.image_url_night,
        rarity: draft.rarity,
        is_exclusive: draft.is_exclusive,
        price_coins: draft.is_exclusive ? Math.max(0, draft.price_coins | 0) : 0,
        active: draft.active,
        sort_order: draft.sort_order,
        min_level: Math.max(1, Math.min(50, draft.min_level | 0 || 1)),
      };
      const row = draft.id
        ? await updateBackground(draft.id, payload)
        : await createBackground(payload);
      await setBackgroundCompat(row.id, draft.compat);
      toast.success("Salvo");
      setDraft(null);
      void reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este background?")) return;
    try {
      await deleteBackground(id);
      toast.success("Excluído");
      void reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Backgrounds (cenários)</h2>
          <p className="text-xs text-muted-foreground">
            Dia e noite, com regras de compatibilidade por categoria/espécie.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" /> Novo
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="relative grid grid-cols-2 gap-px bg-border">
              <div className="relative aspect-video bg-muted">
                {row.image_url_day ? (
                  <img src={row.image_url_day} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <span className="absolute left-1 top-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  DIA
                </span>
              </div>
              <div className="relative aspect-video bg-muted">
                {row.image_url_night ? (
                  <img src={row.image_url_night} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <span className="absolute left-1 top-1 rounded bg-indigo-700/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  NOITE
                </span>
              </div>
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <span className="line-clamp-1 font-medium">{row.name}</span>
                {!row.active && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">inativo</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className={cn("rounded-full px-2 py-0.5 font-medium", PET_RARITY_COLOR[row.rarity])}>
                  {PET_RARITY_LABEL[row.rarity]}
                </span>
                {row.is_exclusive && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                    {row.price_coins} moedas
                  </span>
                )}
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {row.compat.length} regra(s)
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="flex-1">
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => void remove(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {!rows.length && (
          <p className="col-span-full rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum background ainda.
          </p>
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogTitle>{draft?.id ? "Editar background" : "Novo background"}</DialogTitle>
          {draft && (
            <DraftForm
              draft={draft}
              categories={categories}
              species={species}
              busy={busy}
              onChange={setDraft}
              onSave={save}
              onCancel={() => setDraft(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DraftForm({
  draft,
  categories,
  species,
  busy,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Draft;
  categories: PetCategory[];
  species: PetSpecies[];
  busy: boolean;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const dayRef = useRef<HTMLInputElement>(null);
  const nightRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"day" | "night" | null>(null);

  async function handleUpload(file: File, kind: "day" | "night") {
    setUploading(kind);
    try {
      const path = await uploadBackgroundImage(file, kind);
      // Build a signed url for preview right after upload via resolvePetImage indirectly:
      // setBackgroundCompat / create will save the storage path; for preview we sign here.
      const url = await import("@/lib/petCatalog").then((m) => m.resolvePetImage(path));
      onChange({
        ...draft,
        [kind === "day" ? "image_url_day" : "image_url_night"]: url ?? path,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  const compatMap = new Map<string, Set<string | null>>();
  for (const c of draft.compat) {
    if (!compatMap.has(c.category_id)) compatMap.set(c.category_id, new Set());
    compatMap.get(c.category_id)!.add(c.species_id);
  }

  function toggleWholeCategory(catId: string, on: boolean) {
    const others = draft.compat.filter((c) => c.category_id !== catId);
    onChange({
      ...draft,
      compat: on ? [...others, { category_id: catId, species_id: null }] : others,
    });
  }

  function toggleSpecies(catId: string, spId: string, on: boolean) {
    let next = draft.compat.filter(
      (c) => !(c.category_id === catId && c.species_id === null),
    );
    if (on) {
      next = next.filter((c) => !(c.category_id === catId && c.species_id === spId));
      next.push({ category_id: catId, species_id: spId });
    } else {
      next = next.filter((c) => !(c.category_id === catId && c.species_id === spId));
    }
    onChange({ ...draft, compat: next });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input
            value={draft.name}
            onChange={(e) =>
              onChange({
                ...draft,
                name: e.target.value,
                slug: draft.slug || slugify(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input
            value={draft.slug}
            onChange={(e) => onChange({ ...draft, slug: slugify(e.target.value) })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea
          value={draft.description ?? ""}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["day", "night"] as const).map((kind) => {
          const url = kind === "day" ? draft.image_url_day : draft.image_url_night;
          const ref = kind === "day" ? dayRef : nightRef;
          return (
            <div key={kind} className="space-y-1.5">
              <Label>{kind === "day" ? "Imagem (dia)" : "Imagem (noite)"}</Label>
              <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                {url ? (
                  <img src={url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                {uploading === kind && (
                  <div className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f, kind);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => ref.current?.click()}
              >
                <Upload className="mr-1 h-3.5 w-3.5" /> Enviar
              </Button>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Raridade</Label>
          <Select
            value={draft.rarity}
            onValueChange={(v) => {
              const r = v as PetRarity;
              const suggested = r === "legendary" ? 30 : r === "epic" ? 9 : r === "rare" ? 3 : 1;
              onChange({ ...draft, rarity: r, min_level: suggested });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RARITIES.map((r) => (
                <SelectItem key={r} value={r}>{PET_RARITY_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Nível mínimo</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={draft.min_level}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/\D+/g, ""), 10);
              onChange({ ...draft, min_level: Number.isFinite(n) ? Math.max(1, Math.min(50, n)) : 1 });
            }}
          />
          <p className="text-[10px] text-muted-foreground">
            Sugestão: comum 1 · raro 3 · épico 9 · lendário 30
          </p>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={draft.is_exclusive}
            onCheckedChange={(v) => onChange({ ...draft, is_exclusive: v })}
          />
          <Label className="m-0">Exclusivo</Label>
        </div>
        {draft.is_exclusive && (
          <div className="space-y-1.5">
            <Label>Preço (moedas)</Label>
            <Input
              type="text" inputMode="decimal"
              min={0}
              value={draft.price_coins}
              onChange={(e) => onChange({ ...draft, price_coins: Number(e.target.value) || 0 })}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={draft.active}
          onCheckedChange={(v) => onChange({ ...draft, active: v })}
        />
        <Label className="m-0">Ativo</Label>
      </div>

      <div className="space-y-2">
        <Label>Compatibilidade</Label>
        <p className="text-xs text-muted-foreground">
          Marque "Categoria inteira" para liberar todas as espécies, ou escolha apenas as
          espécies permitidas.
        </p>
        <div className="space-y-2">
          {categories.map((cat) => {
            const set = compatMap.get(cat.id);
            const wholeOn = set?.has(null) ?? false;
            const catSpecies = species.filter((s) => (s as any).category_id === cat.id);
            return (
              <div key={cat.id} className="rounded-xl border border-border p-3">
                <label className="flex items-center gap-2 font-medium">
                  <Checkbox
                    checked={wholeOn}
                    onCheckedChange={(v) => toggleWholeCategory(cat.id, !!v)}
                  />
                  {cat.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    (categoria inteira)
                  </span>
                </label>
                {!wholeOn && catSpecies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 pl-6">
                    {catSpecies.map((sp) => {
                      const on = set?.has(sp.id) ?? false;
                      return (
                        <label
                          key={sp.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                            on ? "border-foreground bg-foreground text-background" : "border-border",
                          )}
                        >
                          <Checkbox
                            checked={on}
                            onCheckedChange={(v) => toggleSpecies(cat.id, sp.id, !!v)}
                          />
                          {sp.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          <X className="mr-1 h-4 w-4" /> Cancelar
        </Button>
        <Button onClick={onSave} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}