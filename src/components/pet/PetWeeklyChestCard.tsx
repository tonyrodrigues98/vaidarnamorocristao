import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { claimPetWeeklyChest, getPetWeeklyChest } from "@/lib/petStreak";
import { haptics } from "@/lib/haptics";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { XpIcon } from "@/components/icons/XpIcon";

export function PetWeeklyChestCard({
  refreshKey = 0,
  onClaimed,
}: {
  refreshKey?: number;
  onClaimed?: () => void;
}) {
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["pet", "weekly-chest", refreshKey],
    queryFn: getPetWeeklyChest,
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="h-[96px] animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50" />
    );
  }

  const ready = data.done >= data.target && !data.claimed;
  const pct = Math.min(100, (data.done / data.target) * 100);

  async function onClaim() {
    setClaiming(true);
    try {
      const res = await claimPetWeeklyChest();
      if (res.ok) {
        haptics.success();
        toast.success(`Caixa aberta! +${res.coins} moedas e +${res.xp} XP`);
        await qc.invalidateQueries({ queryKey: ["pet", "weekly-chest"] });
        onClaimed?.();
      } else if (res.reason === "already_claimed") {
        toast.info("Você já abriu a caixa desta semana.");
      } else {
        toast.info("Complete mais missões para abrir a caixa.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div
      className={
        "rounded-2xl border p-4 transition " +
        (ready
          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-[0_8px_24px_-12px_rgba(245,158,11,0.45)]"
          : "border-neutral-200 bg-white")
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            "flex size-11 shrink-0 items-center justify-center rounded-xl " +
            (ready
              ? "bg-amber-500 text-white shadow-sm animate-pulse"
              : data.claimed
                ? "bg-emerald-50 text-emerald-600"
                : "bg-neutral-100 text-neutral-400")
          }
        >
          <Gift className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">Caixa semanal</h3>
            <span className="text-[11px] text-neutral-500">
              {data.done}/{data.target} missões
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {data.claimed
              ? "Você já abriu esta semana. Volta segunda-feira."
              : ready
                ? "Recompensa pronta para ser coletada."
                : `Complete ${data.target} missões diárias na semana para abrir.`}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={
                "h-full rounded-full transition-all " +
                (ready ? "bg-amber-500" : "bg-neutral-300")
              }
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div
              className={
                "flex items-center gap-2 text-[11px] " +
                (ready ? "font-semibold text-amber-700" : "text-neutral-500")
              }
            >
              <span className="inline-flex items-center gap-1">
                <CoinIcon className="size-3" /> +{data.reward_coins}
              </span>
              <span className="inline-flex items-center gap-1">
                <XpIcon className="size-3.5" /> +{data.reward_xp} XP
              </span>
            </div>
            <button
              type="button"
              disabled={!ready || claiming}
              onClick={() => void onClaim()}
              className={
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition " +
                (data.claimed
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                  : ready
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "border border-neutral-200 bg-white text-neutral-400")
              }
            >
              {data.claimed ? "Aberta" : ready ? "Abrir" : "Bloqueada"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}