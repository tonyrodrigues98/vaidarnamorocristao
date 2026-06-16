import { useEffect, useState } from "react";
import { Sparkles, Loader2, TrendingUp, Flame } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  evolveMyPet,
  getPetEvolutionStatus,
  type PetEvolutionStatus,
} from "@/lib/petEvolution";
import { PetEvolutionCeremonyModal } from "./PetEvolutionCeremonyModal";

type Props = {
  refreshKey?: number;
  petName: string;
  babyImage: string | null;
  adultImage: string | null;
  onEvolved: () => void;
};

function isEligible(
  s: PetEvolutionStatus | null,
): s is Extract<PetEvolutionStatus, { is_baby: boolean }> {
  return !!s && "is_baby" in s;
}

export function PetEvolutionCard({
  refreshKey,
  petName,
  babyImage,
  adultImage,
  onEvolved,
}: Props) {
  const [status, setStatus] = useState<PetEvolutionStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [ceremony, setCeremony] = useState<{ xp: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPetEvolutionStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!isEligible(status) || !status.is_baby) return null;

  const levelPct = Math.min(100, Math.round((status.level / status.required_level) * 100));
  const streakPct = Math.min(
    100,
    Math.round((status.streak / status.required_streak) * 100),
  );
  const ready = status.eligible;

  async function handleEvolve() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await evolveMyPet();
      if (!res.ok) {
        toast.error("Ainda não dá pra crescer. Verifique nível e streak.");
        return;
      }
      setCeremony({ xp: res.xp_bonus });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section
        className={cn(
          "overflow-hidden rounded-2xl border bg-white p-4 transition",
          ready
            ? "border-amber-200 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.45)]"
            : "border-neutral-200",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              ready ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-700",
            )}
          >
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-neutral-900">
              {ready ? `${petName} está pronto pra crescer` : "Caminho pra fase adulta"}
            </div>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              {ready
                ? "Faça a cerimônia quando quiser. Ele cresce e você desbloqueia adultos."
                : "Continue subindo de nível e cuidando dele todos os dias."}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="size-3" /> Nível
              </span>
              <span className="tabular-nums">
                {status.level}/{status.required_level}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  status.level >= status.required_level ? "bg-amber-500" : "bg-neutral-900",
                )}
                style={{ width: `${levelPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <Flame className="size-3" /> Streak de cuidado
              </span>
              <span className="tabular-nums">
                {status.streak}/{status.required_streak} dias
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  status.streak >= status.required_streak ? "bg-amber-500" : "bg-neutral-900",
                )}
                style={{ width: `${streakPct}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => void handleEvolve()}
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            ready
              ? "bg-neutral-900 text-white hover:bg-neutral-800"
              : "bg-neutral-100 text-neutral-400",
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {ready ? "Fazer cerimônia" : "Em progresso"}
        </button>
      </section>

      <PetEvolutionCeremonyModal
        open={!!ceremony}
        petName={petName}
        babyImage={babyImage}
        adultImage={adultImage}
        xpBonus={ceremony?.xp ?? 200}
        onClose={() => {
          setCeremony(null);
          onEvolved();
        }}
      />
    </>
  );
}