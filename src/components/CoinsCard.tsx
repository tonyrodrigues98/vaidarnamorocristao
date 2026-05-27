import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import coinIcon from "@/assets/coin.avif";
import {
  claimDailyCoins,
  COIN_DAILY,
  COIN_MAX,
  getMyCoins,
  timeUntilMidnight,
  type CoinsStatus,
} from "@/lib/coins";

export function CoinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <img src={coinIcon} alt="moeda" draggable={false} className={`${className} select-none`} />;
}

export function CoinsCard() {
  const [status, setStatus] = useState<CoinsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [countdown, setCountdown] = useState(timeUntilMidnight());

  useEffect(() => {
    let cancel = false;
    getMyCoins()
      .then((s) => !cancel && setStatus(s))
      .catch(() => {})
      .finally(() => !cancel && setLoading(false));
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCountdown(timeUntilMidnight()), 60_000);
    return () => clearInterval(t);
  }, []);

  async function handleClaim() {
    if (!status || claiming) return;
    if (status.balance >= COIN_MAX) {
      toast.info("Você atingiu o limite máximo de moedas.");
      return;
    }
    if (!status.can_claim_today) return;
    setClaiming(true);
    try {
      const r = await claimDailyCoins();
      setStatus({
        balance: r.balance,
        last_claim_date: new Date().toISOString().slice(0, 10),
        can_claim_today: false,
      });
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
      toast.success(`✨ +${r.awarded} moedas recebidas`);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      if (msg.includes("max_balance")) toast.info("Você atingiu o limite máximo de moedas.");
      else if (msg.includes("already_claimed")) toast.info("Você já resgatou hoje. Volte amanhã!");
      else toast.error("Não foi possível resgatar agora.");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="glass flex h-32 items-center justify-center rounded-3xl">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status) return null;

  const atMax = status.balance >= COIN_MAX;
  const canClaim = status.can_claim_today && !atMax;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-amber-300/30 p-5 shadow-elegant sm:p-6"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, #f59e0b 12%, var(--card)) 0%, var(--card) 60%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.35), transparent 70%)" }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suas moedas
          </p>
          <div className="mt-1 flex items-center gap-2">
            <CoinIcon className={`h-9 w-9 drop-shadow ${pulse ? "animate-bounce" : ""}`} />
            <span
              className={`text-4xl font-bold tabular-nums tracking-tight ${pulse ? "animate-scale-in text-amber-500" : ""}`}
            >
              {status.balance}
            </span>
            <span className="text-sm text-muted-foreground">/ {COIN_MAX}</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Use moedas para enviar stickers no chat global.
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {canClaim ? (
            <>Resgate disponível agora ✨</>
          ) : atMax ? (
            <>Limite máximo atingido</>
          ) : (
            <>Próximo resgate em <span className="font-medium text-foreground">{countdown}</span></>
          )}
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={!canClaim || claiming}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:scale-[1.02] hover:shadow-amber-500/50 active:scale-95 disabled:cursor-not-allowed disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none disabled:hover:scale-100"
        >
          {claiming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {atMax
            ? "Limite atingido"
            : canClaim
              ? `Resgatar +${COIN_DAILY} moedas`
              : "Já resgatado hoje"}
        </button>
      </div>
    </div>
  );
}