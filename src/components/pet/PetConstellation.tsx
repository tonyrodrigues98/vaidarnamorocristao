import { useMemo, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ArrowDownLeft } from "lucide-react";
import skyAsset from "@/assets/pet-kingdom/constellation-sky.png.asset.json";
import type { PetCareKind } from "@/types/petCare";
import type { UserPetV2Full } from "@/types/petCatalog";
import { loadDiaryLog } from "@/lib/petDiary";

import { MissionsTodayCard } from "./MissionsTodayCard";
import { ExpeditionsCard } from "./ExpeditionsCard";
import { PetEvolutionCard } from "./PetEvolutionCard";
import { PetStreakCard } from "./PetStreakCard";
import { PetDiarySheet } from "./PetDiarySheet";
import { PetCareHistorySheet } from "./PetCareHistorySheet";

type StarId = "diary" | "missions" | "streak" | "expedition" | "evolution" | "care";

type StarDef = {
  id: StarId;
  label: string;
  /** Posição em % do container 2:3 */
  x: number;
  y: number;
  /** raio base da estrela em % do width */
  r: number;
};

const STARS: StarDef[] = [
  { id: "diary", label: "Estrela do Diário", x: 22, y: 22, r: 2.2 },
  { id: "missions", label: "Estrela das Missões", x: 72, y: 28, r: 2.4 },
  { id: "streak", label: "Estrela do Streak", x: 50, y: 46, r: 3.2 }, // hub
  { id: "expedition", label: "Estrela das Expedições", x: 18, y: 56, r: 2.2 },
  { id: "evolution", label: "Estrela da Evolução", x: 80, y: 60, r: 2.2 },
  { id: "care", label: "Estrela do Cuidado", x: 46, y: 76, r: 2.4 },
];

// Linhas finas conectando as estrelas (hub-and-spoke).
const LINES: [StarId, StarId][] = [
  ["diary", "streak"],
  ["missions", "streak"],
  ["streak", "expedition"],
  ["streak", "evolution"],
  ["streak", "care"],
];

type Props = {
  pet: UserPetV2Full;
  careValues: Partial<Record<PetCareKind, number>>;
  isAway: boolean;
  xpRefresh: number;
  streakDays: number;
  missionsDoneToday: number;
  babyImage: string | null;
  adultImage: string | null;
  onCareChanged: () => void;
  onEvolved: () => void;
  onBackToKingdom: () => void;
};

type SheetKind = null | "diary" | "missions" | "streak" | "expedition" | "evolution" | "care";

/**
 * Constelação (Z3) — zoom-in cinematográfico do mapa pro céu.
 * 6 estrelas conectadas representam os pilares do progresso do usuário.
 * Cada estrela pulsa conforme pendências reais (diário, missões, streak,
 * expedição em curso, evolução, cuidado).
 */
export function PetConstellation({
  pet,
  careValues,
  isAway,
  xpRefresh,
  streakDays,
  missionsDoneToday,
  babyImage,
  adultImage,
  onCareChanged,
  onEvolved,
  onBackToKingdom,
}: Props) {
  const [sheet, setSheet] = useState<SheetKind>(null);

  // Pendências reais — intensidade do brilho de cada estrela (0 / 1 / 2).
  const attention = useMemo<Record<StarId, 0 | 1 | 2>>(() => {
    const diaryLog = loadDiaryLog(pet.id);
    const todayCount = diaryLog.filter(
      (e) => new Date(e.savedAt).toDateString() === new Date().toDateString(),
    ).length;
    const lowestCare = Math.min(
      careValues.feed ?? 100,
      careValues.sleep ?? 100,
      careValues.hygiene ?? 100,
      careValues.play ?? 100,
      careValues.affection ?? 100,
    );
    return {
      diary: todayCount === 0 ? 2 : 1,
      missions: missionsDoneToday >= 3 ? 0 : 2,
      streak: streakDays === 0 ? 2 : 1,
      expedition: isAway ? 2 : 1,
      evolution: 1,
      care: lowestCare < 40 ? 2 : 1,
    };
  }, [pet.id, careValues, isAway, streakDays, missionsDoneToday]);

  return (
    <section
      className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border border-neutral-200/80 bg-neutral-950 shadow-[0_2px_0_rgba(0,0,0,0.02),0_30px_70px_-35px_rgba(0,0,0,0.4)]"
      aria-label="Constelação do pet"
    >
      <div className="relative aspect-[2/3] w-full">
        <img
          src={skyAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />

        {/* Linhas conectando as estrelas */}
        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          viewBox="0 0 100 150"
          preserveAspectRatio="none"
          aria-hidden
        >
          {LINES.map(([from, to], i) => {
            const a = STARS.find((s) => s.id === from)!;
            const b = STARS.find((s) => s.id === to)!;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y * 1.5}
                x2={b.x}
                y2={b.y * 1.5}
                stroke="rgba(255, 233, 180, 0.45)"
                strokeWidth={0.25}
                strokeDasharray="0.6 0.9"
              />
            );
          })}
        </svg>

        {/* HUD topo: título + voltar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3">
          <span
            className="text-[15px] font-semibold tracking-tight text-amber-50"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
          >
            Constelação de {pet.custom_name}
          </span>
          <button
            type="button"
            onClick={onBackToKingdom}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-[11px] font-medium text-amber-50 shadow-sm ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25"
            aria-label="Voltar pro reino"
          >
            <ArrowDownLeft className="size-3.5" />
            Reino
          </button>
        </div>

        {/* Estrelas */}
        {STARS.map((s) => (
          <StarButton
            key={s.id}
            star={s}
            attention={attention[s.id]}
            onClick={() => setSheet(s.id)}
          />
        ))}

        {/* Legenda discreta no rodapé */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-3 text-center text-[10px] font-medium tracking-wide text-amber-100/80">
          As estrelas que brilham forte pedem atenção.
        </div>
      </div>

      <ConstellationSheet
        open={sheet === "missions"}
        onClose={() => setSheet(null)}
        title="Estrela das Missões"
        description="As tarefas do dia ainda esperam."
      >
        <MissionsTodayCard refreshKey={xpRefresh} onCompletedChange={onCareChanged} />
      </ConstellationSheet>

      <ConstellationSheet
        open={sheet === "expedition"}
        onClose={() => setSheet(null)}
        title="Estrela das Expedições"
        description="Trilhas além do reino."
      >
        <ExpeditionsCard
          userPetId={pet.id}
          petImage={null}
          petName={pet.custom_name}
          onChanged={onCareChanged}
        />
      </ConstellationSheet>

      <ConstellationSheet
        open={sheet === "evolution"}
        onClose={() => setSheet(null)}
        title="Estrela da Evolução"
        description="O caminho que seu pet trilha."
      >
        <PetEvolutionCard
          refreshKey={xpRefresh}
          petName={pet.custom_name}
          babyImage={babyImage}
          adultImage={adultImage}
          onEvolved={onEvolved}
        />
      </ConstellationSheet>

      <ConstellationSheet
        open={sheet === "streak"}
        onClose={() => setSheet(null)}
        title="Estrela do Streak"
        description="Os dias consecutivos ao lado do seu pet."
      >
        <PetStreakCard refreshKey={xpRefresh} />
      </ConstellationSheet>

      <PetDiarySheet
        open={sheet === "diary"}
        onOpenChange={(o) => setSheet(o ? "diary" : null)}
        petId={pet.id}
        refreshKey={xpRefresh}
      />

      <PetCareHistorySheet
        open={sheet === "care"}
        onOpenChange={(o) => setSheet(o ? "care" : null)}
      />
    </section>
  );
}

function StarButton({
  star,
  attention,
  onClick,
}: {
  star: StarDef;
  attention: 0 | 1 | 2;
  onClick: () => void;
}) {
  // Tamanho do botão clicável (área generosa pra touch), escala com r.
  const buttonSize = Math.max(40, star.r * 14); // px aprox via inline em em-equivalents — usamos % do width via wrapper
  // Velocidade e opacidade do pulso conforme atenção.
  const pulseDuration = attention === 2 ? "2s" : attention === 1 ? "4s" : "0s";
  const baseGlowOpacity = attention === 2 ? 0.95 : attention === 1 ? 0.55 : 0.3;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={star.label}
      className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
      }}
    >
      {/* Halo externo pulsando */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,236,180,0.55) 0%, rgba(255,236,180,0.18) 35%, rgba(255,236,180,0) 70%)",
          animation: attention > 0 ? `star-pulse ${pulseDuration} ease-in-out infinite` : undefined,
          opacity: baseGlowOpacity,
        }}
      />
      {/* Núcleo da estrela */}
      <span
        aria-hidden
        className="relative inline-block rounded-full bg-amber-50 transition-transform duration-300 group-hover:scale-125 group-active:scale-95"
        style={{
          width: `${star.r * 4}px`,
          height: `${star.r * 4}px`,
          boxShadow:
            "0 0 8px 1px rgba(255,236,180,0.95), 0 0 22px 6px rgba(255,200,120,0.5)",
        }}
      />
    </button>
  );
}

function ConstellationSheet({
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