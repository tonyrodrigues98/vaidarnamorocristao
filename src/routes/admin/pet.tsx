import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";

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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  BENEFIT_SCOPE_LABEL,
  PET_TABLE_LABEL,
  createRow,
  deleteRow,
  listAll,
  slugify,
  updateRow,
  uploadPetCatalogImage,
} from "@/lib/petCatalog";
import type {
  PetBenefit,
  PetBenefitScope,
  PetCatalogEntity,
  PetCatalogTable,
  PetCategory,
  PetSpecies,
  PetVariant,
} from "@/types/petCatalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/pet")({ component: PetAdminPage });

const TAB_ORDER: PetCatalogTable[] = [
  "pet_categories",
  "pet_species",
  "pet_variants",
  "pet_life_stages",
  "pet_personalities",
  "pet_benefits",
];

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
};

function PetAdminPage() {
  const { user, role, loading, rolesLoaded } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";
  const [tab, setTab] = useState<PetCatalogTable>("pet_categories");

  if (loading || (user && !rolesLoaded)) return null;
  if (!user) return <Navigate to="/auth/login" />;
  if (!isAdmin) return <Navigate to="/admin" />;

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      <Header />
      <AdminTopNav />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <h1 className="mb-4 font-serif text-2xl font-semibold">Catálogo de Pets</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Gerencie categorias, espécies, variações, fases, personalidades e benefícios.
          Tudo o que aparece no onboarding em /meu-pet vem desta tela.
        </p>

        <Tabs value={tab} onValueChange={(v) => setTab(v as PetCatalogTable)}>
          <TabsList className="mb-4 flex flex-wrap gap-2 bg-transparent">
            {TAB_ORDER.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="rounded-2xl border border-border/70 bg-white px-4 py-2 text-sm shadow-sm data-[state=active]:bg-[var(--petal)] data-[state=active]:text-[var(--rose)]"
              >
                {PET_TABLE_LABEL[t]}
              </TabsTrigger>
            ))}
          </TabsList>
          {TAB_ORDER.map((t) => (
            <TabsContent key={t} value={t}>
              <CatalogPanel table={t} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}

function CatalogPanel({ table }: { table: PetCatalogTable }) {
  const [rows, setRows] = useState<PetCatalogEntity[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<DraftRecord | null>(null);

  // Dependencies for select boxes
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [species, setSpecies] = useState<PetSpecies[]>([]);
  const [variants, setVariants] = useState<PetVariant[]>([]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{PET_TABLE_LABEL[table]}</h2>
        <Button size="sm" onClick={startCreate} disabled={creating || editingId !== null}>
          <Plus className="mr-1 h-4 w-4" /> Novo
        </Button>
      </div>

      {(creating || editingId) && draft && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nome</Label>
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
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={(draft.description as string) ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                value={(draft.sort_order as number) ?? 0}
                onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-3">
              <Switch
                checked={Boolean(draft.active)}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
              />
              <span className="text-sm">Ativo</span>
            </div>

            {table === "pet_species" && (
              <div className="sm:col-span-2">
                <Label>Categoria</Label>
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
              </div>
            )}

            {table === "pet_variants" && (
              <>
                <div>
                  <Label>Categoria</Label>
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
                </div>
                <div>
                  <Label>Espécie</Label>
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
                </div>
              </>
            )}

            {table === "pet_benefits" && (
              <>
                <div>
                  <Label>Escopo</Label>
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
                </div>
                {draft.scope && draft.scope !== "global" && (
                  <div>
                    <Label>Alvo</Label>
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
                  </div>
                )}
              </>
            )}

            <div className="sm:col-span-2">
              <Label>Imagem</Label>
              <div className="flex items-center gap-3">
                {draft.image_url ? (
                  <img
                    src={draft.image_url as string}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-dashed border-border" />
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
                >
                  <Upload className="mr-1 h-4 w-4" /> Enviar imagem
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancel}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={busy}>
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

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm",
              row.active ? "border-border" : "border-border/60 opacity-60",
            )}
          >
            {row.image_url ? (
              <img src={row.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.slug}</p>
              {table === "pet_benefits" && (
                <p className="text-[11px] text-muted-foreground">
                  Escopo: {BENEFIT_SCOPE_LABEL[(row as PetBenefit).scope]}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button size="sm" variant="outline" onClick={() => startEdit(row)}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void remove(row)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum registro. Clique em "Novo" para adicionar.
          </div>
        )}
      </div>
    </div>
  );
}
