import { useEffect, useState } from "react";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Gift,
  Lock,
  Moon,
  Sparkles,
  Star,
  Trophy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";
import {
  claimStarterBundle,
  getPrestige,
  getStarterBundle,
  getRebirthHistory,
  isNightBoostActive,
  nightBoostCountdownMs,
  nextMedal,
  PRESTIGE_MEDALS,
  prestigeRebirth,
  type MedalKind,
  type PrestigeState,
  type RebirthHistoryRow,
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

const MEDAL_STYLE: Record<MedalKind, { ring: string; bg: string; text: string }> = {
  bronze: { ring: "ring-amber-400/60", bg: "bg-amber-100", text: "text-amber-700" },
  silver: { ring: "ring-slate-300", bg: "bg-slate-100", text: "text-slate-700" },
  gold: { ring: "ring-yellow-400/70", bg: "bg-yellow-100", text: "text-yellow-700" },
  diamond: { ring: "ring-cyan-400/70", bg: "bg-cyan-100", text: "text-cyan-700" },
};

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
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
  const [history, setHistory] = useState<RebirthHistoryRow[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [reborning, setReborning] = useState(false);
  const [confirmRebirth, setConfirmRebirth] = useState(false);
  const [confirmClaim, setConfirmClaim] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Tick para atualizar a janela do boost noturno em tempo real.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([getStarterBundle(), getPrestige(), getRebirthHistory()])
      .then(([b, p, h]) => {
        if (!alive) return;
        setBundle(b);
        setPrestige(p);
        setHistory(h);
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
    // Timeout amigável para evitar spinner infinito se o backend travar.
    const TIMEOUT_MS = 12_000;
    let timedOut = false;
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error("timeout"));
      }, TIMEOUT_MS);
    });
    try {
      const r = await Promise.race([claimStarterBundle(), timeout]);
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
      } else {
        // Mensagens amigáveis por motivo de falha do servidor.
        switch (r.reason) {
          case "already_claimed":
            toast.message("Você já coletou o pacote inicial.", {
              description: "Cada conta pode resgatar apenas uma vez.",
            });
            break;
          case "locked":
          case "lock_not_available":
          case "concurrent_claim":
            toast.error("Resgate em andamento", {
              description:
                "Já existe uma tentativa de coleta em processamento. Aguarde alguns segundos e tente novamente.",
            });
            break;
          case "credit_failed":
          case "payment_failed":
          case "coins_credit_failed":
          case "xp_credit_failed":
            toast.error("Falha ao creditar recompensas", {
              description:
                "Não conseguimos liberar moedas/XP agora. Nenhum valor foi descontado — tente de novo em instantes.",
            });
            break;
          default:
            toast.error("Não foi possível confirmar o resgate", {
              description:
                "Tente novamente. Se persistir, recarregue a página.",
            });
        }
        // Sincroniza UI mesmo se o servidor recusar.
        const fresh = await getStarterBundle().catch(() => null);
        if (fresh) setBundle(fresh);
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? "";
      if (timedOut || msg === "timeout") {
        toast.error("Tempo esgotado", {
          description:
            "A confirmação demorou demais. Verifique sua conexão — se o crédito caiu, ele aparecerá no seu saldo em instantes.",
        });
      } else if (/network|fetch|Failed to fetch/i.test(msg)) {
        toast.error("Sem conexão", {
          description: "Conecte-se à internet e tente novamente.",
        });
      } else {
        toast.error("Não foi possível coletar agora", {
          description: "Tente novamente em alguns segundos.",
        });
      }
      // Sincroniza para refletir possível crédito que tenha passado.
      const fresh = await getStarterBundle().catch(() => null);
      if (fresh) setBundle(fresh);
    } finally {
      setClaiming(false);
      setConfirmClaim(false);
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
        const [fresh, freshHistory] = await Promise.all([
          getPrestige(),
          getRebirthHistory(),
        ]);
        setPrestige(fresh);
        setHistory(freshHistory);
        onChanged?.();
      } else if (r.reason === "level_too_low") {
        toast.error("Você precisa estar no nível 50 para renascer.");
      }
    } catch {
      toast.error("Não foi possível renascer agora.");
    } finally {
      setReborning(false);
      setConfirmRebirth(false);
    }
  }

  const medalInfo = prestige ? nextMedal(prestige.level) : null;

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
              <p className="text-[10.5px] text-emerald-700">
                Grátis · uma única vez · +300 moedas · +200 XP
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 rounded-full bg-emerald-600 px-3 text-[12px] hover:bg-emerald-700"
            onClick={() => setConfirmClaim(true)}
            disabled={claiming}
          >
            {claiming ? <Loader2 className="size-3.5 animate-spin" /> : "Coletar"}
          </Button>
        </div>
      ) : bundle && bundle.claimed ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Gift className="size-4 text-slate-400" strokeWidth={2.2} />
            <div className="leading-tight">
              <p className="text-[12px] font-semibold text-slate-700">Pacote inicial</p>
              <p className="text-[10.5px] text-slate-500">
                Coletado em {formatDateShort(bundle.claimed_at)} · +{bundle.coins_granted} moedas · +{bundle.xp_granted} XP
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Coletado
          </span>
        </div>
      ) : null}

      {/* Prestige */}
      {prestige && medalInfo ? (
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

          {/* Painel de progresso até o nível 50 */}
          <div className="mb-2 rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-700">
              <span>Nível atual</span>
              <span>
                {prestige.current_xp_level}
                <span className="text-slate-400">/50</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all"
                style={{
                  width: `${Math.min(100, (prestige.current_xp_level / 50) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-[10.5px] text-slate-500">
              {prestige.can_rebirth
                ? "Pronto para renascer."
                : `Faltam ${Math.max(0, 50 - prestige.current_xp_level)} níveis para o próximo renascimento.`}
            </p>
          </div>

          {/* Trilha de medalhas */}
          <div className="mb-2 rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-slate-700">
              <span className="inline-flex items-center gap-1">
                <Award className="size-3.5 text-amber-500" strokeWidth={2.4} />
                Medalhas
              </span>
              <span className="text-[10.5px] text-slate-500">
                Prestígio {prestige.level}/10
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {PRESTIGE_MEDALS.map((m) => {
                const unlocked = prestige.level >= m.level;
                const style = MEDAL_STYLE[m.medal];
                return (
                  <div
                    key={m.medal}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full ring-2",
                        unlocked ? style.bg : "bg-slate-100",
                        unlocked ? style.ring : "ring-slate-200",
                      )}
                    >
                      {unlocked ? (
                        <Award className={cn("size-4", style.text)} strokeWidth={2.4} />
                      ) : (
                        <Lock className="size-3.5 text-slate-400" strokeWidth={2.2} />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        unlocked ? style.text : "text-slate-400",
                      )}
                    >
                      {m.label}
                    </span>
                    <span className="text-[9.5px] text-slate-400">Lv.{m.level}</span>
                  </div>
                );
              })}
            </div>
            {medalInfo.next ? (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-[10.5px] text-slate-500">
                  <span>Próxima: {medalInfo.next.label}</span>
                  <span>
                    {prestige.level}/{medalInfo.next.level} prestígios
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                    style={{ width: `${Math.round(medalInfo.progress * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[10.5px] font-semibold text-cyan-700">
                Todas as medalhas conquistadas.
              </p>
            )}
          </div>

          <p className="mb-2 text-[11px] leading-snug text-slate-600">
            {prestige.can_rebirth
              ? "Renascer zera o XP, mantém todas as medalhas conquistadas e adiciona +5% de XP permanente (acumulativo até +50%)."
              : "Ao chegar no nível 50 você pode renascer, mantendo todas as medalhas e ganhando bônus permanente de XP."}
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
            onClick={() => setConfirmRebirth(true)}
          >
            {prestige.can_rebirth ? "Renascer" : "Bloqueado até nível 50"}
          </Button>

          {/* Histórico de renascimentos */}
          {history.length > 0 ? (
            <div className="mt-2.5 border-t border-slate-200 pt-2.5">
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="flex w-full items-center justify-between text-[11px] font-medium text-slate-600 hover:text-slate-800"
              >
                <span>Histórico ({history.length})</span>
                {historyOpen ? (
                  <ChevronUp className="size-3.5" strokeWidth={2.2} />
                ) : (
                  <ChevronDown className="size-3.5" strokeWidth={2.2} />
                )}
              </button>
              {historyOpen ? (
                <ul className="mt-2 space-y-1.5">
                  {history.map((h) => {
                    const style = h.medal ? MEDAL_STYLE[h.medal] : null;
                    return (
                      <li
                        key={h.id}
                        className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 ring-1 ring-slate-200"
                      >
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full ring-1",
                            style?.bg ?? "bg-slate-100",
                            style?.ring ?? "ring-slate-200",
                          )}
                        >
                          <Award
                            className={cn("size-3", style?.text ?? "text-slate-400")}
                            strokeWidth={2.4}
                          />
                        </div>
                        <div className="flex flex-1 items-center justify-between text-[10.5px]">
                          <span className="font-medium text-slate-700">
                            Prestígio {h.prestige_level}
                          </span>
                          <span className="text-slate-500">
                            {formatDateShort(h.created_at)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <AlertDialog open={confirmRebirth} onOpenChange={setConfirmRebirth}>
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

      <AlertDialog open={confirmClaim} onOpenChange={setConfirmClaim}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pacote inicial</AlertDialogTitle>
            <AlertDialogDescription>
              Esta é uma compra única e gratuita: +300 moedas e +200 XP creditados
              agora. A operação é registrada no seu histórico de moedas e não pode
              ser repetida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={claiming}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClaim} disabled={claiming}>
              {claiming ? <Loader2 className="size-4 animate-spin" /> : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}