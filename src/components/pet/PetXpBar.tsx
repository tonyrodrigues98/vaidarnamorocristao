import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles, Trophy } from "lucide-react";
import { getMyXpState, levelTitle, type XpState } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { toast } from "sonner";

/**
 * Barra de XP azul, full-width dentro do bloco do pet.
 * Atualiza ao montar e quando `refreshKey` muda.
 */
export function PetXpBar({ refreshKey, className }: { refreshKey?: number; className?: string }) {
  const [state, setState] = useState<XpState | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    getMyXpState()
      .then((s) => {
        if (!alive) return;
        setState(s);
        // Detecta level-up entre renders e dispara feedback tátil + toast.
        if (prevLevelRef.current != null && s.level > prevLevelRef.current) {
          haptics.success();
          toast.success(`Nível ${s.level}!`, {
            description: `Agora você é ${levelTitle(s.level)}.`,
          });
        }
        prevLevelRef.current = s.level;
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const lv = state?.level ?? 1;
  const into = state?.xp_into_level ?? 0;
  const need = state?.xp_for_next ?? 1;
  const pct = state?.is_max ? 100 : Math.max(2, Math.min(100, Math.round((into / need) * 100)));
  const title = levelTitle(lv);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-sky-200/70 bg-gradient-to-b from-sky-50/80 to-white px-3.5 py-2.5",
        className,
      )}
      aria-label={`Nível ${lv} ${title}, ${into} de ${need} XP`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-medium">
        <span className="inline-flex items-center gap-1.5 text-sky-700">
          <Sparkles className="size-3.5" strokeWidth={2.2} />
          Nível {lv}
          <span className="text-sky-500/80">· {title}</span>
        </span>
        <span className="tabular-nums text-sky-600/80">
          {state?.is_max ? "MAX" : `${into} / ${need} XP`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        to="/conquistas"
        className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-sky-100/60 px-2.5 py-1.5 text-[11px] font-medium text-sky-700 transition hover:bg-sky-100"
      >
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="size-3.5" />
          Ver conquistas
        </span>
        <ChevronRight className="size-3.5 text-sky-500" />
      </Link>
    </div>
  );
}
