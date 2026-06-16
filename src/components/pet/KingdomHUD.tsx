import { Flame, Star, ArrowDownLeft, Sparkles } from "lucide-react";

type Props = {
  petName: string;
  streakDays: number;
  level?: number | null;
  onBack: () => void;
  onOpenConstellation: () => void;
};

/**
 * HUD minimalista do mapa: nome do reino + streak + nível.
 * Sem cards — texto sobreposto com drop-shadow pra contrastar com a arte.
 */
export function KingdomHUD({ petName, streakDays, level, onBack, onOpenConstellation }: Props) {
  const realmName = `Reino de ${petName}`;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3"
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <div className="pointer-events-auto flex flex-col gap-1">
        <span
          className="text-[15px] font-semibold tracking-tight text-neutral-900"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.85)" }}
        >
          {realmName}
        </span>
        <div className="flex items-center gap-3 text-[11px] font-medium text-neutral-700">
          <span
            className="inline-flex items-center gap-1"
            style={{ textShadow: "0 1px 2px rgba(255,255,255,0.85)" }}
          >
            <Flame className="size-3.5 text-amber-600" />
            {streakDays}
          </span>
          {typeof level === "number" ? (
            <span
              className="inline-flex items-center gap-1"
              style={{ textShadow: "0 1px 2px rgba(255,255,255,0.85)" }}
            >
              <Star className="size-3.5 text-amber-500" />
              {level}
            </span>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenConstellation}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 shadow-sm ring-1 ring-amber-200/60 backdrop-blur transition hover:bg-white"
          aria-label="Ver constelação"
        >
          <Sparkles className="size-3.5" />
          Constelação
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white"
          aria-label="Voltar pro quarto"
        >
          <ArrowDownLeft className="size-3.5" />
          Quarto
        </button>
      </div>
    </div>
  );
}