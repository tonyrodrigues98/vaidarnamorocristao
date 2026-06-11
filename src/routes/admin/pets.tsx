import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  Save,
  X,
  Layers,
  PawPrint,
  Sparkles,
  Baby,
  Smile,
  Gift,
  Star,
  ImageIcon,
  Pencil,
  Tag,
  Hash,
  Zap,
  Wand2,
} from "lucide-react";

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
  slugify as slugifyPet,
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
import {
  BENEFIT_SCOPE_LABEL,
  PET_TABLE_LABEL,
  createRow,
  deleteRow,
  listAll,
  slugify,
  updateRow,
  uploadPetCatalogImage,
  listPerkEffects,
  upsertPerkEffect,
  deletePerkEffect,
  listDecorations,
  listBackgrounds,
  listBadgesCatalog,
  PERK_CATEGORY_LABEL,
} from "@/lib/petCatalog";
import type {
  PetBenefit,
  PetBenefitScope,
  PetCatalogEntity,
  PetCatalogTable,
  PetCategory,
  PetPerkEffect,
  PetPerkEffectCategory,
  PetSpecies,
  PetVariant,
} from "@/types/petCatalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pets")({ component: PetsAdmin });

type TabKey = "legacy" | "perk_effects" | PetCatalogTable;

const TABS: { key: TabKey; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "pet_categories", label: "Categorias", icon: Layers },
  { key: "pet_species", label: "Espécies", icon: PawPrint },
  { key: "pet_variants", label: "Variações", icon: Sparkles },
  { key: "pet_life_stages", label: "Fases", icon: Baby },
  { key: "pet_personalities", label: "Personalidades", icon: Smile },
  { key: "pet_benefits", label: "Benefícios", icon: Gift },
  { key: "perk_effects", label: "Tipos de efeito", icon: Zap },
  { key: "legacy", label: "Pets (legado)", icon: Star },
];

function PetsAdmin() {
  const { user, role, loading, rolesLoaded } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";
  const [tab, setTab] = useState<TabKey>("pet_categories");

  if (loading || (user && !rolesLoaded)) return null;
  if (!user) return <Navigate to="/auth/login" />;
  if (!isAdmin) return <Navigate to="/admin" />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      <Header />
      <AdminTopNav eyebrow="Pets" />
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <PawPrint className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Pets</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Catálogo dinâmico que alimenta o onboarding em /meu-pet.
            </p>
          </div>
        </div>

        <div className="-mx-3 mb-5 overflow-x-auto px-3 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground hover:ring-foreground/30",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "legacy" ? (
          <LegacyPetsPanel />
        ) : tab === "perk_effects" ? (
          <PerkEffectsPanel />
        ) : (
          <CatalogPanel table={tab} />
        )}
      </main>
    </div>
  );
}

/* ============================== CATALOG PANEL ============================== */

type DraftRecord = Record<string, unknown> & {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  active?: boolean;
  sort_order?: number;
  category_id?: string | null;
  species_id?: string | null;
  scope?: PetBenefitScope;
  scope_id?: string | null;
  perk_label?: string | null;
  effect_key?: string | null;
  effect_param?: number | null;
  effect_target_id?: string | null;
};

function CatalogPanel({ table }: { table: PetCatalogTable }) {
  const [rows, setRows] = useState<PetCatalogEntity[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<DraftRecord | null>(null);
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [species, setSpecies] = useState<PetSpecies[]>([]);
  const [variants, setVariants] = useState<PetVariant[]>([]);
  const [perkEffects, setPerkEffects] = useState<PetPerkEffect[]>([]);
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      setRows(await listAll<PetCatalogEntity>(table));
      if (table === "pet_species" || table === "pet_variants" || table === "pet_benefits") {
        setCategories(await listAll<PetCategory>("pet_categories"));
      }
      if (table === "pet_variants" || table === "pet_benefits") {
        setSpecies(await listAll<PetSpecies>("pet_species"));
      }
      if (table === "pet_benefits") {
        setVariants(await listAll<PetVariant>("pet_variants"));
        setPerkEffects(await listPerkEffects(true));
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    setEditingId(null);
    setCreating(false);
    setDraft(null);
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  function emptyDraft(): DraftRecord {
    const base: DraftRecord = {
      name: "",
      slug: "",
      description: "",
      image_url: null,
      active: true,
      sort_order: rows.length * 10,
    };
    if (table === "pet_species") base.category_id = categories[0]?.id ?? null;
    if (table === "pet_variants") {
      base.category_id = categories[0]?.id ?? null;
      base.species_id = null;
    }
    if (table === "pet_benefits") {
      base.scope = "global";
      base.scope_id = null;
      base.perk_label = "";
      base.effect_key = null;
      base.effect_param = null;
      base.effect_target_id = null;
    }
    return base;
  }

  function startCreate() {
    setEditingId(null);
    setCreating(true);
    setDraft(emptyDraft());
  }
  function startEdit(row: PetCatalogEntity) {
    setCreating(false);
    setEditingId(row.id);
    setDraft({ ...(row as unknown as DraftRecord) });
  }
  function cancel() {
    setEditingId(null);
    setCreating(false);
    setDraft(null);
  }

  async function uploadImage(file: File) {
    if (!draft) return;
    setBusy(true);
    try {
      const path = await uploadPetCatalogImage(file, table);
      setDraft({ ...draft, image_url: path });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const selectedEffect = useMemo(
    () => perkEffects.find((e) => e.key === (draft?.effect_key ?? "")) ?? null,
    [perkEffects, draft?.effect_key],
  );

  // Load target options for unlock_* effects
  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!selectedEffect?.needs_target) {
        setTargets([]);
        return;
      }
      try {
        let list: { id: string; name: string }[] = [];
        if (selectedEffect.key === "unlock_aura" || selectedEffect.key === "pet_avatar_aura_fx") {
          list = await listDecorations("aura");
        } else if (selectedEffect.needs_target === "avatar_decorations") {
          list = await listDecorations("frame");
        } else if (selectedEffect.needs_target === "profile_backgrounds") {
          list = await listBackgrounds();
        } else if (selectedEffect.needs_target === "badges") {
          list = await listBadgesCatalog();
        }
        if (!cancel) setTargets(list);
      } catch (e) {
        if (!cancel) toast.error((e as Error).message);
      }
    }
    void load();
    return () => {
      cancel = true;
    };
  }, [selectedEffect]);

  async function save() {
    if (!draft) return;
    const name = (draft.name || "").trim();
    if (!name) {
      toast.error("Nome obrigatório");
      return;
    }
    const slug = (draft.slug || "").trim() || slugify(name);
    const payload: Record<string, unknown> = { ...draft, name, slug };
    if (table === "pet_benefits") {
      if (payload.scope === "global") payload.scope_id = null;
      if (payload.scope !== "global" && !payload.scope_id) {
        toast.error("Selecione o alvo do benefício");
        return;
      }
    }
    setBusy(true);
    try {
      if (editingId) {
        await updateRow(table, editingId, payload);
        toast.success("Atualizado");
      } else {
        await createRow(table, payload);
        toast.success("Criado");
      }
      cancel();
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: PetCatalogEntity) {
    if (!confirm(`Excluir "${row.name}"?`)) return;
    try {
      await deleteRow(table, row.id);
      toast.success("Removido");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const scopeOptions: PetBenefitScope[] = ["global", "category", "species", "variant"];
  function scopeTargets(scope: PetBenefitScope) {
    if (scope === "category") return categories;
    if (scope === "species") return species;
    if (scope === "variant") return variants;
    return [];
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">{PET_TABLE_LABEL[table]}</h2>
        <Button size="sm" onClick={startCreate} disabled={creating || editingId !== null} className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> Novo
        </Button>
      </div>

      {(creating || editingId) && draft && (
        <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field icon={Tag} label="Nome">
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    name: e.target.value,
                    slug: editingId ? draft.slug : slugify(e.target.value),
                  })
                }
              />
            </Field>
            <Field icon={Hash} label="Slug">
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field icon={Pencil} label="Descrição">
                <Textarea
                  value={(draft.description as string) ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
            </div>
            <Field icon={Hash} label="Ordem">
              <Input
                type="number"
                value={(draft.sort_order as number) ?? 0}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </Field>
            <div className="flex items-end gap-3">
              <Switch
                checked={Boolean(draft.active)}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
              <span className="text-sm">Ativo</span>
            </div>

            {table === "pet_species" && (
              <div className="sm:col-span-2">
                <Field icon={Layers} label="Categoria">
                  <Select
                    value={(draft.category_id as string) ?? ""}
                    onValueChange={(v) => setDraft({ ...draft, category_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {table === "pet_variants" && (
              <>
                <Field icon={Layers} label="Categoria">
                  <Select
                    value={(draft.category_id as string) ?? ""}
                    onValueChange={(v) => setDraft({ ...draft, category_id: v || null })}
                  >
                    <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field icon={PawPrint} label="Espécie">
                  <Select
                    value={(draft.species_id as string) ?? ""}
                    onValueChange={(v) => setDraft({ ...draft, species_id: v || null })}
                  >
                    <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                    <SelectContent>
                      {species
                        .filter((s) => !draft.category_id || s.category_id === draft.category_id)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {table === "pet_benefits" && (
              <>
                <div className="sm:col-span-2">
                  <Field icon={Wand2} label="Vantagem (efeito real)">
                    <Select
                      value={(draft.effect_key as string) ?? "__none__"}
                      onValueChange={(v) =>
                        setDraft({
                          ...draft,
                          effect_key: v === "__none__" ? null : v,
                          effect_param: null,
                          effect_target_id: null,
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem efeito (apenas cosmético)</SelectItem>
                        {Object.entries(
                          perkEffects.reduce<Record<string, PetPerkEffect[]>>((acc, e) => {
                            (acc[e.category] ||= []).push(e);
                            return acc;
                          }, {}),
                        ).map(([cat, items]) => (
                          <div key={cat}>
                            <div className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                              {PERK_CATEGORY_LABEL[cat as PetPerkEffectCategory]}
                            </div>
                            {items.map((e) => (
                              <SelectItem key={e.key} value={e.key}>
                                {e.label}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field icon={Tag} label="Rótulo curto (opcional)">
                  <Input
                    value={(draft.perk_label as string) ?? ""}
                    placeholder="Ex.: +2 moedas"
                    onChange={(e) => setDraft({ ...draft, perk_label: e.target.value })}
                  />
                </Field>
                {selectedEffect?.numeric_param && (
                  <Field icon={Hash} label="Quantidade">
                    <Input
                      type="number"
                      value={(draft.effect_param as number) ?? selectedEffect.default_param ?? 0}
                      onChange={(e) =>
                        setDraft({ ...draft, effect_param: Number(e.target.value) || 0 })
                      }
                    />
                  </Field>
                )}
                {selectedEffect?.needs_target && (
                  <div className="sm:col-span-2">
                    <Field icon={Star} label="Alvo desbloqueado">
                      <Select
                        value={(draft.effect_target_id as string) ?? ""}
                        onValueChange={(v) => setDraft({ ...draft, effect_target_id: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {targets.length === 0 ? (
                            <SelectItem value="__empty__" disabled>
                              Nenhum disponível
                            </SelectItem>
                          ) : (
                            targets.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}
                <Field icon={Gift} label="Escopo">
                  <Select
                    value={(draft.scope as string) ?? "global"}
                    onValueChange={(v) =>
                      setDraft({ ...draft, scope: v as PetBenefitScope, scope_id: null })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {scopeOptions.map((s) => (
                        <SelectItem key={s} value={s}>{BENEFIT_SCOPE_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {draft.scope && draft.scope !== "global" && (
                  <Field icon={Tag} label="Alvo">
                    <Select
                      value={(draft.scope_id as string) ?? ""}
                      onValueChange={(v) => setDraft({ ...draft, scope_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {scopeTargets(draft.scope as PetBenefitScope).map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </>
            )}

            <div className="sm:col-span-2">
              <Field icon={ImageIcon} label="Imagem">
                <div className="flex items-center gap-3">
                  {draft.image_url ? (
                    <img
                      src={draft.image_url as string}
                      alt=""
                      className="h-16 w-16 rounded-2xl object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-border text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadImage(f);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="rounded-full"
                  >
                    <Upload className="mr-1 h-4 w-4" /> Enviar
                  </Button>
                </div>
              </Field>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancel} className="rounded-full">
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={busy} className="rounded-full">
              {busy ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              !row.active && "opacity-60",
            )}
          >
            {row.image_url ? (
              <img src={row.image_url} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-border" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
              {table === "pet_benefits" && (
                <p className="text-[11px] text-muted-foreground">
                  Escopo: {BENEFIT_SCOPE_LABEL[(row as PetBenefit).scope]}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => startEdit(row)} className="h-8 w-8 rounded-full">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void remove(row)}
                className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Nenhum registro. Clique em "Novo" para adicionar.
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Label>
      {children}
    </div>
  );
}

/* ============================== LEGACY PETS PANEL ============================== */

const RARITIES: PetRarity[] = ["common", "rare", "epic", "legendary"];

function LegacyPetsPanel() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PetWritable | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [speciesList, setSpeciesList] = useState<PetSpecies[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      const [list, cats, specs] = await Promise.all([
        listAllPetsAdmin(),
        listAll<PetCategory>("pet_categories"),
        listAll<PetSpecies>("pet_species"),
      ]);
      setPets(list);
      setCategories(cats);
      setSpeciesList(specs);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setCategoryId(categories[0]?.id ?? "");
    setDraft({
      name: "",
      slug: "",
      species: "",
      description: "",
      rarity: "common",
      is_active: true,
      sort_order: pets.length * 10,
      image_url: null,
      is_exclusive: false,
      price_coins: 0,
    });
  }

  function startEdit(p: Pet) {
    setCreating(false);
    setEditingId(p.id);
    const matched = speciesList.find(
      (s) => s.name.toLowerCase() === p.species.toLowerCase() || s.slug === p.species,
    );
    setCategoryId(matched?.category_id ?? categories[0]?.id ?? "");
    setDraft({
      name: p.name,
      slug: p.slug,
      species: p.species,
      description: p.description ?? "",
      rarity: p.rarity,
      is_active: p.is_active,
      sort_order: p.sort_order,
      image_url: null,
      is_exclusive: p.is_exclusive,
      price_coins: p.price_coins ?? 0,
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
    const slug = (draft.slug || slugifyPet(name)).trim();
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
          is_exclusive: draft.is_exclusive,
          price_coins: draft.is_exclusive ? draft.price_coins ?? 0 : 0,
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
          is_exclusive: draft.is_exclusive,
          price_coins: draft.is_exclusive ? draft.price_coins ?? 0 : 0,
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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Pets (sistema antigo)</h2>
          <p className="text-xs text-muted-foreground">Mantenha enquanto migra para o catálogo dinâmico acima.</p>
        </div>
        <Button onClick={startCreate} size="sm" className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> Novo
        </Button>
      </div>

      {draft && (
        <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{creating ? "Novo pet" : "Editar pet"}</h3>
            <Button variant="ghost" size="icon" onClick={cancel} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field icon={Tag} label="Nome">
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    name: e.target.value,
                    slug: creating ? slugifyPet(e.target.value) : draft.slug,
                  })
                }
              />
            </Field>
            <Field icon={Hash} label="Slug">
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugifyPet(e.target.value) })} />
            </Field>
            <Field icon={Layers} label="Categoria">
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v);
                  setDraft({ ...draft, species: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categories.length ? "Selecione" : "Cadastre uma categoria"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field icon={PawPrint} label="Espécie">
              <Select
                value={draft.species}
                onValueChange={(v) => setDraft({ ...draft, species: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoryId ? "Selecione" : "Escolha a categoria"} />
                </SelectTrigger>
                <SelectContent>
                  {speciesList
                    .filter((s) => !categoryId || s.category_id === categoryId)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field icon={Pencil} label="Descrição / vantagem">
                <Textarea
                  rows={3}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Companheiro tranquilo que..."
                />
              </Field>
            </div>
            <Field icon={Hash} label="Ordem">
              <Input
                type="number"
                value={draft.sort_order ?? 0}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
              />
            </Field>
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.is_active ?? true}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
                <Label className="!m-0 text-sm">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.is_exclusive ?? false}
                  onCheckedChange={(v) =>
                    setDraft({
                      ...draft,
                      is_exclusive: v,
                      rarity: v ? draft.rarity || "rare" : "common",
                    })
                  }
                />
                <Label className="!m-0 text-sm">Exclusivo</Label>
              </div>
            </div>
            {draft.is_exclusive && (
              <>
                <Field icon={Sparkles} label="Raridade">
                  <Select
                    value={draft.rarity}
                    onValueChange={(v) => setDraft({ ...draft, rarity: v as PetRarity })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RARITIES.map((r) => (
                        <SelectItem key={r} value={r}>{PET_RARITY_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field icon={Sparkles} label="Preço (moedas)">
                  <Input
                    type="number"
                    min={0}
                    value={draft.price_coins ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, price_coins: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </Field>
              </>
            )}
            <div className="sm:col-span-2">
              <Field icon={ImageIcon} label="Imagem (PNG transparente, 1024×1024)">
                <div className="mt-1 flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    type="button"
                    size="sm"
                    className="rounded-full"
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    {draft.image_url ? "Trocar" : "Enviar"} imagem
                  </Button>
                  {draft.image_url && (
                    <span className="text-xs text-muted-foreground">Pronto. Salve para aplicar.</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
                />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={cancel} disabled={busy} className="rounded-full">
              Cancelar
            </Button>
            <Button onClick={save} disabled={busy} className="rounded-full">
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
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
              "rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              !p.is_active && "opacity-60",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                  {p.is_exclusive ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        PET_RARITY_COLOR[p.rarity],
                      )}
                    >
                      {PET_RARITY_LABEL[p.rarity]}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Básico
                    </span>
                  )}
                  {p.is_exclusive && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      {p.price_coins} 🪙
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{p.species} · ordem {p.sort_order}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description ?? "—"}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Switch checked={p.is_active} onCheckedChange={(v) => void toggleActive(p, v)} />
                <span className="text-muted-foreground">Ativo</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="h-8 w-8 rounded-full">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void remove(p)}
                  className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {pets.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Nenhum pet cadastrado ainda.
          </div>
        )}
      </div>
    </section>
  );
}

