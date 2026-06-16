import { useMemo, useState, type ReactNode } from "react";
import { Link as RouterLink } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PawPrint, LayoutList, Compass, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePetDayNight } from "@/lib/petDayNight";
import type { PetCareKind } from "@/types/petCare";
import type { UserPetV2Full } from "@/types/petCatalog";

import { RoomHotspot } from "./RoomHotspot";
import { StatsHUD } from "./StatsHUD";
import { MissionsTodayCard } from "./MissionsTodayCard";
import { ExpeditionsCard } from "./ExpeditionsCard";
import { PetStreakCard } from "./PetStreakCard";
import { PetWeeklyChestCard } from "./PetWeeklyChestCard";
import { PetEvolutionCard } from "./PetEvolutionCard";
import { PetProgressionCard } from "./PetProgressionCard";
import { PetCaixasEntryCard } from "./grab/PetCaixasEntryCard";
import { PetCareHistorySheet } from "./PetCareHistorySheet";
import { PetSceneryPanel, type usePetScenery } from "./PetSceneryPanel";

import sceneAsset from "@/assets/pet-room/pet-room-scene.png.asset.json";

type SceneryHook = ReturnType<typeof usePetScenery>;

type SheetKind =
  | null
  | "missions"
  | "expeditions"
  | "caixas"
  | "streak"
  | "weekly"
  | "evolution"
  | "progression"
  | "scenery"
  | "history";

type Props = {
  pet: UserPetV2Full;
  petImage: string | null;
  careValues: Partial<Record<PetCareKind, number>>;
  isAway: boolean;
  awayLabel?: string;
  xpRefresh: number;
  scenery: SceneryHook;
  onCareAction: (k: PetCareKind) => void;
  onSwitchToList: () => void;
  onCareChanged: () => void;
  onEvolved: () => void;
  babyImage: string | null;
  adultImage: string | null;
};

/**
 * Cena única cinematográfica que substitui a pilha de cards.
 * Cada objeto da arte é um hotspot que abre o modal correspondente.
 */
export function PetLivingRoom({
  pet,
  petImage,
  careValues,
  isAway,
  awayLabel,
  xpRefresh,
  scenery,
  onCareAction,
  onSwitchToList,
  onCareChanged,
  onEvolved,
  babyImage,
  adultImage,
}: Props) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const { dayOpacity } = usePetDayNight();

  // Glow dourado nos hotspots de cuidado quando a stat estiver baixa.
  const lowOf = (k: PetCareKind) => (careValues[k] ?? 100) < 45;

  // Pet mood — estado visual simples
  const petState = useMemo<"idle" | "sleeping" | "eating">(() => {
    const sleep = careValues.sleep ?? 100;
    const feed = careValues.feed ?? 100;
    if (sleep < 25) return "sleeping";
    if (feed < 25) return "eating";
    return "idle";
  }, [careValues]);

  // Overlay diegético dia/noite: âmbar quente de manhã/tarde, azulado à noite.
  const nightAmount = 1 - dayOpacity;

  return (
    <section
      className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border border-neutral-200/80 bg-amber-50/40 shadow-[0_2px_0_rgba(0,0,0,0.02),0_30px_70px_-35px_rgba(0,0,0,0.18)]"
      aria-label="Quarto do pet"
    >
      {/* Aspect ratio fixo (2:3) para alinhar hotspots de forma estável. */}
      <div className="relative aspect-[2/3] w-full">
        {/* Fundo: a cena */}
        <img
          src={sceneAsset.url}
          alt=""
          aria-hidden
          loading="eager"
          className="absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
        />

        {/* Overlay de hora do dia */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `linear-gradient(180deg, rgba(30,58,138,${0.18 * nightAmount}) 0%, rgba(30,58,138,${0.32 * nightAmount}) 100%)`,
            mixBlendMode: "multiply",
          }}
        />

        {/* Pet sprite — usa o PNG real do usuário */}
        {petImage ? (
          <div
            className={cn(
              "pointer-events-none absolute z-10 flex items-end justify-center",
              isAway && "opacity-40 [filter:grayscale(1)_blur(3px)]",
            )}
            style={{
              left: "32%",
              top: "62%",
              width: "36%",
              height: "26%",
            }}
          >
            <img
              src={petImage}
              alt={pet.custom_name}
              draggable={false}
              className={cn(
                "h-full w-full select-none object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]",
                petState === "idle" && "animate-[pet-breathe_4s_ease-in-out_infinite] motion-reduce:animate-none",
                petState === "sleeping" && "animate-[pet-sleep_5s_ease-in-out_infinite] motion-reduce:animate-none",
                petState === "eating" && "animate-[pet-eat_1.2s_ease-in-out_infinite] motion-reduce:animate-none",
              )}
              style={{ transformOrigin: "50% 100%" }}
            />
          </div>
        ) : (
          <div
            className="pointer-events-none absolute z-10 flex items-center justify-center text-neutral-400"
            style={{ left: "35%", top: "70%", width: "30%", height: "20%" }}
          >
            <PawPrint className="size-12" />
          </div>
        )}

        {/* Selo "em expedição" sobre o pet */}
        {isAway && awayLabel ? (
          <div className="pointer-events-none absolute left-1/2 top-[62%] z-20 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-neutral-800 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <Compass className="mr-1 inline size-3.5 align-[-2px]" />
            {awayLabel}
          </div>
        ) : null}

        {/* HUD topo: nome + status + toggle modo lista */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3">
          <div className="pointer-events-auto rounded-full bg-white/85 px-3 py-1.5 text-sm font-semibold tracking-tight text-neutral-900 shadow-sm ring-1 ring-black/5 backdrop-blur">
            {pet.custom_name}
          </div>
          <div className="pointer-events-auto relative">
            <StatsHUD values={careValues} />
          </div>
          <button
            type="button"
            onClick={onSwitchToList}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
            aria-label="Ver modo lista"
          >
            <LayoutList className="size-3.5" />
          </button>
        </div>

        {/* HOTSPOTS — coordenadas estáveis em % */}
        {/* Esquerda */}
        <RoomHotspot
          x={2} y={2} width={20} height={11}
          label="Caixas (loja)"
          onClick={() => setSheet("caixas")}
        />
        <RoomHotspot
          x={1} y={15} width={24} height={11}
          label="Quiz Bíblico do dia"
          onClick={() => { window.location.assign("/quiz-biblico"); }}
        />
        <RoomHotspot
          x={2} y={33} width={24} height={13}
          label="Evolução do pet"
          onClick={() => setSheet("evolution")}
        />
        <RoomHotspot
          x={2} y={48} width={24} height={13}
          label="Streak diário"
          onClick={() => setSheet("streak")}
        />
        <RoomHotspot
          x={0} y={62} width={28} height={18}
          label="Missões do dia"
          onClick={() => setSheet("missions")}
        />

        {/* Direita */}
        <RoomHotspot
          x={75} y={6} width={24} height={13}
          label="Banho"
          urgent={lowOf("hygiene")}
          onClick={() => onCareAction("hygiene")}
        />
        <RoomHotspot
          x={77} y={24} width={23} height={28}
          label="Expedições"
          onClick={() => setSheet("expeditions")}
        />
        <RoomHotspot
          x={72} y={54} width={27} height={15}
          label="Dormir"
          urgent={lowOf("sleep")}
          onClick={() => onCareAction("sleep")}
        />
        <RoomHotspot
          x={75} y={70} width={25} height={20}
          label="Caixa semanal"
          onClick={() => setSheet("weekly")}
        />

        {/* Centro/baixo */}
        <RoomHotspot
          x={6} y={84} width={22} height={13}
          label="Alimentar"
          urgent={lowOf("feed")}
          onClick={() => onCareAction("feed")}
        />
        <RoomHotspot
          x={55} y={88} width={16} height={11}
          label="Brincar"
          urgent={lowOf("play")}
          onClick={() => onCareAction("play")}
        />

        {/* Toolbar diegética no rodapé — histórico, cenário, progressão */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 p-3">
          <button
            type="button"
            onClick={() => setSheet("history")}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
          >
            <PawPrint className="size-3.5" /> Histórico
          </button>
          <button
            type="button"
            onClick={() => setSheet("scenery")}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
          >
            <ImageIcon className="size-3.5" /> Cenário
          </button>
          <button
            type="button"
            onClick={() => setSheet("progression")}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
          >
            <PawPrint className="size-3.5" /> Progressão
          </button>
        </div>
      </div>

      {/* SHEETS — cada hotspot abre um sheet contendo o card existente */}
      <SceneSheet
        open={sheet === "missions"}
        onClose={() => setSheet(null)}
        title="Missões do dia"
        description="Caderno aberto sobre a escrivaninha."
      >
        <MissionsTodayCard refreshKey={xpRefresh} onCompletedChange={onCareChanged} />
      </SceneSheet>

      <SceneSheet
        open={sheet === "expeditions"}
        onClose={() => setSheet(null)}
        title="Floresta"
        description="A porta dá em uma expedição."
      >
        <ExpeditionsCard
          userPetId={pet.id}
          petImage={petImage}
          petName={pet.custom_name}
          onChanged={onCareChanged}
        />
      </SceneSheet>

      <SceneSheet
        open={sheet === "caixas"}
        onClose={() => setSheet(null)}
        title="Vitrine de caixas"
      >
        <PetCaixasEntryCard />
      </SceneSheet>

      <SceneSheet
        open={sheet === "streak"}
        onClose={() => setSheet(null)}
        title="Streak diário"
        description="O calendário a giz marca cada dia."
      >
        <PetStreakCard refreshKey={xpRefresh} />
      </SceneSheet>

      <SceneSheet
        open={sheet === "weekly"}
        onClose={() => setSheet(null)}
        title="Caixa semanal"
        description="As velas acendem a cada missão."
      >
        <PetWeeklyChestCard refreshKey={xpRefresh} onClaimed={onCareChanged} />
      </SceneSheet>

      <SceneSheet
        open={sheet === "evolution"}
        onClose={() => setSheet(null)}
        title="Evolução"
        description="O quadro mostra o caminho do pet."
      >
        <PetEvolutionCard
          refreshKey={xpRefresh}
          petName={pet.custom_name}
          babyImage={babyImage}
          adultImage={adultImage}
          onEvolved={onEvolved}
        />
      </SceneSheet>

      <SceneSheet
        open={sheet === "progression"}
        onClose={() => setSheet(null)}
        title="Progressão"
      >
        <PetProgressionCard refreshKey={xpRefresh} onChanged={onCareChanged} />
      </SceneSheet>

      <SceneSheet
        open={sheet === "scenery"}
        onClose={() => setSheet(null)}
        title="Cenário do quarto"
      >
        {pet.category?.id ? (
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
        ) : null}
      </SceneSheet>

      <PetCareHistorySheet open={sheet === "history"} onOpenChange={(o) => setSheet(o ? "history" : null)} />
    </section>
  );
}

function SceneSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}