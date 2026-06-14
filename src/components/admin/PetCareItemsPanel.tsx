import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Droplet,
  Heart,
  ImageIcon,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Save,
  Smile,
  Trash2,
  Upload,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { listAll, slugify } from "@/lib/petCatalog";
import {
  createCareItem,
  deleteCareItem,
  getCareConfig,
  listCareItemsAdmin,
  setCareItemCompat,
  updateCareConfig,
  updateCareItem,
  uploadCareItemImage,
  type CareItemWritable,
} from "@/lib/petCare";
import {
  PET_CARE_ACTION_LABEL,
  PET_CARE_LABEL,
  type PetCareConfig,
  type PetCareItemWithCompat,
  type PetCareKindWithItems,
} from "@/types/petCare";
import type { PetCategory, PetSpecies } from "@/types/petCatalog";
import { cn } from "@/lib/utils";

const KINDS: { key: PetCareKindWithItems; icon: LucideIcon; bar: string }[] = [
  { key: "feed", icon: Utensils, bar: "Fome" },
  { key: "play", icon: Smile, bar: "Humor" },
  { key: "hygiene", icon: Droplet, bar: "Higiene" },
  { key: "sleep", icon: Moon, bar: "Sono" },
  { key: "affection", icon: Heart, bar: "Carência" },
];

type Draft = CareItemWritable & {
  id?: string;
  compat: { category_id: string; species_id: string | null }[];
};

function emptyDraft(kind: PetCareKindWithItems): Draft {
  return {
    kind,
    name: "",
    slug: "",
    description: null,
    image_url: null,
    cost_coins: 5,
    restore_amount: 15,
    energy_cost: kind === "sleep" ? 0 : 5,
    sleep_hours: kind === "sleep" ? 4 : 0,
    daily_uses: 0,
    active: true,
    sort_order: 0,
    compat: [],
  };
}

export function PetCareItemsPanel() {
  const [kind, setKind] = useState<PetCareKindWithItems>("feed");
  const [rows, setRows] = useState<PetCareItemWithCompat[]>([]);
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [species, setSpecies] = useState<PetSpecies[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [cfg, setCfg] = useState<PetCareConfig | null>(null);

  async function reload() {
    try {
      const [its, cats, sps, c] = await Promise.all([
        listCareItemsAdmin(),
        listAll<PetCategory>("pet_categories"),
        listAll<PetSpecies>("pet_species"),
        getCareConfig(),
      ]);
      setRows(its);
      setCategories(cats);
      setSpecies(sps);
      setCfg(c);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => r.kind === kind), [rows, kind]);

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error("Nome obrigatório");
    if (!draft.compat.length) return toast.error("Selecione ao menos uma compatibilidade");
    setBusy(true);
    try {
      const payload: CareItemWritable = {
        kind: draft.kind,
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugify(draft.name),
        description: draft.description?.trim() || null,
        image_url: draft.image_url,
        cost_coins: Math.max(0, draft.cost_coins | 0),
        restore_amount: Math.max(1, Math.min(100, draft.restore_amount | 0)),
        energy_cost: Math.max(0, Math.min(100, draft.energy_cost | 0)),
        sleep_hours: Math.max(0, Math.min(24, Number(draft.sleep_hours) || 0)),
        daily_uses: Math.max(0, draft.daily_uses | 0),
        active: draft.active,
        sort_order: draft.sort_order | 0,
      };
      const row = draft.id
        ? await updateCareItem(draft.id, payload)
        : await createCareItem(payload);
      await setCareItemCompat(row.id, draft.compat);
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
    if (!window.confirm("Excluir este item?")) return;
    try {
      await deleteCareItem(id);
      toast.success("Excluído");
      void reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Cuidados do pet</h2>
        <p className="text-xs text-muted-foreground">
          Configure os itens que aparecem no menu radial. Cada item tem custo em moedas
          e quanto restaura da barra. Compatibilidade define em quais espécies/categorias o item aparece.
        </p>
      </div>

      {/* config global */}
      {cfg && (
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Decaimento global por hora (todas as barras menos energia)</Label>
            <Input
              type="text" inputMode="decimal"
              min={0}
              max={100}
              value={cfg.decay_per_hour}
              onChange={(e) => setCfg({ ...cfg, decay_per_hour: Number(e.target.value) || 0 })}
              onBlur={() => updateCareConfig({ decay_per_hour: cfg.decay_per_hour }).catch((e) => toast.error((e as Error).message))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-yellow-500" /> Minutos para +1 de Energia</Label>
            <Input
              type="text" inputMode="decimal"
              min={1}
              max={240}
              value={cfg.energy_regen_minutes_per_point}
              onChange={(e) => setCfg({ ...cfg, energy_regen_minutes_per_point: Number(e.target.value) || 1 })}
              onBlur={() => updateCareConfig({ energy_regen_minutes_per_point: cfg.energy_regen_minutes_per_point }).catch((e) => toast.error((e as Error).message))}
            />
          </div>
        </div>
      )}

      {/* sub-tabs */}
      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
          {KINDS.map(({ key, icon: Icon, bar }) => {
            const active = kind === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setKind(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {PET_CARE_ACTION_LABEL[key]}
                <span className="text-[10px] opacity-70">({bar})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} item(ns) em {PET_CARE_ACTION_LABEL[kind]}
        </p>
        <Button onClick={() => setDraft(emptyDraft(kind))} size="sm" className="rounded-full">
          <Plus className="mr-1 h-3.5 w-3.5" /> Novo
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((row) => (
          <div key={row.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-video bg-muted">
              {row.image_url ? (
                <img src={row.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <span className="line-clamp-1 font-medium">{row.name}</span>
                {!row.active && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">inativo</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                  {row.cost_coins} moedas
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                  +{row.restore_amount} {PET_CARE_LABEL[row.kind]}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {row.compat.length} regra(s)
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setDraft({
                      id: row.id,
                      kind: row.kind,
                      name: row.name,
                      slug: row.slug,
                      description: row.description,
                      image_url: row.image_url,
                      cost_coins: row.cost_coins,
                      restore_amount: row.restore_amount,
                      energy_cost: row.energy_cost ?? 0,
                      sleep_hours: Number(row.sleep_hours ?? 0),
                      daily_uses: row.daily_uses ?? 0,
                      active: row.active,
                      sort_order: row.sort_order,
                      compat: [...row.compat],
                    })
                  }
                >
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
        {!filtered.length && (
          <p className="col-span-full rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum item nessa categoria ainda.
          </p>
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogTitle>
            {draft?.id ? "Editar item" : "Novo item"} —{" "}
            {draft ? PET_CARE_ACTION_LABEL[draft.kind] : ""}
          </DialogTitle>
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = await uploadCareItemImage(file);
      const { resolvePetImage } = await import("@/lib/petCatalog");
      const url = await resolvePetImage(path);
      onChange({ ...draft, image_url: url ?? path });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
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
    let next = draft.compat.filter((c) => !(c.category_id === catId && c.species_id === null));
    next = next.filter((c) => !(c.category_id === catId && c.species_id === spId));
    if (on) next.push({ category_id: catId, species_id: spId });
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
        <Label>Descrição (opcional)</Label>
        <Textarea
          rows={2}
          value={draft.description ?? ""}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Imagem</Label>
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-muted">
            {draft.image_url ? (
              <img src={draft.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1 h-3.5 w-3.5" /> Enviar imagem
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Custo (moedas)</Label>
          <Input
            type="text" inputMode="decimal"
            min={0}
            value={draft.cost_coins}
            onChange={(e) => onChange({ ...draft, cost_coins: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Restaura (+barra)</Label>
          <Input
            type="text" inputMode="decimal"
            min={1}
            max={100}
            value={draft.restore_amount}
            onChange={(e) => onChange({ ...draft, restore_amount: Number(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Ordem</Label>
          <Input
            type="text" inputMode="decimal"
            value={draft.sort_order}
            onChange={(e) => onChange({ ...draft, sort_order: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={draft.active} onCheckedChange={(v) => onChange({ ...draft, active: v })} />
        <Label className="m-0">Ativo</Label>
      </div>

      <div className="space-y-2">
        <Label>Compatibilidade</Label>
        <p className="text-xs text-muted-foreground">
          Marque "Categoria inteira" para liberar todas as espécies dela, ou escolha apenas espécies específicas.
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
                  <span className="text-xs font-normal text-muted-foreground">(categoria inteira)</span>
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
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          <X className="mr-1 h-3.5 w-3.5" /> Cancelar
        </Button>
        <Button onClick={onSave} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}