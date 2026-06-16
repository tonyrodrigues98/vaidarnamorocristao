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
  Lock,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createMyPetV2,
  listActive,
  resolvePetDisplayImage,
  listSpeciesByCategory,
  listVariantsFor,
  updateMyPetV2,
} from "@/lib/petCatalog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { myPetV2QueryOptions, petKeys } from "@/lib/petQueries";
import type {
  PetCategory,
  PetLifeStage,
  PetLifeStageKind,
  PetPersonality,
  PetSpecies,
  PetVariant,
  UserPetV2Full,
} from "@/types/petCatalog";
import { cn } from "@/lib/utils";
import { ADULT_PET_UNLOCK_COST, isAdultPetUnlocked, unlockAdultPetWithCoins } from "@/lib/petEvolution";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { PetBackgroundLayer, PetSceneryPanel, usePetScenery } from "@/components/pet/PetSceneryPanel";
import { usePetDayNight } from "@/lib/petDayNight";
import { PetNeedsHud } from "@/components/pet/PetNeedsHud";
import { PetBuffsHud } from "@/components/pet/PetBuffsHud";
import { PetRadialMenu, useLongPress } from "@/components/pet/PetRadialMenu";
import { PetCareActionSheet } from "@/components/pet/PetCareActionSheet";
import { PetMoodLine } from "@/components/pet/PetMoodLine";
import {
  deriveCurrentValue,
  getCareConfig,
  getPetRuntimeModifiers,
  listCareState,
} from "@/lib/petCare";
import {
  PET_CARE_ORDER,
  type PetCareConfig,
  type PetCareKind,
  type PetCareState,
  type PetRuntimeModifiers,
} from "@/types/petCare";
import { getPetMood } from "@/lib/petMood";
import { PetXpBar } from "@/components/pet/PetXpBar";
import { PetEffectsLayer } from "@/components/pet/PetEffectsLayer";
import { PetConfessionBubble } from "@/components/pet/PetConfessionBubble";
import { MissionsTodayCard } from "@/components/pet/MissionsTodayCard";
import { ExpeditionsCard } from "@/components/pet/ExpeditionsCard";
import { getActiveExpedition } from "@/lib/petExpeditions";
import type { ActiveExpedition } from "@/types/petExpedition";
import { PetOnboardingTour } from "@/components/pet/PetOnboardingTour";
import { PetShowcaseSkeleton } from "@/components/pet/PetShowcaseSkeleton";
import { PetStreakCard } from "@/components/pet/PetStreakCard";
import { PetWeeklyChestCard } from "@/components/pet/PetWeeklyChestCard";
import { PetProgressionCard } from "@/components/pet/PetProgressionCard";
import { PetEvolutionCard } from "@/components/pet/PetEvolutionCard";
import {
  PetRandomEventModal,
  type PetRandomEventPayload,
} from "@/components/pet/PetRandomEventModal";
import { Link as RouterLink } from "@tanstack/react-router";
import { BookOpen, Clock, MessageCircle, Compass } from "lucide-react";
import { PetCareHistorySheet } from "@/components/pet/PetCareHistorySheet";

export const Route = createFileRoute("/meu-pet")({ component: MeuPetPage });

/**
 * Renderiza a arte do pet com um filtro noturno suave quando o cenário
 * tem dia/noite e estamos no período noturno (cross-fade de 30min).
 */
function PetArtwork({
  src,
  alt,
  hasBackground,
}: {
  src: string;
  alt: string;
  hasBackground: boolean;
}) {
  const { dayOpacity } = usePetDayNight();
  // Aplica o tom noturno só quando há cenário equipado.
  const nightAmount = hasBackground ? 1 - dayOpacity : 0;
  const brightness = 1 - 0.45 * nightAmount; // até 0.55
  const saturate = 1 - 0.35 * nightAmount;
  const blueTint = 0.18 * nightAmount;
  return (
    <div className="relative h-44 w-44">
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)]"
        style={{
          filter: `brightness(${brightness}) saturate(${saturate})`,
          transition: "filter 600ms ease-in-out",
        }}
      />
      {/* Overlay azulado mascarado pela própria silhueta do pet */}
      <div
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          backgroundColor: `rgba(30, 58, 138, ${blueTint})`,
          mixBlendMode: "multiply",
          opacity: nightAmount,
          transition: "opacity 600ms ease-in-out",
        }}
      />
    </div>
  );
}

type StepKey =
  | "category"
  | "type"
  | "stage"
  | "name"
  | "personality"
  | "confirm";

type Selection = {
  category: PetCategory | null;
  species: PetSpecies | null;
  variant: PetVariant | null;
  stage: PetLifeStage | null;
  personality: PetPersonality | null;
  name: string;
};

const EMPTY: Selection = {
  category: null,
  species: null,
  variant: null,
  stage: null,
  personality: null,
  name: "",
};

function resolvePetImage(sel: Selection): string | null {
  const stageKind = sel.stage?.kind ?? null;
  return (
    resolvePetDisplayImage(sel.variant, stageKind) ||
    resolvePetDisplayImage(sel.species, stageKind) ||
    sel.category?.image_url ||
    null
  );
}

function MeuPetPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const petQuery = useQuery(myPetV2QueryOptions(user?.id));
  const existing = petQuery.data ?? null;
  const [wizardOverride, setWizardOverride] = useState<boolean | null>(null);
  const wizard = wizardOverride ?? (petQuery.isSuccess && !existing);
  // Mostra spinner apenas quando realmente não há nada em cache.
  const reloading = petQuery.isLoading && !petQuery.data;

  const reload = () => {
    if (!user) return;
    setWizardOverride(null);
    void queryClient.invalidateQueries({ queryKey: petKeys.myV2(user.id) });
  };

  useEffect(() => {
    if (petQuery.error) toast.error((petQuery.error as Error).message);
  }, [petQuery.error]);

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
          <PetShowcaseSkeleton />
        ) : wizard ? (
          <Wizard
            onCancel={existing ? () => setWizardOverride(false) : undefined}
            onDone={reload}
          />
        ) : existing ? (
          <Showcase
            pet={existing}
            onChange={() => setWizardOverride(true)}
            onUpdated={reload}
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
  const stageKind = pet.life_stage?.kind ?? null;
  const image =
    resolvePetDisplayImage(pet.variant, stageKind) ||
    resolvePetDisplayImage(pet.species, stageKind) ||
    pet.category?.image_url ||
    null;
  const scenery = usePetScenery({
    categoryId: pet.category?.id ?? "",
    speciesId: pet.species?.id ?? null,
  });

  // ----- Central de Ações: estado + valores derivados -----
  const [careConfig, setCareConfig] = useState<PetCareConfig | null>(null);
  const [careStates, setCareStates] = useState<PetCareState[]>([]);
  const [runtimeMods, setRuntimeMods] = useState<PetRuntimeModifiers | null>(null);
  const [tick, setTick] = useState(0);
  const [radialOpen, setRadialOpen] = useState(false);
  const [actionKind, setActionKind] = useState<PetCareKind | null>(null);
  const [confessionTrigger, setConfessionTrigger] = useState(0);
  const [xpRefresh, setXpRefresh] = useState(0);
  const [randomEvent, setRandomEvent] = useState<PetRandomEventPayload | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeExpedition, setActiveExpedition] = useState<ActiveExpedition | null>(null);

  async function reloadActiveExpedition() {
    try {
      const a = await getActiveExpedition(pet.id);
      setActiveExpedition(a);
    } catch {
      // silencioso
    }
  }

  const isAway = !!activeExpedition && new Date(activeExpedition.ends_at).getTime() > Date.now();
  const awayRemaining = useMemo(() => {
    if (!activeExpedition) return "";
    const ms = new Date(activeExpedition.ends_at).getTime() - Date.now();
    if (ms <= 0) return "Concluindo…";
    const totalMin = Math.ceil(ms / 60_000);
    if (totalMin < 60) return `${totalMin} min`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExpedition, tick]);

  function requestAction(k: PetCareKind) {
    if (isAway) {
      toast.info(`${pet.custom_name} está em expedição. Volta em ${awayRemaining}.`);
      return;
    }
    setActionKind(k);
  }

  function openRadial() {
    if (isAway) {
      toast.info(`${pet.custom_name} está em expedição. Volta em ${awayRemaining}.`);
      return;
    }
    setRadialOpen(true);
  }

  async function reloadCare() {
    try {
      const [cfg, rows, mods] = await Promise.all([
        getCareConfig(),
        listCareState(pet.id),
        getPetRuntimeModifiers(pet.id),
      ]);
      setCareConfig(cfg);
      setCareStates(rows);
      setRuntimeMods(mods);
    } catch (e) {
      // silencioso — UI degrada para valores padrão
    }
  }

  useEffect(() => {
    void reloadCare();
    void reloadActiveExpedition();
    // As barras caem ~2 pts/h: re-render a cada 1s desperdiça CPU.
    // 5s já dá fluidez visual e reduz ~80% dos renders.
    const t = setInterval(() => setTick((n) => n + 1), 5_000);
    // Expedição: poll mais lento (30s) — só precisa virar quando terminar.
    const e = setInterval(() => void reloadActiveExpedition(), 30_000);
    // a cada 60s, recarrega modificadores (buffs expiram, condicionais mudam)
    const m = setInterval(
      () => void getPetRuntimeModifiers(pet.id).then((mm) => mm && setRuntimeMods(mm)),
      60_000,
    );
    // Pausa o tick quando a aba está oculta — economiza bateria.
    function onVis() {
      if (document.visibilityState === "visible") {
        void reloadCare();
        void reloadActiveExpedition();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      clearInterval(e);
      clearInterval(m);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet.id]);

  const careValues = useMemo(() => {
    const cfg = careConfig ?? { id: 1, decay_per_hour: 2, energy_regen_minutes_per_point: 6 };
    const map = {} as Record<PetCareKind, number>;
    const byKind = new Map(careStates.map((s) => [s.kind, s]));
    for (const k of PET_CARE_ORDER) {
      map[k] = deriveCurrentValue(byKind.get(k), cfg, k, runtimeMods);
    }
    return map;
    // tick força recálculo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careStates, careConfig, runtimeMods, tick]);

  const mood = useMemo(() => getPetMood(careValues, pet.id), [careValues, pet.id]);

  const longPress = useLongPress(() => setRadialOpen(true), 350);

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
    <div className="space-y-4">
    <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-30px_rgba(0,0,0,0.12)]">
      {/* HUD full-width no desktop para barras legíveis */}
      <div className="hidden border-b border-neutral-100 bg-neutral-50/60 p-4 sm:block">
        <PetMoodLine name={pet.custom_name} mood={mood} />
        <PetNeedsHud values={careValues} onPick={requestAction} />
        <PetBuffsHud mods={runtimeMods} className="mt-3" />
      </div>
      <div className="grid gap-0 sm:grid-cols-[260px_1fr]">
        {/* Visual */}
        <div className="relative flex flex-col items-stretch justify-center overflow-hidden border-b border-neutral-100 bg-gradient-to-b from-neutral-50 to-white pt-4 sm:border-b-0 sm:border-r sm:pt-6">
          {/* HUD compacto apenas no mobile */}
          <div className="relative z-20 mb-3 px-4 sm:hidden">
            <PetMoodLine name={pet.custom_name} mood={mood} className="mb-2" />
            <PetNeedsHud values={careValues} onPick={requestAction} />
            <PetBuffsHud mods={runtimeMods} className="mt-2" />
          </div>
          <div className="relative flex min-h-[240px] flex-1 items-center justify-center">
          <PetBackgroundLayer background={scenery.equipped} />
          <div
            aria-hidden
            className="absolute inset-x-10 bottom-10 h-2 rounded-full bg-neutral-900/10 blur-2xl"
          />
          <button
            type="button"
            {...(isAway ? {} : longPress)}
            onContextMenu={(e) => {
              e.preventDefault();
              openRadial();
            }}
            onDoubleClick={() => openRadial()}
            className={`relative z-10 cursor-pointer select-none touch-none rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 ${
              isAway ? "pointer-events-none" : ""
            }`}
            aria-label={isAway ? "Pet em expedição" : "Segure para abrir a central de ações"}
            aria-disabled={isAway}
          >
            <div
              className={
                isAway
                  ? "transition duration-500 [filter:grayscale(1)_blur(2px)_brightness(0.85)]"
                  : ""
              }
            >
              {image ? (
                <PetArtwork src={image} alt={pet.custom_name} hasBackground={!!scenery.equipped} />
              ) : (
                <PawPrint className="h-20 w-20 text-neutral-300" />
              )}
            </div>
          </button>
          {isAway && activeExpedition ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4">
              <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-2xl border border-neutral-900/10 bg-white/95 px-4 py-2.5 text-center shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
                  <Compass className="size-3.5" />
                  Em expedição
                </div>
                <div className="line-clamp-1 text-xs font-medium text-neutral-900">
                  {activeExpedition.title}
                </div>
                <div className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                  <Clock className="size-3" />
                  Volta em {awayRemaining}
                </div>
              </div>
            </div>
          ) : null}
          <PetRadialMenu
            open={radialOpen}
            values={careValues}
            onClose={() => setRadialOpen(false)}
            onPick={(k) => {
              setRadialOpen(false);
              requestAction(k);
            }}
          />
          <PetEffectsLayer
            hygiene={careValues.hygiene ?? 100}
            happiness={careValues.play ?? 100}
            affection={careValues.affection ?? 100}
            nocturnal={(pet.species as { nocturnal?: boolean } | null)?.nocturnal ?? false}
          />
          <PetConfessionBubble
            triggerKey={confessionTrigger}
            personalitySlug={pet.personality?.slug ?? null}
          />
          </div>
          <div className="relative z-10 mt-2 flex items-center justify-center gap-3 px-4 pb-4 sm:pb-6">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400">
              Segure no pet para abrir as ações
            </p>
            <button
              type="button"
              onClick={() => setConfessionTrigger((n) => n + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-500 transition hover:border-sky-300 hover:text-sky-600"
              aria-label="O que meu pet está pensando?"
            >
              <MessageCircle className="size-3" />
              Pensamento
            </button>
          </div>
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
      {/* Barra de XP — full-width dentro do bloco do pet */}
      <div className="border-t border-neutral-100 bg-white p-3 sm:p-4">
        <PetXpBar refreshKey={xpRefresh} />
      </div>
    </section>
    <MissionsTodayCard refreshKey={xpRefresh} />
    <ExpeditionsCard userPetId={pet.id} onChanged={() => { setXpRefresh((n) => n + 1); void reloadCare(); }} />
    <PetStreakCard refreshKey={xpRefresh} />
    <PetWeeklyChestCard refreshKey={xpRefresh} onClaimed={() => setXpRefresh((n) => n + 1)} />
    <PetEvolutionCard
      refreshKey={xpRefresh}
      petName={pet.custom_name}
      babyImage={
        resolvePetDisplayImage(pet.variant, "baby") ||
        resolvePetDisplayImage(pet.species, "baby") ||
        null
      }
      adultImage={
        resolvePetDisplayImage(pet.variant, "adult") ||
        resolvePetDisplayImage(pet.species, "adult") ||
        null
      }
      onEvolved={() => {
        setXpRefresh((n) => n + 1);
        onUpdated();
      }}
    />
    <PetProgressionCard refreshKey={xpRefresh} onChanged={() => setXpRefresh((n) => n + 1)} />
    <button
      type="button"
      onClick={() => setHistoryOpen(true)}
      className="group flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:shadow-sm"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
        <Clock className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-neutral-900">
          Histórico de cuidado
        </div>
        <div className="text-[12px] text-neutral-500">
          Veja as ações dos últimos 7 dias, filtradas por dia
        </div>
      </div>
      <ArrowRight className="size-4 text-neutral-300 transition group-hover:text-neutral-500" />
    </button>
    <PetCareHistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
    <PetOnboardingTour />
    <RouterLink
      to="/quiz-biblico"
      className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        <BookOpen className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-neutral-900">Quiz Bíblico do dia</div>
        <div className="text-[12px] text-neutral-500">
          3 perguntas · até +30 XP e +15 moedas
        </div>
      </div>
      <ArrowRight className="size-4 text-neutral-300 transition group-hover:text-sky-500" />
    </RouterLink>
    {pet.category?.id && (
      <PetSceneryPanel
        categoryId={pet.category.id}
        speciesId={pet.species?.id ?? null}
        list={scenery.list}
        unlocks={scenery.unlocks}
        equipped={scenery.equipped}
        level={scenery.level}
        loading={scenery.loading}
        onChanged={scenery.reload}
      />
    )}
    {pet.category?.id && (
      <PetCareActionSheet
        open={actionKind !== null}
        kind={actionKind}
        userPetId={pet.id}
        categoryId={pet.category.id}
        speciesId={pet.species?.id ?? null}
        currentValue={actionKind ? careValues[actionKind] ?? 0 : 0}
        onClose={() => setActionKind(null)}
          onApplied={() => {
            void reloadCare();
            setXpRefresh((n) => n + 1);
          }}
          onRandomEvent={(ev) => setRandomEvent(ev)}
      />
    )}
    <PetRandomEventModal event={randomEvent} onClose={() => setRandomEvent(null)} />
    </div>
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
  const [adultUnlocked, setAdultUnlocked] = useState<boolean | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [c, st, pe, unlocked] = await Promise.all([
          listActive<PetCategory>("pet_categories"),
          listActive<PetLifeStage>("pet_life_stages"),
          listActive<PetPersonality>("pet_personalities"),
          isAdultPetUnlocked(),
        ]);
        setCategories(c);
        setAdultUnlocked(unlocked);
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

  const order: StepKey[] = useMemo(
    () => ["category", "stage", "personality", "name", "type", "confirm"],
    [],
  );

  async function handleUnlockAdult() {
    if (unlockBusy) return;
    if (!window.confirm(`Desbloquear pet adulto por ${ADULT_PET_UNLOCK_COST} moedas?`)) return;
    setUnlockBusy(true);
    try {
      const res = await unlockAdultPetWithCoins();
      if (res.ok) {
        setAdultUnlocked(true);
        toast.success("Pet adulto desbloqueado!");
      } else if (res.reason === "insufficient_coins") {
        toast.error(`Moedas insuficientes (você tem ${res.balance ?? 0}).`);
      } else {
        toast.error("Não foi possível desbloquear agora.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUnlockBusy(false);
    }
  }

  function nextOf(current: StepKey, override?: Partial<Selection>): StepKey {
    const merged = { ...sel, ...(override ?? {}) };
    const idx = order.indexOf(current);
    for (let i = idx + 1; i < order.length; i++) {
      const k = order[i];
      if (k === "type" && variants.length === 0 && species.length === 0) continue;
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
      if (k === "type" && variants.length === 0 && species.length === 0) continue;
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
        // Benefício é atrelado à espécie/variação no admin — derivado automaticamente.
        benefit_id:
          sel.variant?.benefit_id ?? sel.species?.benefit_id ?? null,
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

  function StageAwareGrid<
    T extends {
      id: string;
      name: string;
      description: string | null;
      image_url: string | null;
      image_url_baby?: string | null;
      image_url_adult?: string | null;
    },
  >({
    items,
    stageKind,
    selectedId,
    onPick,
  }: {
    items: T[];
    stageKind: PetLifeStageKind;
    selectedId?: string | null;
    onPick: (item: T) => void;
  }) {
    const mapped = items.map((it) => ({
      ...it,
      image_url:
        (stageKind === "baby" ? it.image_url_baby : it.image_url_adult) ??
        it.image_url_adult ??
        it.image_url_baby ??
        it.image_url,
    }));
    return <Grid items={mapped} selectedId={selectedId} onPick={(picked) => {
      // find original (with both image fields preserved)
      const orig = items.find((x) => x.id === picked.id) ?? picked;
      onPick(orig);
    }} />;
  }

  const stepTitles: Record<StepKey, string> = {
    category: "Escolha a categoria",
    type: "Escolha o tipo",
    stage: "Em que fase está?",
    name: "Dê um nome",
    personality: "Qual a personalidade?",
    confirm: "Confirme seu pet",
  };

  const previewImage = resolvePetImage(sel);

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-30px_rgba(0,0,0,0.12)] sm:p-8">
      {/* Banner agora aparece só dentro do passo "stage", ao lado das opções */}
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
        <Grid
          items={categories}
          selectedId={sel.category?.id}
          onPick={async (c) => {
            const next = { ...sel, category: c, species: null, variant: null };
            setSel(next);
            try {
              const [sp, va] = await Promise.all([
                listSpeciesByCategory(c.id),
                listVariantsFor(c.id, null),
              ]);
              setSpecies(sp);
              setVariants(va);
              go("stage");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}
      {step === "type" && (
        variants.length > 0 ? (
          <StageAwareGrid
            items={variants}
            stageKind={sel.stage?.kind ?? null}
            selectedId={sel.variant?.id}
            onPick={(v) => {
              const next = { ...sel, variant: v, species: null };
              setSel(next);
              go("confirm");
            }}
          />
        ) : (
          <StageAwareGrid
            items={species}
            stageKind={sel.stage?.kind ?? null}
            selectedId={sel.species?.id}
            onPick={(s) => {
              const next = { ...sel, species: s, variant: null };
              setSel(next);
              go("confirm");
            }}
          />
        )
      )}
      {step === "stage" && (
        <div className="space-y-4">
          {stages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
              Nada disponível por aqui ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stages.map((s) => {
                const isAdult = s.kind === "adult";
                const locked = isAdult && adultUnlocked === false;
                const selected = sel.stage?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={unlockBusy}
                    onClick={() => {
                      if (locked) {
                        void handleUnlockAdult();
                        return;
                      }
                      const next = { ...sel, stage: s };
                      setSel(next);
                      go(nextOf("stage", next));
                    }}
                    className={cn(
                      "group relative flex flex-col items-center gap-2.5 rounded-2xl border bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.25)]",
                      selected
                        ? "border-neutral-900 ring-2 ring-neutral-900/10"
                        : "border-neutral-200",
                    )}
                  >
                    {selected && !locked && (
                      <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm ring-2 ring-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-neutral-50 to-white">
                      {s.image_url ? (
                        <img
                          src={s.image_url}
                          alt={s.name}
                          className={cn(
                            "h-[150%] w-[150%] object-contain object-center transition-transform duration-300 group-hover:scale-[1.08]",
                            locked && "grayscale blur-[2px] opacity-70",
                          )}
                        />
                      ) : (
                        <PawPrint className={cn("h-10 w-10 text-neutral-300", locked && "grayscale")} />
                      )}
                      {locked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/30 backdrop-blur-[1px]">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900/90 text-white shadow-md">
                            <Lock className="h-4 w-4" />
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow-sm">
                            <CoinIcon className="h-3.5 w-3.5" />
                            {ADULT_PET_UNLOCK_COST}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="w-full truncate text-center text-sm font-semibold text-neutral-900">
                      {s.name}
                    </p>
                    {s.description && (
                      <p className="line-clamp-2 w-full text-center text-[11px] text-neutral-500">
                        {s.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {adultUnlocked === false && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div className="space-y-1.5 text-[12px] leading-relaxed text-amber-900">
                <p>
                  Seu <strong>primeiro pet</strong> nasce filhote: você acompanha o crescimento,
                  sobe de nível com ele e, quando ele cresce, o adulto fica liberado pros próximos pets.
                </p>
                <p>
                  Quer pular essa fase agora? Desbloqueie o adulto por{" "}
                  <span className="inline-flex items-center gap-0.5 align-middle">
                    <CoinIcon className="h-3 w-3" />
                    <strong>{ADULT_PET_UNLOCK_COST} moedas</strong>
                  </span>{" "}
                  tocando no cadeado.
                </p>
              </div>
            </div>
          )}
        </div>
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
