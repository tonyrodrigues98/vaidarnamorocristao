import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, PawPrint, Pencil, Sparkles } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createMyPetV2,
  getMyPetV2,
  listActive,
  listBenefitsFor,
  listSpeciesByCategory,
  listVariantsFor,
  updateMyPetV2,
} from "@/lib/petCatalog";
import type {
  PetBenefit,
  PetCategory,
  PetLifeStage,
  PetPersonality,
  PetSpecies,
  PetVariant,
  UserPetV2Full,
} from "@/types/petCatalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meu-pet")({ component: MeuPetPage });

type StepKey =
  | "category"
  | "species"
  | "variant"
  | "stage"
  | "name"
  | "personality"
  | "benefit"
  | "confirm";

type Selection = {
  category: PetCategory | null;
  species: PetSpecies | null;
  variant: PetVariant | null;
  stage: PetLifeStage | null;
  personality: PetPersonality | null;
  benefit: PetBenefit | null;
  name: string;
};

const EMPTY: Selection = {
  category: null,
  species: null,
  variant: null,
  stage: null,
  personality: null,
  benefit: null,
  name: "",
};

function resolvePetImage(sel: Selection): string | null {
  return (
    sel.variant?.image_url ||
    sel.species?.image_url ||
    sel.category?.image_url ||
    null
  );
}

function MeuPetPage() {
  const { user, loading } = useAuth();
  const [existing, setExisting] = useState<UserPetV2Full | null>(null);
  const [reloading, setReloading] = useState(true);
  const [wizard, setWizard] = useState(false);

  async function reload(uid: string) {
    setReloading(true);
    try {
      const me = await getMyPetV2(uid);
      setExisting(me);
      setWizard(!me);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReloading(false);
    }
  }

  useEffect(() => {
    if (user) void reload(user.id);
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-primary" />
          <h1 className="font-serif text-2xl font-semibold text-foreground">Meu pet</h1>
        </div>

        {reloading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : wizard ? (
          <Wizard
            onCancel={existing ? () => setWizard(false) : undefined}
            onDone={() => user && reload(user.id)}
          />
        ) : existing ? (
          <Showcase
            pet={existing}
            onChange={() => setWizard(true)}
            onUpdated={() => user && reload(user.id)}
          />
        ) : null}
      </main>
    </div>
  );
}

function Showcase({
  pet,
  onChange,
  onUpdated,
}: {
  pet: UserPetV2Full;
  onChange: () => void;
  onUpdated: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(pet.custom_name);
  const image =
    pet.variant?.image_url ||
    pet.species?.image_url ||
    pet.category?.image_url ||
    null;

  async function saveName() {
    try {
      await updateMyPetV2(pet.id, { custom_name: name.trim().slice(0, 30) || pet.custom_name });
      toast.success("Nome atualizado");
      setRenaming(false);
      onUpdated();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleVisibility() {
    const next = pet.visibility === "public" ? "private" : "public";
    try {
      await updateMyPetV2(pet.id, { visibility: next });
      toast.success(next === "public" ? "Pet visível no perfil" : "Pet apenas para você");
      onUpdated();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-stretch">
        <div className="flex h-56 w-56 shrink-0 items-center justify-center rounded-2xl bg-[#FFEFE7]">
          {image ? (
            <img src={image} alt={pet.custom_name} className="max-h-full max-w-full object-contain" />
          ) : (
            <PawPrint className="h-20 w-20 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {[pet.category?.name, pet.species?.name, pet.variant?.name].filter(Boolean).join(" • ")}
          </span>
          {renaming ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button size="sm" onClick={() => void saveName()}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="group inline-flex items-center gap-2 text-left"
            >
              <h2 className="font-serif text-2xl font-semibold">{pet.custom_name}</h2>
              <Pencil className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {pet.life_stage && (
              <span className="rounded-full bg-muted px-2 py-0.5">{pet.life_stage.name}</span>
            )}
            {pet.personality && (
              <span className="rounded-full bg-muted px-2 py-0.5">{pet.personality.name}</span>
            )}
            {pet.benefit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                <Sparkles className="h-3 w-3" /> {pet.benefit.name}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void toggleVisibility()}>
              {pet.visibility === "public" ? (
                <><Eye className="mr-1 h-4 w-4" /> Público</>
              ) : (
                <><EyeOff className="mr-1 h-4 w-4" /> Privado</>
              )}
            </Button>
            <Button size="sm" onClick={onChange}>
              Trocar pet
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Wizard({ onCancel, onDone }: { onCancel?: () => void; onDone: () => void }) {
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [step, setStep] = useState<StepKey>("category");
  const [busy, setBusy] = useState(false);

  // Catalog data per step
  const [categories, setCategories] = useState<PetCategory[]>([]);
  const [species, setSpecies] = useState<PetSpecies[]>([]);
  const [variants, setVariants] = useState<PetVariant[]>([]);
  const [stages, setStages] = useState<PetLifeStage[]>([]);
  const [personalities, setPersonalities] = useState<PetPersonality[]>([]);
  const [benefits, setBenefits] = useState<PetBenefit[]>([]);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [c, st, pe] = await Promise.all([
          listActive<PetCategory>("pet_categories"),
          listActive<PetLifeStage>("pet_life_stages"),
          listActive<PetPersonality>("pet_personalities"),
        ]);
        setCategories(c);
        setStages(st);
        setPersonalities(pe);
      } catch (e) {
        toast.error((e as Error).message);
      }
    })();
  }, []);

  // Load species when category chosen
  useEffect(() => {
    if (!sel.category) return;
    listSpeciesByCategory(sel.category.id).then(setSpecies).catch((e) => toast.error(e.message));
  }, [sel.category]);

  // Load variants when species or category chosen
  useEffect(() => {
    if (!sel.category) return;
    listVariantsFor(sel.category.id, sel.species?.id ?? null)
      .then(setVariants)
      .catch((e) => toast.error(e.message));
  }, [sel.category, sel.species]);

  // Load benefits when reaching benefit step
  useEffect(() => {
    if (step !== "benefit" || !sel.category) return;
    listBenefitsFor({
      categoryId: sel.category.id,
      speciesId: sel.species?.id ?? null,
      variantId: sel.variant?.id ?? null,
    })
      .then(setBenefits)
      .catch((e) => toast.error(e.message));
  }, [step, sel.category, sel.species, sel.variant]);

  const order: StepKey[] = useMemo(
    () => ["category", "species", "variant", "stage", "name", "personality", "benefit", "confirm"],
    [],
  );

  function nextOf(current: StepKey, override?: Partial<Selection>): StepKey {
    const merged = { ...sel, ...(override ?? {}) };
    const idx = order.indexOf(current);
    for (let i = idx + 1; i < order.length; i++) {
      const k = order[i];
      if (k === "species" && species.length === 0 && merged.category) continue;
      if (k === "variant" && variants.length === 0) continue;
      if (k === "benefit" && benefits.length === 0 && current === "personality") continue;
      return k;
    }
    return "confirm";
  }

  function go(next: StepKey) {
    setStep(next);
  }

  function back() {
    const idx = order.indexOf(step);
    for (let i = idx - 1; i >= 0; i--) {
      const k = order[i];
      if (k === "species" && species.length === 0) continue;
      if (k === "variant" && variants.length === 0) continue;
      if (k === "benefit" && benefits.length === 0) continue;
      setStep(k);
      return;
    }
  }

  async function finish() {
    if (!sel.category || !sel.stage || !sel.personality || !sel.name.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setBusy(true);
    try {
      await createMyPetV2({
        category_id: sel.category.id,
        species_id: sel.species?.id ?? null,
        variant_id: sel.variant?.id ?? null,
        life_stage_id: sel.stage.id,
        personality_id: sel.personality.id,
        benefit_id: sel.benefit?.id ?? null,
        custom_name: sel.name.trim().slice(0, 30),
        visibility: "public",
      });
      toast.success("Seu pet foi criado!");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function Grid<T extends { id: string; name: string; description: string | null; image_url: string | null }>({
    items,
    selectedId,
    onPick,
  }: {
    items: T[];
    selectedId?: string | null;
    onPick: (item: T) => void;
  }) {
    if (items.length === 0) {
      return (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nada disponível por aqui ainda.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onPick(it)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md",
              selectedId === it.id ? "border-primary ring-2 ring-primary/30" : "border-border",
            )}
          >
            <div className="flex h-24 w-full items-center justify-center rounded-xl bg-[#FFEFE7]">
              {it.image_url ? (
                <img src={it.image_url} alt={it.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <PawPrint className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="w-full truncate text-center text-sm font-semibold">{it.name}</p>
            {it.description && (
              <p className="line-clamp-2 w-full text-center text-[11px] text-muted-foreground">
                {it.description}
              </p>
            )}
          </button>
        ))}
      </div>
    );
  }

  const stepTitles: Record<StepKey, string> = {
    category: "Escolha a categoria",
    species: "Escolha a espécie",
    variant: "Escolha a variação",
    stage: "Em que fase está?",
    name: "Dê um nome",
    personality: "Qual a personalidade?",
    benefit: "Escolha um benefício",
    confirm: "Confirme seu pet",
  };

  const previewImage = resolvePetImage(sel);

  return (
    <section className="rounded-3xl border border-border bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Etapa {order.indexOf(step) + 1} de {order.length}
          </p>
          <h2 className="font-serif text-xl font-semibold">{stepTitles[step]}</h2>
        </div>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>

      {step === "category" && (
        <Grid
          items={categories}
          selectedId={sel.category?.id}
          onPick={(c) => {
            const next = { ...sel, category: c, species: null, variant: null };
            setSel(next);
            go(nextOf("category", next));
          }}
        />
      )}
      {step === "species" && (
        <Grid
          items={species}
          selectedId={sel.species?.id}
          onPick={(s) => {
            const next = { ...sel, species: s, variant: null };
            setSel(next);
            go(nextOf("species", next));
          }}
        />
      )}
      {step === "variant" && (
        <Grid
          items={variants}
          selectedId={sel.variant?.id}
          onPick={(v) => {
            const next = { ...sel, variant: v };
            setSel(next);
            go(nextOf("variant", next));
          }}
        />
      )}
      {step === "stage" && (
        <Grid
          items={stages}
          selectedId={sel.stage?.id}
          onPick={(s) => {
            const next = { ...sel, stage: s };
            setSel(next);
            go(nextOf("stage", next));
          }}
        />
      )}
      {step === "name" && (
        <div className="space-y-3">
          <Input
            autoFocus
            maxLength={30}
            placeholder="Como ele(a) se chama?"
            value={sel.name}
            onChange={(e) => setSel({ ...sel, name: e.target.value })}
          />
          <div className="flex justify-end">
            <Button
              disabled={!sel.name.trim()}
              onClick={() => go(nextOf("name"))}
            >
              Continuar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {step === "personality" && (
        <Grid
          items={personalities}
          selectedId={sel.personality?.id}
          onPick={(p) => {
            const next = { ...sel, personality: p };
            setSel(next);
            go(nextOf("personality", next));
          }}
        />
      )}
      {step === "benefit" && (
        <div className="space-y-3">
          <Grid
            items={benefits}
            selectedId={sel.benefit?.id}
            onPick={(b) => {
              const next = { ...sel, benefit: b };
              setSel(next);
              go("confirm");
            }}
          />
          {benefits.length > 0 && (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => go("confirm")}>
                Pular
              </Button>
            </div>
          )}
        </div>
      )}
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#FFEFE7] p-4 sm:flex-row">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white">
              {previewImage ? (
                <img src={previewImage} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <PawPrint className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-serif text-xl font-semibold">{sel.name || "Sem nome"}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {[sel.category?.name, sel.species?.name, sel.variant?.name].filter(Boolean).join(" • ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-xs">
                {sel.stage && <span className="rounded-full bg-white px-2 py-0.5">{sel.stage.name}</span>}
                {sel.personality && <span className="rounded-full bg-white px-2 py-0.5">{sel.personality.name}</span>}
                {sel.benefit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                    <Sparkles className="h-3 w-3" /> {sel.benefit.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button className="w-full" disabled={busy} onClick={() => void finish()}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
            Criar meu pet
          </Button>
        </div>
      )}

      {step !== "category" && (
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={back}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
        </div>
      )}
    </section>
  );
}