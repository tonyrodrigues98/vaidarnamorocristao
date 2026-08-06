import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Box, Sparkles } from "lucide-react";
import { getGrabState } from "@/lib/petGrab";
import type { GrabState } from "@/types/petGrab";

/**
 * Card compacto que substitui o antigo PetGrabCard no /meu-pet.
 * Mostra um teaser e leva pra página dedicada de caixas.
 */
export function PetCaixasEntryCard() {
  const [state, setState] = useState<GrabState | null>(null);

  useEffect(() => {
    let active = true;
    void getGrabState()
      .then((s) => {
        if (active) setState(s);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const freeLeft = state ? Math.max(0, state.default_free_daily - state.free_used) : 0;
  const poolCount = state?.pools.length ?? 0;

  return (
    <Link
      to="/caixas"
      className="group relative block overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.12)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 20%, rgba(251,191,36,0.10), transparent 70%), radial-gradient(40% 40% at 20% 100%, rgba(168,85,247,0.08), transparent 70%)",
        }}
      />
      <div className="relative flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-100 to-violet-100 text-amber-700 ring-1 ring-neutral-200">
          <Box className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">Caixas da Sorte</h2>
          <p className="text-[11px] text-neutral-500">
            {poolCount > 0
              ? `${poolCount} caixas disponíveis · ${freeLeft > 0 ? `${freeLeft} grátis hoje` : "use moedas pra abrir"}`
              : "Abra caixas temáticas pra ganhar prêmios"}
          </p>
        </div>
        {freeLeft > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <Sparkles className="size-3" />
            {freeLeft}
          </span>
        )}
        <ArrowRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
