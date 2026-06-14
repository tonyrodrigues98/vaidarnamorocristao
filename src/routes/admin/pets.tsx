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
  Eye,
  EyeOff,
  Image as ImageLucide,
  Heart,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { useSignedPetUrl } from "@/lib/petImageUrl";
import { PetBackgroundsPanel } from "@/components/admin/PetBackgroundsPanel";
import { PetCareItemsPanel } from "@/components/admin/PetCareItemsPanel";
import { PetPersonalityEffectsPanel } from "@/components/admin/PetPersonalityEffectsPanel";

export const Route = createFileRoute("/admin/pets")({ component: PetsAdmin });

type TabKey =
  | "legacy"
  | "perk_effects"
  | "personality_effects"
  | "backgrounds"
  | "care"
  | PetCatalogTable;

const TABS: { key: TabKey; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "pet_categories", label: "Categorias", icon: Layers },
  { key: "pet_species", label: "Espécies", icon: PawPrint },
  { key: "pet_variants", label: "Variações", icon: Sparkles },
  { key: "pet_life_stages", label: "Fases", icon: Baby },
  { key: "pet_personalities", label: "Personalidades", icon: Smile },
  { key: "personality_effects", label: "Bônus de personalidade", icon: Sparkles },
  { key: "perk_effects", label: "Tipos de efeito", icon: Zap },
  { key: "backgrounds", label: "Backgrounds", icon: ImageLucide },
  { key: "care", label: "Cuidados", icon: Heart },
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
        ) : tab === "personality_effects" ? (
          <PetPersonalityEffectsPanel />
        ) : tab === "backgrounds" ? (
          <PetBackgroundsPanel />
        ) : tab === "care" ? (
          <PetCareItemsPanel />
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
  image_url_baby?: string | null;
  image_url_adult?: string | null;
  rarity?: PetRarity;
  is_exclusive?: boolean;
  price_coins?: number;
  kind?: "baby" | "adult" | null;
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
  benefit_id?: string | null;
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
  const [benefits, setBenefits] = useState<PetBenefit[]>([]);
  const [targets, setTargets] = useState<{ id: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      setRows(await listAll<PetCatalogEntity>(table));
      if (table === "pet_species" || table === "pet_variants" || table === "pet_benefits") {
        setCategories(await listAll<PetCategory>("pet_categories"));
      }
      if (table === "pet_variants") {
        setSpecies(await listAll<PetSpecies>("pet_species"));
      }
      if (table === "pet_species" || table === "pet_variants") {
        setPerkEffects(await listPerkEffects(true));
        setBenefits(await listAll<PetBenefit>("pet_benefits"));
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
    if (table === "pet_species") {
      base.category_id = categories[0]?.id ?? null;
      base.image_url_baby = null;
      base.image_url_adult = null;
      base.rarity = "common";
      base.is_exclusive = false;
      base.price_coins = 0;
      base.benefit_id = null;
    }
    if (table === "pet_variants") {
      base.category_id = categories[0]?.id ?? null;
      base.species_id = null;
      base.image_url_baby = null;
      base.image_url_adult = null;
      base.rarity = "common";
      base.is_exclusive = false;
      base.price_coins = 0;
      base.benefit_id = null;
    }
    if (table === "pet_life_stages") {
      base.kind = null;
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
    const base = { ...(row as unknown as DraftRecord) };
    if (table === "pet_species" || table === "pet_variants") {
      const linked = benefits.find((b) => b.id === (base.benefit_id ?? ""));
      base.effect_key = linked?.effect_key ?? null;
      base.perk_label = linked?.perk_label ?? "";
      base.effect_param = linked?.effect_param ?? null;
      base.effect_target_id = linked?.effect_target_id ?? null;
    }
    setDraft(base);
  }
  function cancel() {
    setEditingId(null);
    setCreating(false);
    setDraft(null);
  }

  async function uploadImage(file: File, field: "image_url" | "image_url_baby" | "image_url_adult" = "image_url") {
    if (!draft) return;
    setBusy(true);
    try {
      const path = await uploadPetCatalogImage(file, `${table}/${field}`);
      setDraft({ ...draft, [field]: path });
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
    const isPetForm = table === "pet_species" || table === "pet_variants";
    // Extract virtual perk fields — not columns on species/variants
    const perkEffectKey = isPetForm ? ((draft.effect_key as string | null) ?? null) : null;
    const perkLabel = isPetForm ? ((draft.perk_label as string | null) ?? null) : null;
    const perkParam = isPetForm ? ((draft.effect_param as number | null) ?? null) : null;
    const perkTargetId = isPetForm ? ((draft.effect_target_id as string | null) ?? null) : null;
    if (isPetForm) {
      delete payload.effect_key;
      delete payload.perk_label;
      delete payload.effect_param;
      delete payload.effect_target_id;
    }
    if (table === "pet_benefits") {
      if (payload.scope === "global") payload.scope_id = null;
      if (payload.scope !== "global" && !payload.scope_id) {
        toast.error("Selecione o alvo do benefício");
        return;
      }
    }
    setBusy(true);
    try {
      // Manage attached benefit for species/variants
      if (isPetForm) {
        const existingBenefitId = (draft.benefit_id as string | null) ?? null;
        if (perkEffectKey) {
          const benefitPayload = {
            name,
            slug: `${table}-${slug}`,
            description: null,
            image_url: null,
            scope: "global" as PetBenefitScope,
            scope_id: null,
            perk_label: perkLabel || null,
            effect_key: perkEffectKey,
            effect_param: perkParam,
            effect_target_id: perkTargetId,
            active: true,
            sort_order: 0,
          };
          if (existingBenefitId) {
            await updateRow("pet_benefits", existingBenefitId, benefitPayload);
            payload.benefit_id = existingBenefitId;
          } else {
            const created = await createRow<PetBenefit>("pet_benefits", benefitPayload);
            payload.benefit_id = created.id;
          }
        } else {
          payload.benefit_id = null;
          if (existingBenefitId) {
            try { await deleteRow("pet_benefits", existingBenefitId); } catch { /* ignore */ }
          }
        }
      }
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
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={startCreate} disabled={creating || editingId !== null} className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> Novo
          </Button>
        </div>
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
                type="text" inputMode="decimal"
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
                      type="text" inputMode="decimal"
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

            {table === "pet_life_stages" && (
              <div className="sm:col-span-2">
                <Field icon={Baby} label="Tipo da fase (decide qual imagem do pet aparece)">
                  <Select
                    value={(draft.kind as string) ?? "__none__"}
                    onValueChange={(v) =>
                      setDraft({ ...draft, kind: v === "__none__" ? null : (v as "baby" | "adult") })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem distinção (usa imagem padrão)</SelectItem>
                      <SelectItem value="baby">Filhote</SelectItem>
                      <SelectItem value="adult">Adulto</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {(table === "pet_species" || table === "pet_variants") && (
              <>
                <div className="sm:col-span-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Wand2 className="h-4 w-4 text-primary" />
                    Vantagem exclusiva deste pet
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field icon={Wand2} label="Efeito real">
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
                            <SelectItem value="__none__">Sem vantagem (apenas cosmético)</SelectItem>
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
                                  <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    {draft.effect_key && (
                      <>
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
                              type="text" inputMode="decimal"
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
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(draft.is_exclusive)}
                      onCheckedChange={(v) =>
                        setDraft({
                          ...draft,
                          is_exclusive: v,
                          rarity: v ? (draft.rarity as PetRarity) || "rare" : "common",
                          price_coins: v ? draft.price_coins ?? 0 : 0,
                        })
                      }
                    />
                    <Label className="!m-0 text-sm">Exclusivo (loja)</Label>
                  </div>
                </div>
                {draft.is_exclusive && (
                  <>
                    <Field icon={Sparkles} label="Raridade">
                      <Select
                        value={(draft.rarity as string) ?? "rare"}
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
                        type="text" inputMode="decimal"
                        min={0}
                        value={(draft.price_coins as number) ?? 0}
                        onChange={(e) =>
                          setDraft({ ...draft, price_coins: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </Field>
                  </>
                )}
                <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                  <Field icon={Baby} label="Imagem — Filhote (PNG transparente)">
                    <ImagePreview
                      value={(draft.image_url_baby as string) ?? null}
                      busy={busy}
                      onPick={(f) => void uploadImage(f, "image_url_baby")}
                      onClear={() => setDraft({ ...draft, image_url_baby: null })}
                    />
                  </Field>
                  <Field icon={PawPrint} label="Imagem — Adulto (PNG transparente)">
                    <ImagePreview
                      value={(draft.image_url_adult as string) ?? null}
                      busy={busy}
                      onPick={(f) => void uploadImage(f, "image_url_adult")}
                      onClear={() => setDraft({ ...draft, image_url_adult: null })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field icon={ImageIcon} label="Imagem padrão (fallback opcional)">
                    <ImagePreview
                      value={(draft.image_url as string) ?? null}
                      busy={busy}
                      onPick={(f) => void uploadImage(f, "image_url")}
                      onClear={() => setDraft({ ...draft, image_url: null })}
                    />
                  </Field>
                </div>
              </>
            )}

            {table !== "pet_species" && table !== "pet_variants" && (
              <div className="sm:col-span-2">
                <Field icon={ImageIcon} label="Imagem">
                  <ImagePreview
                    value={(draft.image_url as string) ?? null}
                    busy={busy}
                    onPick={(f) => void uploadImage(f)}
                    onClear={() => setDraft({ ...draft, image_url: null })}
                  />
                </Field>
              </div>
            )}
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

      <CatalogRowsView
        table={table}
        rows={rows}
        categories={categories}
        species={species}
        onEdit={startEdit}
        onRemove={(r) => void remove(r)}
        onToggleActive={async (row, next) => {
          try {
            await updateRow(table, row.id, { active: next });
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? ({ ...r, active: next } as PetCatalogEntity) : r)),
            );
            toast.success(next ? "Visível em /meu-pet" : "Ocultado de /meu-pet");
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
        onClearImage={async (row, field) => {
          try {
            await updateRow(table, row.id, { [field]: null });
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? ({ ...r, [field]: null } as PetCatalogEntity) : r)),
            );
            toast.success("Imagem removida");
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </section>
  );
}

/* ============================== ROWS VIEW (grouped) ============================== */

function CatalogRowsView({
  table,
  rows,
  categories,
  species,
  onEdit,
  onRemove,
  onToggleActive,
  onClearImage,
}: {
  table: PetCatalogTable;
  rows: PetCatalogEntity[];
  categories: PetCategory[];
  species: PetSpecies[];
  onEdit: (row: PetCatalogEntity) => void;
  onRemove: (row: PetCatalogEntity) => void;
  onToggleActive: (row: PetCatalogEntity, next: boolean) => void;
  onClearImage: (row: PetCatalogEntity, field: "image_url" | "image_url_baby" | "image_url_adult") => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        Nenhum registro. Clique em "Novo" para adicionar.
      </div>
    );
  }

  // Plain (flat) listing for tables that don't need grouping
  if (table !== "pet_species" && table !== "pet_variants") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <RowCard key={row.id} row={row} table={table} onEdit={onEdit} onRemove={onRemove} onToggleActive={onToggleActive} onClearImage={onClearImage} />
        ))}
      </div>
    );
  }

  // Grouped views
  const groups: { key: string; title: string; subtitle?: string; rows: PetCatalogEntity[] }[] = [];
  const orphan: PetCatalogEntity[] = [];

  if (table === "pet_species") {
    // Group species by category
    const byCat = new Map<string, PetCatalogEntity[]>();
    for (const r of rows) {
      const cid = (r as PetSpecies).category_id ?? "__none__";
      if (!byCat.has(cid)) byCat.set(cid, []);
      byCat.get(cid)!.push(r);
    }
    for (const c of categories) {
      const list = byCat.get(c.id);
      if (list && list.length) {
        groups.push({ key: c.id, title: c.name, subtitle: `${list.length} ${list.length === 1 ? "espécie" : "espécies"}`, rows: list });
      }
    }
    if (byCat.get("__none__")?.length) orphan.push(...byCat.get("__none__")!);
  } else if (table === "pet_variants") {
    // Group variants by species; variants without species go under their category
    const bySpecies = new Map<string, PetCatalogEntity[]>();
    const byCatNoSpecies = new Map<string, PetCatalogEntity[]>();
    for (const r of rows) {
      const v = r as PetVariant;
      if (v.species_id) {
        if (!bySpecies.has(v.species_id)) bySpecies.set(v.species_id, []);
        bySpecies.get(v.species_id)!.push(r);
      } else {
        const cid = v.category_id ?? "__none__";
        if (!byCatNoSpecies.has(cid)) byCatNoSpecies.set(cid, []);
        byCatNoSpecies.get(cid)!.push(r);
      }
    }
    // Iterate categories in order; inside each, species then "geral" (sem espécie)
    for (const c of categories) {
      const speciesOfCat = species.filter((s) => s.category_id === c.id);
      for (const s of speciesOfCat) {
        const list = bySpecies.get(s.id);
        if (list && list.length) {
          groups.push({
            key: `s-${s.id}`,
            title: s.name,
            subtitle: `${c.name} · ${list.length} ${list.length === 1 ? "variação" : "variações"}`,
            rows: list,
          });
        }
      }
      const noSpeciesList = byCatNoSpecies.get(c.id);
      if (noSpeciesList && noSpeciesList.length) {
        groups.push({
          key: `c-${c.id}`,
          title: `${c.name} · geral`,
          subtitle: `${noSpeciesList.length} ${noSpeciesList.length === 1 ? "variação" : "variações"} sem espécie`,
          rows: noSpeciesList,
        });
      }
    }
    if (byCatNoSpecies.get("__none__")?.length) orphan.push(...byCatNoSpecies.get("__none__")!);
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5">
            <h3 className="text-sm font-semibold tracking-tight">{g.title}</h3>
            {g.subtitle && (
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {g.subtitle}
              </span>
            )}
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.rows.map((row) => (
              <RowCard key={row.id} row={row} table={table} onEdit={onEdit} onRemove={onRemove} onToggleActive={onToggleActive} onClearImage={onClearImage} />
            ))}
          </div>
        </section>
      ))}
      {orphan.length > 0 && (
        <section>
          <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-dashed border-border/60 pb-1.5">
            <h3 className="text-sm font-semibold tracking-tight text-destructive">Sem categoria</h3>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {orphan.length} item(s)
            </span>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orphan.map((row) => (
              <RowCard key={row.id} row={row} table={table} onEdit={onEdit} onRemove={onRemove} onToggleActive={onToggleActive} onClearImage={onClearImage} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RowCard({
  row,
  table,
  onEdit,
  onRemove,
  onToggleActive,
  onClearImage,
}: {
  row: PetCatalogEntity;
  table: PetCatalogTable;
  onEdit: (row: PetCatalogEntity) => void;
  onRemove: (row: PetCatalogEntity) => void;
  onToggleActive: (row: PetCatalogEntity, next: boolean) => void;
  onClearImage: (row: PetCatalogEntity, field: "image_url" | "image_url_baby" | "image_url_adult") => void;
}) {
  const isProduct = table === "pet_species" || table === "pet_variants";
  const prod = row as PetCatalogEntity & {
    image_url_baby?: string | null;
    image_url_adult?: string | null;
    rarity?: PetRarity;
    is_exclusive?: boolean;
    price_coins?: number;
  };
  const baby = prod.image_url_baby ?? null;
  const adult = prod.image_url_adult ?? null;
  const stageLabel =
    table === "pet_life_stages"
      ? ((row as unknown as { kind?: string | null }).kind === "baby"
          ? "Filhote"
          : (row as unknown as { kind?: string | null }).kind === "adult"
            ? "Adulto"
            : null)
      : null;
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        !row.active && "opacity-60",
      )}
    >
      {isProduct ? (
        <div className="flex shrink-0 items-center gap-1">
          <ThumbWithLabel
            label="Filhote"
            src={baby ?? row.image_url}
            onClear={baby ? () => onClearImage(row, "image_url_baby") : undefined}
          />
          <ThumbWithLabel
            label="Adulto"
            src={adult ?? row.image_url}
            onClear={adult ? () => onClearImage(row, "image_url_adult") : undefined}
          />
        </div>
      ) : row.image_url ? (
        <div className="group/thumb relative h-14 w-14 shrink-0">
          <NonProductThumb src={row.image_url} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearImage(row, "image_url");
            }}
            title="Excluir imagem"
            className="absolute inset-0 grid place-items-center rounded-xl bg-destructive/80 text-destructive-foreground opacity-0 transition-opacity group-hover/thumb:opacity-100"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ImageIcon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{row.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
        {isProduct && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                PET_RARITY_COLOR[prod.rarity ?? "common"],
              )}
            >
              {PET_RARITY_LABEL[prod.rarity ?? "common"]}
            </span>
            {prod.is_exclusive && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                {prod.price_coins ?? 0} 🪙
              </span>
            )}
          </div>
        )}
        {stageLabel && (
          <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {stageLabel}
          </span>
        )}
        {table === "pet_benefits" && (
          <p className="text-[11px] text-muted-foreground">
            Escopo: {BENEFIT_SCOPE_LABEL[(row as PetBenefit).scope]}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => onEdit(row)} className="h-8 w-8 rounded-full">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onToggleActive(row, !row.active)}
          title={row.active ? "Ocultar de /meu-pet" : "Mostrar em /meu-pet"}
          className="h-8 w-8 rounded-full"
        >
          {row.active ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRemove(row)}
          className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function NonProductThumb({ src }: { src: string | null }) {
  const resolved = useSignedPetUrl(src);
  return (
    <img
      src={resolved ?? undefined}
      alt=""
      className="h-14 w-14 rounded-xl object-cover ring-1 ring-border"
    />
  );
}

function ThumbWithLabel({
  label,
  src,
  onClear,
}: {
  label: string;
  src: string | null;
  onClear?: () => void;
}) {
  const resolved = useSignedPetUrl(src);
  return (
    <div className="flex flex-col items-center gap-0.5">
      {resolved ? (
        <div className="group/thumb relative h-14 w-14">
          <img src={resolved} alt={label} className="h-14 w-14 rounded-xl object-contain bg-muted/50 ring-1 ring-border" />
          {onClear && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              title={`Excluir imagem (${label})`}
              className="absolute inset-0 grid place-items-center rounded-xl bg-destructive/80 text-destructive-foreground opacity-0 transition-opacity group-hover/thumb:opacity-100"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
        </div>
      )}
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

/* ============================== IMAGE PREVIEW ============================== */

function ImagePreview({
  value,
  busy,
  onPick,
  onClear,
  accept = "image/*",
}: {
  value: string | null;
  busy?: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [meta, setMeta] = useState<{ w: number; h: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const resolvedValue = useSignedPetUrl(value);
  useEffect(() => {
    if (!value) {
      setMeta(null);
      return;
    }
    const img = new Image();
    img.onload = () => setMeta({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = value;
  }, [value]);

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onPick(f);
        }}
        onClick={() => !value && ref.current?.click()}
        className={cn(
          "relative grid place-items-center overflow-hidden rounded-2xl border-2 border-dashed transition-all",
          "h-72 cursor-pointer",
          drag ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-foreground/30",
        )}
        style={{
          backgroundImage: value
            ? undefined
            : "linear-gradient(45deg,#0001 25%,transparent 25%,transparent 75%,#0001 75%),linear-gradient(45deg,#0001 25%,transparent 25%,transparent 75%,#0001 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0,10px 10px",
        }}
      >
        {value ? (
          <img
            src={resolvedValue ?? value}
            alt="preview"
            className="max-h-full max-w-full cursor-zoom-in object-contain p-3"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(true);
            }}
            title="Clique para abrir em tela cheia"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <p className="text-sm font-medium">Arraste uma imagem ou clique</p>
            <p className="text-[11px]">PNG, JPG, WEBP — preview em tamanho real</p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} className="rounded-full">
          <Upload className="mr-1 h-4 w-4" /> {value ? "Trocar" : "Enviar"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className="rounded-full text-destructive">
            <Trash2 className="mr-1 h-4 w-4" /> Remover
          </Button>
        )}
        {meta && (
          <span className="text-[11px] text-muted-foreground">
            {meta.w}×{meta.h}px
          </span>
        )}
      </div>
      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-[95vw] border-none bg-transparent p-0 shadow-none sm:max-w-[90vw]">
          <DialogTitle className="sr-only">Pré-visualização da imagem</DialogTitle>
          {value && (
            <div
              className="grid max-h-[90vh] min-h-[60vh] place-items-center overflow-auto rounded-2xl"
              style={{
                backgroundImage:
                  "linear-gradient(45deg,#0002 25%,transparent 25%,transparent 75%,#0002 75%),linear-gradient(45deg,#0002 25%,transparent 25%,transparent 75%,#0002 75%)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0,12px 12px",
                backgroundColor: "white",
              }}
            >
              <img src={resolvedValue ?? value} alt="preview ampliado" className="max-h-[90vh] max-w-full object-contain" />
            </div>
          )}
          {meta && (
            <p className="mt-2 text-center text-xs text-white/90">
              {meta.w}×{meta.h}px — clique fora para fechar
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================== PERK EFFECTS PANEL ============================== */

function PerkEffectsPanel() {
  const [rows, setRows] = useState<PetPerkEffect[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<PetPerkEffect | null>(null);
  const [draft, setDraft] = useState<Partial<PetPerkEffect> | null>(null);

  async function reload() {
    try {
      setRows(await listPerkEffects(false));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  function startCreate() {
    setEditing(null);
    setDraft({
      key: "",
      label: "",
      description: "",
      category: "cosmetic",
      numeric_param: false,
      default_param: null,
      needs_target: null,
      active: true,
      sort_order: rows.length * 10,
    });
  }

  function startEdit(r: PetPerkEffect) {
    setEditing(r);
    setDraft({ ...r });
  }

  async function save() {
    if (!draft?.key || !draft?.label) {
      toast.error("Chave e rótulo são obrigatórios");
      return;
    }
    setBusy(true);
    try {
      await upsertPerkEffect({
        key: draft.key,
        label: draft.label,
        description: draft.description ?? null,
        category: (draft.category as PetPerkEffectCategory) ?? "cosmetic",
        numeric_param: !!draft.numeric_param,
        default_param: draft.default_param ?? null,
        needs_target: draft.needs_target ?? null,
        active: draft.active ?? true,
        sort_order: draft.sort_order ?? 0,
      } as PetPerkEffect);
      toast.success(editing ? "Atualizado" : "Criado");
      setDraft(null);
      setEditing(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: PetPerkEffect) {
    if (!confirm(`Excluir "${r.label}"? Vantagens que usam este efeito perderão o vínculo.`)) return;
    try {
      await deletePerkEffect(r.key);
      toast.success("Removido");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Tipos de efeito</h2>
          <p className="text-xs text-muted-foreground">
            Crie regras reutilizáveis. Apenas chaves reconhecidas pelo backend produzem efeito; novas chaves ficam como
            tags informativas até serem ligadas via código.
          </p>
        </div>
        <Button size="sm" onClick={startCreate} disabled={!!draft} className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> Novo
        </Button>
      </div>

      {draft && (
        <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field icon={Hash} label="Chave técnica (key)">
              <Input
                value={draft.key ?? ""}
                disabled={!!editing}
                placeholder="ex: daily_coins_plus_5"
                onChange={(e) =>
                  setDraft({ ...draft, key: e.target.value.replace(/[^a-z0-9_]/g, "") })
                }
              />
            </Field>
            <Field icon={Tag} label="Rótulo">
              <Input
                value={draft.label ?? ""}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field icon={Pencil} label="Descrição">
                <Textarea
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </Field>
            </div>
            <Field icon={Layers} label="Categoria">
              <Select
                value={draft.category ?? "cosmetic"}
                onValueChange={(v) => setDraft({ ...draft, category: v as PetPerkEffectCategory })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PERK_CATEGORY_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field icon={Hash} label="Ordem">
              <Input
                type="text" inputMode="decimal"
                value={draft.sort_order ?? 0}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
              />
            </Field>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!draft.numeric_param}
                onCheckedChange={(v) => setDraft({ ...draft, numeric_param: v })}
              />
              <Label className="!m-0 text-sm">Aceita valor numérico</Label>
            </div>
            {draft.numeric_param && (
              <Field icon={Hash} label="Valor padrão">
                <Input
                  type="text" inputMode="decimal"
                  value={draft.default_param ?? 0}
                  onChange={(e) => setDraft({ ...draft, default_param: Number(e.target.value) || 0 })}
                />
              </Field>
            )}
            <Field icon={Star} label="Alvo (recurso desbloqueado)">
              <Select
                value={draft.needs_target ?? "__none__"}
                onValueChange={(v) =>
                  setDraft({ ...draft, needs_target: v === "__none__" ? null : (v as PetPerkEffect["needs_target"]) })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  <SelectItem value="avatar_decorations">Moldura/Aura</SelectItem>
                  <SelectItem value="profile_backgrounds">Fundo de perfil</SelectItem>
                  <SelectItem value="badges">Badge</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.active ?? true}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
              <Label className="!m-0 text-sm">Ativo</Label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft(null)} className="rounded-full">
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={busy} className="rounded-full">
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.key}
            className={cn(
              "rounded-2xl border border-border/70 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              !r.active && "opacity-60",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.label}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{r.key}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {PERK_CATEGORY_LABEL[r.category]} · {r.numeric_param ? `numérico (padrão ${r.default_param ?? "-"})` : "sem parâmetro"}
                  {r.needs_target ? ` · alvo: ${r.needs_target}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(r)} className="h-8 w-8 rounded-full">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void remove(r)}
                  className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
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
                type="text" inputMode="decimal"
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
                    type="text" inputMode="decimal"
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
                <ImagePreview
                  value={draft.image_url ?? null}
                  busy={busy}
                  onPick={(f) => void onFile(f)}
                  onClear={() => setDraft({ ...draft, image_url: null })}
                  accept="image/png,image/webp"
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

