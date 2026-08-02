import { useEffect, useRef, useState } from "react";
import { BookHeart, X, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deriveDiaryMood,
  derivePhase,
  pickDiaryEntry,
  saveDiaryEntry,
  type DiaryContext,
} from "@/lib/petDiary";
import { loadLastAction } from "@/lib/petLocalCache";
import type { PetCareKind } from "@/types/petCare";

type Props = {
  petId: string;
  petName: string;
  personality?: string | null;
  values: Partial<Record<PetCareKind, number>>;
  streak: number;
  missionsDone: number;
  /** Notifica o pai quando uma nova entrada for salva (para refresh do diário). */
  onSaved?: () => void;
  /** Pausa o ciclo (ex.: durante expedição). */
  paused?: boolean;
};

const FIRST_DELAY_MS = 4_500;
const CYCLE_MIN_MS = 28_000;
const CYCLE_MAX_MS = 48_000;
const VISIBLE_MS = 7_500;

/**
 * Vida Autônoma — balão de pensamento do pet posicionado acima do sprite.
 * Toca em ciclo enquanto a aba está visível. Tap em "Salvar no diário"
 * persiste a entrada localmente (acessível em PetDiarySheet).
 */
export function PetDiaryBubble({
  petId,
  petName,
  personality,
  values,
  streak,
  missionsDone,
  onSaved,
  paused,
}: Props) {
  const [current, setCurrent] = useState<{ id: string; text: string } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const ctxRef = useRef<DiaryContext>({
    petName,
    mood: "happy",
    phase: "day",
    streak: 0,
    personality: null,
    lastAction: null,
    missionsDone: 0,
  });

  // Mantém contexto fresco sem reiniciar o timer
  useEffect(() => {
    const last = loadLastAction(petId);
    ctxRef.current = {
      petName,
      mood: deriveDiaryMood(values),
      phase: derivePhase(),
      streak,
      personality: personality ?? null,
      lastAction: last?.kind ?? null,
      missionsDone,
    };
  }, [petId, petName, personality, values, streak, missionsDone]);

  // Cicla entradas
  useEffect(() => {
    if (paused) return;
    let visibleTimer: ReturnType<typeof setTimeout> | null = null;
    let cycleTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    const showOne = () => {
      if (!alive || document.visibilityState !== "visible") {
        scheduleNext();
        return;
      }
      const picked = pickDiaryEntry(ctxRef.current, petId);
      if (picked) {
        setCurrent({ id: picked.entry.id, text: picked.text });
        if (visibleTimer) clearTimeout(visibleTimer);
        visibleTimer = setTimeout(() => {
          if (alive) setCurrent(null);
        }, VISIBLE_MS);
      }
      scheduleNext();
    };

    const scheduleNext = () => {
      const delay = CYCLE_MIN_MS + Math.random() * (CYCLE_MAX_MS - CYCLE_MIN_MS);
      if (cycleTimer) clearTimeout(cycleTimer);
      cycleTimer = setTimeout(showOne, delay);
    };

    const initial = setTimeout(showOne, FIRST_DELAY_MS);
    return () => {
      alive = false;
      clearTimeout(initial);
      if (visibleTimer) clearTimeout(visibleTimer);
      if (cycleTimer) clearTimeout(cycleTimer);
    };
  }, [petId, paused]);

  if (!current) return null;

  function handleSave() {
    if (!current) return;
    const ctx = ctxRef.current;
    saveDiaryEntry(petId, {
      id: current.id,
      text: current.text,
      savedAt: new Date().toISOString(),
      phase: ctx.phase,
      mood: ctx.mood,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
    onSaved?.();
  }

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-30 w-[min(82%,260px)] -translate-x-1/2 animate-[fade-in_400ms_ease-out]"
      style={{ top: "50%" }}
    >
      <div className="pointer-events-auto relative rounded-2xl border border-amber-200/70 bg-white/95 px-3 py-2.5 shadow-[0_8px_28px_-8px_rgba(217,119,6,0.25)] backdrop-blur">
        <button
          type="button"
          onClick={() => setCurrent(null)}
          aria-label="Fechar pensamento"
          className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-neutral-300 transition hover:text-neutral-500"
        >
          <X className="size-3.5" />
        </button>
        <div className="flex items-start gap-2 pr-4">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <BookHeart className="size-3.5" />
          </div>
          <p className="text-[12.5px] leading-snug text-neutral-800">{current.text}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition",
            savedFlash
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100",
          )}
        >
          <NotebookPen className="size-3" />
          {savedFlash ? "Guardado no diário" : "Guardar no diário"}
        </button>
        {/* rabinho do balão apontando pro pet */}
        <span
          aria-hidden
          className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-amber-200/70 bg-white/95"
        />
      </div>
    </div>
  );
}
