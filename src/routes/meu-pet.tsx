import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  PawPrint,
  Pencil,
  Sparkles,
} from "lucide-react";

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
    <div className="min-h-screen bg-white text-neutral-900 antialiased [font-feature-settings:'ss01','cv11']">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-10">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            <span className="inline-block h-px w-6 bg-neutral-300" />
            Pet
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Meu pet
          </h1>
          <p className="mt-2 max-w-lg text-sm text-neutral-500">
            Um companheiro que aparece no seu perfil — escolha, dê um nome e ele cresce com você.
          </p>
        </header>

        {reloading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
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
    <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-30px_rgba(0,0,0,0.12)]">
      <div className="grid gap-0 sm:grid-cols-[260px_1fr]">
        {/* Visual */}
        <div className="relative flex items-center justify-center border-b border-neutral-100 bg-gradient-to-b from-neutral-50 to-white p-8 sm:border-b-0 sm:border-r">
          <div
            aria-hidden
            className="absolute inset-x-10 bottom-10 h-2 rounded-full bg-neutral-900/10 blur-2xl"
          />
          {image ? (
            <img
              src={image}
              alt={pet.custom_name}
              className="relative h-44 w-44 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)]"
            />
          ) : (
            <PawPrint className="h-20 w-20 text-neutral-300" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            <PawPrint className="h-3 w-3" aria-hidden />
            {[pet.category?.name, pet.species?.name, pet.variant?.name]
              .filter(Boolean)
              .join(" · ")}
          </div>

          {renaming ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-xl border-neutral-200 bg-white text-lg font-semibold focus-visible:ring-neutral-900/10"
              />
              <Button
                size="sm"
                onClick={() => void saveName()}
                className="h-10 rounded-xl bg-neutral-900 px-3 text-white hover:bg-neutral-800"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="group inline-flex items-center gap-2 text-left"
            >
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">
                {pet.custom_name}
              </h2>
              <Pencil className="h-4 w-4 text-neutral-400 opacity-0 transition group-hover:opacity-100" />
            </button>
          )}

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {pet.life_stage && (
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-medium text-neutral-600">
                {pet.life_stage.name}
              </span>
            )}
            {pet.personality && (
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 font-medium text-neutral-600">
                {pet.personality.name}
              </span>
            )}
            {pet.benefit && (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-900/10 bg-neutral-900 px-2.5 py-1 font-medium text-white">
                <Sparkles className="h-3 w-3" /> {pet.benefit.name}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void toggleVisibility()}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              {pet.visibility === "public" ? (
                <><Eye className="h-3.5 w-3.5" /> Público</>
              ) : (
                <><EyeOff className="h-3.5 w-3.5" /> Privado</>
              )}
            </button>
            <button
              type="button"
              onClick={onChange}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              Trocar pet
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
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
  const [speciesByCategory, setSpeciesByCategory] = useState<Record<string, PetSpecies[]>>({});
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
        // Pré-carrega espécies de todas as categorias para agrupar na 1ª tela.
        const grouped = await Promise.all(
          c.map(async (cat) => [cat.id, await listSpeciesByCategory(cat.id)] as const),
        );
        setSpeciesByCategory(Object.fromEntries(grouped));
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
    () => ["category", "variant", "stage", "name", "personality", "benefit", "confirm"],
    [],
  );

  function nextOf(current: StepKey, override?: Partial<Selection>): StepKey {
    const merged = { ...sel, ...(override ?? {}) };
    const idx = order.indexOf(current);
    for (let i = idx + 1; i < order.length; i++) {
      const k = order[i];
      // Only skip species/variant when we've already chosen the category AND
      // confirmed (after load) that there are no options. Don't skip just
      // because the async list hasn't arrived yet — that would race the user
      // past valid steps right after picking a category.
      if (k === "species" && current !== "category" && species.length === 0) continue;
      if (
        k === "variant" &&
        current !== "category" &&
        current !== "species" &&
        variants.length === 0
      )
        continue;
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
        <p className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
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
              "group relative flex flex-col items-center gap-2.5 rounded-2xl border bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.25)]",
              selectedId === it.id
                ? "border-neutral-900 ring-2 ring-neutral-900/10"
                : "border-neutral-200",
            )}
          >
            {selectedId === it.id && (
              <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm ring-2 ring-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-neutral-50 to-white">
              {it.image_url ? (
                <img
                  src={it.image_url}
                  alt={it.name}
                  className="h-[150%] w-[150%] object-contain object-center transition-transform duration-300 group-hover:scale-[1.08]"
                />
              ) : (
                <PawPrint className="h-10 w-10 text-neutral-300" />
              )}
            </div>
            <p className="w-full truncate text-center text-sm font-semibold text-neutral-900">
              {it.name}
            </p>
            {it.description && (
              <p className="line-clamp-2 w-full text-center text-[11px] text-neutral-500">
                {it.description}
              </p>
            )}
          </button>
        ))}
      </div>
    );
  }

  const stepTitles: Record<StepKey, string> = {
    category: "Escolha seu pet",
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
    <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-30px_rgba(0,0,0,0.12)] sm:p-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Etapa {order.indexOf(step) + 1} de {order.length}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
              {stepTitles[step]}
            </h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
            >
              Cancelar
            </button>
          )}
        </div>
        <div className="mt-4 h-px w-full overflow-hidden bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-all duration-500"
            style={{
              width: `${((order.indexOf(step) + 1) / order.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {step === "category" && (
        <GroupedSpeciesPicker
          categories={categories}
          speciesByCategory={speciesByCategory}
          selectedSpeciesId={sel.species?.id ?? null}
          selectedCategoryId={sel.category?.id ?? null}
          onPickSpecies={async (cat, s) => {
            const next = { ...sel, category: cat, species: s, variant: null };
            setSel(next);
            setSpecies(speciesByCategory[cat.id] ?? []);
            try {
              const va = await listVariantsFor(cat.id, s.id);
              setVariants(va);
              if (va.length > 0) go("variant");
              else go("stage");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
          onPickCategoryOnly={async (cat) => {
            const next = { ...sel, category: cat, species: null, variant: null };
            setSel(next);
            setSpecies([]);
            try {
              const va = await listVariantsFor(cat.id, null);
              setVariants(va);
              if (va.length > 0) go("variant");
              else go("stage");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}
      {step === "species" && (
        <Grid
          items={species}
          selectedId={sel.species?.id}
          onPick={async (s) => {
            const next = { ...sel, species: s, variant: null };
            setSel(next);
            try {
              const va = await listVariantsFor(sel.category!.id, s.id);
              setVariants(va);
              if (va.length > 0) go("variant");
              else go("stage");
            } catch (e) {
              toast.error((e as Error).message);
            }
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
        <div className="space-y-4">
          <Input
            autoFocus
            maxLength={30}
            placeholder="Como ele(a) se chama?"
            value={sel.name}
            onChange={(e) => setSel({ ...sel, name: e.target.value })}
            className="h-14 rounded-2xl border-neutral-200 bg-neutral-50 px-5 text-lg font-medium placeholder:text-neutral-400 focus-visible:bg-white focus-visible:ring-neutral-900/10"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">{sel.name.length}/30</span>
            <button
              type="button"
              disabled={!sel.name.trim()}
              onClick={() => go(nextOf("name"))}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
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
              <button
                type="button"
                onClick={() => go("confirm")}
                className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
              >
                Pular esta etapa
              </button>
            </div>
          )}
        </div>
      )}
      {step === "confirm" && (
        <div className="space-y-5">
          <div className="grid gap-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white sm:grid-cols-[160px_1fr]">
            <div className="relative flex items-center justify-center border-b border-neutral-100 bg-gradient-to-b from-neutral-50 to-white p-6 sm:border-b-0 sm:border-r">
              <div
                aria-hidden
                className="absolute inset-x-6 bottom-6 h-2 rounded-full bg-neutral-900/10 blur-xl"
              />
              {previewImage ? (
                <img
                  src={previewImage}
                  alt=""
                  className="relative h-28 w-28 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.12)]"
                />
              ) : (
                <PawPrint className="h-12 w-12 text-neutral-300" />
              )}
            </div>
            <div className="flex flex-col justify-center gap-2 p-5 text-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                {[sel.category?.name, sel.species?.name, sel.variant?.name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-neutral-950">
                {sel.name || "Sem nome"}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                {sel.stage && (
                  <span className="rounded-full border border-neutral-200 px-2.5 py-1 font-medium text-neutral-600">
                    {sel.stage.name}
                  </span>
                )}
                {sel.personality && (
                  <span className="rounded-full border border-neutral-200 px-2.5 py-1 font-medium text-neutral-600">
                    {sel.personality.name}
                  </span>
                )}
                {sel.benefit && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 font-medium text-white">
                    <Sparkles className="h-3 w-3" /> {sel.benefit.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void finish()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:bg-neutral-300"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Criar meu pet
          </button>
        </div>
      )}

      {step !== "category" && (
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>
        </div>
      )}
    </section>
  );
}