import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowDownLeft } from "lucide-react";
import skyAsset from "@/assets/pet-kingdom/constellation-sky.png.asset.json";
import type { PetCareKind } from "@/types/petCare";
import type { UserPetV2Full } from "@/types/petCatalog";
import { loadDiaryLog } from "@/lib/petDiary";

import { PetEvolutionCard } from "./PetEvolutionCard";
import { PetProgressionCard } from "./PetProgressionCard";
import { PetDiarySheet } from "./PetDiarySheet";
import { PetCareHistorySheet } from "./PetCareHistorySheet";

type StarId = "evolution" | "progression" | "diary" | "history";

type StarDef = {
  id: StarId;
  label: string;
  /** Categoria explicada no tooltip — Memória/Evolução do pet. */
  tooltip: string;
  x: number;
  y: number;
  r: number;
};

const STARS: StarDef[] = [
  { id: "evolution",   label: "Estrela da Evolução",   tooltip: "Memória · etapas pelas quais seu pet já passou.",        x: 30, y: 30, r: 2.6 },
  { id: "progression", label: "Estrela da Progressão", tooltip: "Memória · nível, XP e marcos de longo prazo.",            x: 70, y: 34, r: 2.6 },
  { id: "diary",       label: "Estrela do Diário",     tooltip: "Memória · reler as entradas que o pet escreveu pra você.", x: 28, y: 64, r: 2.4 },
  { id: "history",     label: "Estrela das Memórias",  tooltip: "Memória · histórico de cuidados dia a dia.",              x: 72, y: 68, r: 2.4 },
];

// Linhas conectando as estrelas em losango.
const LINES: [StarId, StarId][] = [
  ["evolution", "progression"],
  ["progression", "history"],
  ["history", "diary"],
  ["diary", "evolution"],
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

type SheetKind = null | StarId;

const LAST_STAR_KEY = "pet:constellation:last-star";

function attentionLabel(a: 0 | 1 | 2): string {
  if (a === 2) return "atenção urgente";
  if (a === 1) return "brilho calmo";
  return "tudo em dia";
}

/**
 * Constelação (Z3) — **Memória/Evolução do pet**.
 * Painel de leitura pura: revê o que já aconteceu, sem ações novas.
 * Dia-a-dia fica no Quarto (Z1) e Mundo fica no Reino (Z2).
 */
export function PetConstellation({
  pet,
  xpRefresh,
  babyImage,
  adultImage,
  onCareChanged,
  onEvolved,
  onBackToKingdom,
}: Props) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const starRefs = useRef<Record<StarId, HTMLButtonElement | null>>({
    evolution: null,
    progression: null,
    diary: null,
    history: null,
  });
  const [lastVisited, setLastVisited] = useState<StarId | null>(() => {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(LAST_STAR_KEY) as StarId | null;
    if (!v) return null;
    return STARS.some((s) => s.id === v) ? v : null;
  });

  function visit(id: StarId) {
    setLastVisited(id);
    setSheet(id);
    try { window.localStorage.setItem(LAST_STAR_KEY, id); } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!lastVisited) return;
    const btn = starRefs.current[lastVisited];
    if (btn) btn.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStarKey(e: KeyboardEvent<HTMLButtonElement>, currentId: StarId) {
    const idx = STARS.findIndex((s) => s.id === currentId);
    if (idx < 0) return;
    let nextIdx: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") nextIdx = (idx + 1) % STARS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") nextIdx = (idx - 1 + STARS.length) % STARS.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = STARS.length - 1;
    if (nextIdx === null) return;
    e.preventDefault();
    const target = STARS[nextIdx];
    const btn = starRefs.current[target.id];
    if (btn) btn.focus();
  }

  // Pendências reais — intensidade do brilho de cada estrela.
  const attention = useMemo<Record<StarId, 0 | 1 | 2>>(() => {
    const diaryLog = loadDiaryLog(pet.id);
    const todayEntries = diaryLog.filter(
      (e) => new Date(e.savedAt).toDateString() === new Date().toDateString(),
    ).length;
    return {
      evolution: 1,
      progression: 1,
      diary: todayEntries > 0 ? 2 : 1, // tem entrada nova hoje pra ler
      history: 1,
    };
  }, [pet.id]);

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={300}>
      <section
        className="relative h-full w-full overflow-hidden bg-neutral-950"
        aria-label="Constelação do pet"
      >
        <div className="relative h-full w-full">
          <img
            src={skyAsset.url}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-cover"
          />

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

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3">
            <span
              className="text-[15px] font-semibold tracking-tight text-amber-50"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
            >
              Memórias de {pet.custom_name}
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

          <div
            role="group"
            aria-label="Estrelas da constelação. Use as setas pra navegar."
            className="contents"
          >
            {STARS.map((s) => (
              <StarButton
                key={s.id}
                ref={(el) => { starRefs.current[s.id] = el; }}
                star={s}
                attention={attention[s.id]}
                isLastVisited={lastVisited === s.id}
                onClick={() => visit(s.id)}
                onKeyDown={(e) => handleStarKey(e, s.id)}
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-3 text-center text-[10px] font-medium tracking-wide text-amber-100/80">
            Memória do pet · só leitura. Ações do dia ficam no Quarto, jornadas no Reino.
          </div>

          <p className="sr-only" aria-live="polite">
            Constelação aberta. {STARS.length} estrelas de memória. Use Tab e setas para navegar; Enter para abrir.
          </p>
        </div>

        <ConstellationSheet
          open={sheet === "evolution"}
          onClose={() => setSheet(null)}
          title="Estrela da Evolução"
          description="As etapas que seu pet já cumpriu."
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
          open={sheet === "progression"}
          onClose={() => setSheet(null)}
          title="Estrela da Progressão"
          description="Nível, XP e marcos da jornada."
        >
          <PetProgressionCard refreshKey={xpRefresh} onChanged={onCareChanged} />
        </ConstellationSheet>

        <PetDiarySheet
          open={sheet === "diary"}
          onOpenChange={(o) => setSheet(o ? "diary" : null)}
          petId={pet.id}
          refreshKey={xpRefresh}
        />

        <PetCareHistorySheet
          open={sheet === "history"}
          onOpenChange={(o) => setSheet(o ? "history" : null)}
        />
      </section>
    </TooltipProvider>
  );
}

type StarButtonProps = {
  star: StarDef;
  attention: 0 | 1 | 2;
  isLastVisited: boolean;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
};

const StarButton = forwardRef<HTMLButtonElement, StarButtonProps>(function StarButton(
  { star, attention, isLastVisited, onClick, onKeyDown },
  ref,
) {
  const buttonSize = Math.max(44, star.r * 14);
  const pulseDuration = attention === 2 ? "2s" : attention === 1 ? "4s" : "0s";
  const baseGlowOpacity = attention === 2 ? 0.95 : attention === 1 ? 0.55 : 0.3;
  const stateText = attentionLabel(attention);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          onKeyDown={onKeyDown}
          aria-label={`${star.label} — ${stateText}`}
          data-last-visited={isLastVisited ? "true" : undefined}
          className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-amber-200/90 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 data-[last-visited=true]:ring-1 data-[last-visited=true]:ring-amber-200/40"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
          }}
        >
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
          <span
            aria-hidden
            className="relative inline-block rounded-full bg-amber-50 transition-transform duration-300 group-hover:scale-125 group-focus-visible:scale-125 group-active:scale-95"
            style={{
              width: `${star.r * 4}px`,
              height: `${star.r * 4}px`,
              boxShadow:
                "0 0 8px 1px rgba(255,236,180,0.95), 0 0 22px 6px rgba(255,200,120,0.5)",
            }}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={10}
        className="max-w-[240px] border border-amber-200/40 bg-neutral-900/95 text-amber-50 shadow-lg backdrop-blur"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold">{star.label}</span>
          <span className="text-[10px] text-amber-100/85">{star.tooltip}</span>
          <span className="text-[10px] text-amber-100/60">{stateText}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

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