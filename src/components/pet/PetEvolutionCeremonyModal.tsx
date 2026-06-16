import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { XpIcon } from "@/components/icons/XpIcon";

type Props = {
  open: boolean;
  petName: string;
  babyImage: string | null;
  adultImage: string | null;
  xpBonus: number;
  onClose: () => void;
};

export function PetEvolutionCeremonyModal({
  open,
  petName,
  babyImage,
  adultImage,
  xpBonus,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<"baby" | "transition" | "adult">("baby");

  useEffect(() => {
    if (!open) {
      setPhase("baby");
      return;
    }
    const t1 = setTimeout(() => setPhase("transition"), 600);
    const t2 = setTimeout(() => {
      setPhase("adult");
      haptics.success();
    }, 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/80 text-neutral-500 transition hover:bg-white hover:text-neutral-900"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>

        <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-50 to-white">
          {/* sparkles backdrop */}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              phase === "transition" ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-amber-200/60 via-amber-100/20 to-transparent blur-2xl" />
          </div>

          {babyImage && (
            <img
              src={babyImage}
              alt=""
              className={cn(
                "absolute h-40 w-40 object-contain transition-all duration-700",
                phase === "baby" && "scale-100 opacity-100",
                phase === "transition" && "scale-110 opacity-0 blur-sm",
                phase === "adult" && "opacity-0",
              )}
            />
          )}
          {adultImage && (
            <img
              src={adultImage}
              alt=""
              className={cn(
                "absolute h-48 w-48 object-contain transition-all duration-700",
                phase === "adult"
                  ? "scale-100 opacity-100 drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
                  : "scale-90 opacity-0",
              )}
            />
          )}
        </div>

        <div className="space-y-3 px-6 pb-6 pt-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            Cerimônia de crescimento
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
            {petName} cresceu
          </h2>
          <p className="text-sm text-neutral-500">
            Vocês passaram por essa jornada juntos. Daqui em diante, quando criar
            um pet novo, você poderá escolher já adulto.
          </p>
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <XpIcon className="size-4" /> +{xpBonus} XP de bônus
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}