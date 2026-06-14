import { useEffect } from "react";
import { PET_CARE_LABEL, PET_CARE_ORDER, type PetCareKind } from "@/types/petCare";
import { PET_CARE_ICON } from "./PetNeedsHud";
import { cn } from "@/lib/utils";

/**
 * Menu radial: 6 setores em torno do pet. Cada um abre um sub-painel para
 * o tipo de cuidado correspondente. Energia não tem itens — apenas mostra info.
 */
export function PetRadialMenu({
  open,
  onClose,
  onPick,
  values,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (k: PetCareKind) => void;
  values: Record<PetCareKind, number>;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const total = PET_CARE_ORDER.length;

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center"
      onClick={onClose}
      role="dialog"
      aria-label="Central de ações do pet"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150" />
      <div
        className="relative h-[min(78vw,300px)] w-[min(78vw,300px)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {PET_CARE_ORDER.map((k, i) => {
          const Icon = PET_CARE_ICON[k];
          // ângulo: começa em -90° (topo) e distribui horário
          const angle = -Math.PI / 2 + (i / total) * Math.PI * 2;
          const radius = 42; // % do contêiner
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          const v = Math.round(values[k] ?? 0);
          return (
            <button
              key={k}
              type="button"
              onClick={() => onPick(k)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2",
                "flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full",
                "bg-white text-neutral-800 shadow-lg ring-1 ring-black/5 transition",
                "hover:scale-110 active:scale-95",
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-label={PET_CARE_LABEL[k]}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">
                {v}%
              </span>
            </button>
          );
        })}
        {/* centro: fecha */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900/80 text-xs font-semibold text-white shadow-lg"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * Hook de long-press (mouse + touch) com delay configurável.
 * Retorna handlers para colar no elemento alvo.
 */
export function useLongPress(onLongPress: () => void, delay = 400) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  function start() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      onLongPress();
      timer = null;
    }, delay);
  }
  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };
}