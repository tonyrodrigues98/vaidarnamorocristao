import { useMemo, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  PawPrint,
  LayoutList,
  Compass,
  Image as ImageIcon,
  BookHeart,
  Map as MapIcon,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePetDayNight } from "@/lib/petDayNight";
import type { PetCareKind } from "@/types/petCare";
import type { UserPetV2Full } from "@/types/petCatalog";

import { RoomHotspot } from "./RoomHotspot";
import { StatsHUD } from "./StatsHUD";
import { MissionsTodayCard } from "./MissionsTodayCard";
import { PetStreakCard } from "./PetStreakCard";
import { PetSceneryPanel, type usePetScenery } from "./PetSceneryPanel";
import { PetDiaryBubble } from "./PetDiaryBubble";
import { PetDiarySheet } from "./PetDiarySheet";
import { PetKingdomMap } from "./PetKingdomMap";
import { PetConstellation } from "./PetConstellation";
import { getPetSizeScale } from "@/lib/petRealSize";

import sceneAsset from "@/assets/pet-room/pet-room-scene.png.asset.json";

type SceneryHook = ReturnType<typeof usePetScenery>;

type SheetKind = null | "missions" | "streak" | "scenery";

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
  onOpenProfile?: () => void;
  onCareChanged: () => void;
  onEvolved: () => void;
  babyImage: string | null;
  adultImage: string | null;
  /** Dias consecutivos de cuidado — para o tom do diário. */
  streakDays?: number;
  /** Missões diárias já fechadas — para o tom do diário. */
  missionsDoneToday?: number;
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
  onOpenProfile,
  onCareChanged,
  onEvolved,
  babyImage,
  adultImage,
  streakDays = 0,
  missionsDoneToday = 0,
}: Props) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryRefresh, setDiaryRefresh] = useState(0);
  const { dayOpacity } = usePetDayNight();
  // Zoom level Z1 (quarto) <-> Z2 (mapa) <-> Z3 (constelação). Persistidos.
  const initialZoom = (() => {
    if (typeof window === "undefined") return { level: "room" as const, constellation: false };
    const v = window.localStorage.getItem("pet:last-zoom") as
      | "room"
      | "kingdom"
      | "constellation"
      | null;
    if (v === "constellation") return { level: "kingdom" as const, constellation: true };
    if (v === "kingdom") return { level: "kingdom" as const, constellation: false };
    return { level: "room" as const, constellation: false };
  })();
  const [zoomLevel, setZoomLevel] = useState<"room" | "kingdom">(initialZoom.level);
  const [constellationOpen, setConstellationOpen] = useState(initialZoom.constellation);

  function persistZoom(value: "room" | "kingdom" | "constellation") {
    try {
      window.localStorage.setItem("pet:last-zoom", value);
    } catch {
      /* ignore */
    }
  }

  function goTo(level: "room" | "kingdom") {
    setZoomLevel(level);
    setConstellationOpen(false);
    persistZoom(level);
  }

  function openConstellation() {
    setConstellationOpen(true);
    persistZoom("constellation");
  }

  function closeConstellation() {
    setConstellationOpen(false);
    persistZoom("kingdom");
  }

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

  // Z2 — Mapa do Reino
  if (zoomLevel === "kingdom") {
    return (
      <>
        {constellationOpen ? (
          <div className="h-full w-full animate-[zoom-in-constellation_800ms_ease-out] motion-reduce:animate-none">
            <PetConstellation
              pet={pet}
              careValues={careValues}
              isAway={isAway}
              xpRefresh={xpRefresh}
              streakDays={streakDays}
              missionsDoneToday={missionsDoneToday}
              babyImage={babyImage}
              adultImage={adultImage}
              onCareChanged={onCareChanged}
              onEvolved={onEvolved}
              onBackToKingdom={closeConstellation}
            />
          </div>
        ) : (
          <div className="h-full w-full animate-[zoom-in-kingdom_700ms_ease-out] motion-reduce:animate-none">
            <PetKingdomMap
              pet={pet}
              petImage={petImage}
              careValues={careValues}
              isAway={isAway}
              xpRefresh={xpRefresh}
              streakDays={streakDays}
              missionsDoneToday={missionsDoneToday}
              babyImage={babyImage}
              adultImage={adultImage}
              onCareAction={onCareAction}
              onCareChanged={onCareChanged}
              onEvolved={onEvolved}
              onBackToRoom={() => goTo("room")}
              onOpenConstellation={openConstellation}
            />
          </div>
        )}
      </>
    );
  }

  // Tamanho do pet proporcional à vida real (porte do animal).
  const petSize = getPetSizeScale({
    categorySlug: pet.category?.slug ?? null,
    speciesSlug: pet.species?.slug ?? null,
    stage: pet.life_stage?.kind ?? null,
  });

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={300}>
      <section
        key="room"
        className="relative h-full w-full overflow-hidden bg-neutral-950"
        aria-label="Quarto do pet"
        style={{ animation: "zoom-in-room 600ms ease-out" }}
      >
        {/* Full-bleed: a cena preenche a viewport inteira (object-cover corta o excedente). */}
        <div className="relative h-full w-full">
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
                left: `${50 - petSize.widthPct / 2}%`,
                top: `${petSize.anchorYPct - petSize.widthPct * 0.9}%`,
                width: `${petSize.widthPct}%`,
                height: `${petSize.widthPct * 0.9}%`,
              }}
            >
              <img
                src={petImage}
                alt={pet.custom_name}
                draggable={false}
                className={cn(
                  "h-full w-full select-none object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]",
                  petState === "idle" &&
                    "animate-[pet-breathe_4s_ease-in-out_infinite] motion-reduce:animate-none",
                  petState === "sleeping" &&
                    "animate-[pet-sleep_5s_ease-in-out_infinite] motion-reduce:animate-none",
                  petState === "eating" &&
                    "animate-[pet-eat_1.2s_ease-in-out_infinite] motion-reduce:animate-none",
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
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3"
            style={{
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
              paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
              paddingRight: "max(0.75rem, env(safe-area-inset-right))",
            }}
          >
            <div className="pointer-events-auto rounded-full bg-white/85 px-3 py-1.5 text-sm font-semibold tracking-tight text-neutral-900 shadow-sm ring-1 ring-black/5 backdrop-blur">
              {pet.custom_name}
            </div>
            <div className="pointer-events-auto relative">
              <StatsHUD values={careValues} />
            </div>
            <div className="pointer-events-auto flex items-center gap-1.5">
              {onOpenProfile ? (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
                  aria-label="Perfil do pet"
                  title="Perfil · nome, visibilidade e XP"
                >
                  <User className="size-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => goTo("kingdom")}
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 shadow-sm ring-1 ring-amber-200/60 backdrop-blur transition hover:bg-white"
                aria-label="Ver o reino"
              >
                <MapIcon className="size-3.5" />
                Reino
              </button>
              <button
                type="button"
                onClick={onSwitchToList}
                className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
                aria-label="Ver modo lista"
              >
                <LayoutList className="size-3.5" />
              </button>
            </div>
          </div>

          {/* HOTSPOTS — pontos com glow no item + etiqueta visível.
            Coordenadas em % do quadro 2:3. */}
          <RoomHotspot
            x={13}
            y={54}
            radius={7}
            label="Streak"
            tooltip="Dia-a-dia · ver dias seguidos cuidando do pet."
            labelPlacement="bottom"
            onClick={() => setSheet("streak")}
          />
          <RoomHotspot
            x={13}
            y={70}
            radius={8}
            label="Missões"
            tooltip="Dia-a-dia · tarefas curtas pra ganhar XP e moedas hoje."
            labelPlacement="bottom"
            onClick={() => setSheet("missions")}
          />
          <RoomHotspot
            x={87}
            y={12}
            radius={7}
            label="Banho"
            tooltip="Cuidado · dar banho pra subir higiene."
            labelPlacement="bottom"
            urgent={lowOf("hygiene")}
            onClick={() => onCareAction("hygiene")}
          />
          <RoomHotspot
            x={86}
            y={62}
            radius={8}
            label="Dormir"
            tooltip="Cuidado · pet descansa e recupera energia."
            labelPlacement="left"
            urgent={lowOf("sleep")}
            onClick={() => onCareAction("sleep")}
          />
          <RoomHotspot
            x={17}
            y={91}
            radius={7}
            label="Alimentar"
            tooltip="Cuidado · alimentar pra subir fome."
            labelPlacement="top"
            urgent={lowOf("feed")}
            onClick={() => onCareAction("feed")}
          />
          <RoomHotspot
            x={63}
            y={93}
            radius={6}
            label="Brincar"
            tooltip="Cuidado · brincar pra subir diversão e carinho."
            labelPlacement="top"
            urgent={lowOf("play")}
            onClick={() => onCareAction("play")}
          />

          {/* Vida Autônoma — balão de pensamento do pet */}
          {!isAway ? (
            <PetDiaryBubble
              petId={pet.id}
              petName={pet.custom_name}
              personality={pet.personality?.slug ?? null}
              values={careValues}
              streak={streakDays}
              missionsDone={missionsDoneToday}
              onSaved={() => setDiaryRefresh((n) => n + 1)}
            />
          ) : null}

          {/* Toolbar diegética no rodapé — diário (dia-a-dia) e cenário do quarto */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-1.5 p-2.5"
            style={{
              paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))",
              paddingLeft: "max(0.625rem, env(safe-area-inset-left))",
              paddingRight: "max(0.625rem, env(safe-area-inset-right))",
            }}
          >
            <button
              type="button"
              onClick={() => setDiaryOpen(true)}
              title="Dia-a-dia · escrever no diário do pet"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 shadow-sm ring-1 ring-amber-200/60 backdrop-blur transition hover:bg-white"
            >
              <BookHeart className="size-3.5" /> Diário
            </button>
            <button
              type="button"
              onClick={() => setSheet("scenery")}
              title="Ambiente · trocar decoração do quarto"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
            >
              <ImageIcon className="size-3.5" /> Cenário
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
          open={sheet === "streak"}
          onClose={() => setSheet(null)}
          title="Streak diário"
          description="O calendário a giz marca cada dia."
        >
          <PetStreakCard refreshKey={xpRefresh} />
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

        <PetDiarySheet
          open={diaryOpen}
          onOpenChange={setDiaryOpen}
          petId={pet.id}
          refreshKey={diaryRefresh}
        />
      </section>
    </TooltipProvider>
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
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
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
