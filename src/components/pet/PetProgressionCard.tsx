import { useEffect, useState } from "react";
import { Gift, Moon, Sparkles, Star, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import {
  claimStarterBundle,
  getPrestige,
  getStarterBundle,
  isNightBoostActive,
  nightBoostCountdownMs,
  prestigeRebirth,
  type PrestigeState,
  type StarterBundleState,
} from "@/lib/petProgression";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}min`;
}

/**
 * Card unificado de progressão de longo prazo:
 *  - Boost noturno 2x (23h–03h SP)
 *  - Pacote inicial (one-time)
 *  - Prestígio / renascimento (nível 50)
 */
export function PetProgressionCard({
  refreshKey,
  onChanged,
}: {
  refreshKey?: number;
  onChanged?: () => void;
}) {
  const [bundle, setBundle] = useState<StarterBundleState | null>(null);
  const [prestige, setPrestige] = useState<PrestigeState | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [reborning, setReborning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tick para atualizar a janela do boost noturno em tempo real.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([getStarterBundle(), getPrestige()])
      .then(([b, p]) => {
        if (!alive) return;
        setBundle(b);
        setPrestige(p);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const boostActive = isNightBoostActive(now);
  const { msUntilChange } = nightBoostCountdownMs(now);

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    try {
      const r = await claimStarterBundle();
      if (r.ok) {
        haptics.success();
        toast.success("Pacote inicial coletado!", {
          description: `+${r.coins_granted} moedas · +${r.xp_granted} XP`,
        });
        setBundle({
          claimed: true,
          claimed_at: new Date().toISOString(),
          coins_granted: r.coins_granted,
          xp_granted: r.xp_granted,
        });
        onChanged?.();
      } else if (r.reason === "already_claimed") {
        toast.message("Você já coletou o pacote inicial.");
      }
    } catch {
      toast.error("Não foi possível coletar agora.");
    } finally {
      setClaiming(false);
    }
  }

  async function handleRebirth() {
    if (reborning) return;
    setReborning(true);
    try {
      const r = await prestigeRebirth();
      if (r.ok) {
        haptics.success();
        toast.success(`Renascimento Lv. ${r.new_prestige_level}!`, {
          description: `Medalha permanente + ${r.xp_bonus_pct}% de XP para sempre.`,
        });
        const fresh = await getPrestige();
        setPrestige(fresh);
        onChanged?.();
      } else if (r.reason === "level_too_low") {
        toast.error("Você precisa estar no nível 50 para renascer.");
      }
    } catch {
      toast.error("Não foi possível renascer agora.");
    } finally {
      setReborning(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-indigo-500" strokeWidth={2.2} />
          <h3 className="text-sm font-semibold text-slate-800">Progressão</h3>
        </div>
        {prestige && prestige.level > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-300/60">
            <Star className="size-3" strokeWidth={2.4} />
            Prestígio {prestige.level}
          </span>
        ) : null}
      </header>

      {/* Boost noturno */}
      <div
        className={cn(
          "mb-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5",
          boostActive
            ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
            : "bg-slate-50 text-slate-600",
        )}
      >
        <div className="flex items-center gap-2">
          <Moon className={cn("size-4", boostActive ? "text-white" : "text-slate-400")} strokeWidth={2.2} />
          <div className="leading-tight">
            <p className="text-[12px] font-semibold">
              {boostActive ? "Boost 2x ativo" : "Boost noturno 2x"}
            </p>
            <p className={cn("text-[10.5px]", boostActive ? "text-white/85" : "text-slate-500")}>
              {boostActive
                ? `Termina em ${formatCountdown(msUntilChange)}`
                : `Começa em ${formatCountdown(msUntilChange)} · 23h–03h`}
            </p>
          </div>
        </div>
        {boostActive ? (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">2x</span>
        ) : null}
      </div>

      {/* Bundle starter */}
      {bundle && !bundle.claimed ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-emerald-600" strokeWidth={2.2} />
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-emerald-900">Pacote inicial</p>
              <p className="text-[10.5px] text-emerald-700">+300 moedas · +200 XP</p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 rounded-full bg-emerald-600 px-3 text-[12px] hover:bg-emerald-700"
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? <Loader2 className="size-3.5 animate-spin" /> : "Coletar"}
          </Button>
        </div>
      ) : null}

      {/* Prestige */}
      {prestige ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" strokeWidth={2.2} />
              <p className="text-[12px] font-semibold text-slate-800">Renascimento</p>
            </div>
            {prestige.level > 0 ? (
              <span className="text-[10.5px] font-semibold text-amber-700">
                +{prestige.xp_bonus_pct}% XP permanente
              </span>
            ) : null}
          </div>
          <p className="mb-2 text-[11px] leading-snug text-slate-600">
            {prestige.can_rebirth
              ? "Você alcançou o nível 50. Renascer zera o XP, mantém uma medalha permanente e adiciona +5% de XP para sempre."
              : `No nível ${prestige.current_xp_level}/50. Chegue ao nível 50 para renascer e ganhar bônus permanente de XP.`}
          </p>
          <Button
            size="sm"
            variant={prestige.can_rebirth ? "default" : "outline"}
            className={cn(
              "h-8 w-full rounded-full text-[12px]",
              prestige.can_rebirth &&
                "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600",
            )}
            disabled={!prestige.can_rebirth || reborning}
            onClick={() => setConfirmOpen(true)}
          >
            {prestige.can_rebirth ? "Renascer" : "Bloqueado até nível 50"}
          </Button>
        </div>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renascer agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu XP vai voltar a zero, mas você mantém uma medalha permanente
              de prestígio e ganha +5% de XP para sempre (cumulativo até +50%).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reborning}>Agora não</AlertDialogCancel>
            <AlertDialogAction onClick={handleRebirth} disabled={reborning}>
              {reborning ? <Loader2 className="size-4 animate-spin" /> : "Renascer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}