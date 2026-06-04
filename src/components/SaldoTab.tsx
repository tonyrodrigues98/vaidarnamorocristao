import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Inbox,
  DollarSign,
  VenetianMask,
} from "lucide-react";
import coinIcon from "@/assets/coin.webp";
import coinSound from "@/assets/coin-reward.mp3";
import { DECORATION_ASSETS } from "@/lib/decorations";
import {
  claimDailyCoins,
  COIN_DAILY,
  COIN_MAX,
  getMyCoins,
  timeUntilMidnight,
  type CoinsStatus,
} from "@/lib/coins";
import { fetchMyCoinTransactions, type CoinTx } from "@/lib/coinTx";

type Filter = "all" | "in" | "out";

export function SaldoTab() {
  const [status, setStatus] = useState<CoinsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [countdown, setCountdown] = useState(timeUntilMidnight());
  const [txs, setTxs] = useState<CoinTx[]>([]);
  const [txsLoading, setTxsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [displayBalance, setDisplayBalance] = useState<number>(0);

  // Initial fetch
  useEffect(() => {
    let cancel = false;
    Promise.all([getMyCoins(), fetchMyCoinTransactions(200)])
      .then(([s, t]) => {
        if (cancel) return;
        setStatus(s);
        setDisplayBalance(s.balance);
        setTxs(t);
      })
      .catch(() => {})
      .finally(() => {
        if (cancel) return;
        setLoading(false);
        setTxsLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setCountdown(timeUntilMidnight()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Animate balance changes
  useEffect(() => {
    if (!status) return;
    const target = status.balance;
    if (displayBalance === target) return;
    const start = displayBalance;
    const diff = target - start;
    const duration = 600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayBalance(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.balance]);

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
      try {
        const audio = new Audio(coinSound);
        audio.volume = 0.6;
        void audio.play().catch(() => {});
      } catch {
        /* noop */
      }
      setStatus({
        balance: r.balance,
        last_claim_date: new Date().toISOString().slice(0, 10),
        can_claim_today: false,
      });
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
      toast.success(`✨ +${r.awarded} moedas recebidas`);
      // refresh extrato
      fetchMyCoinTransactions(200)
        .then(setTxs)
        .catch(() => {});
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      if (msg.includes("max_balance")) toast.info("Você atingiu o limite máximo de moedas.");
      else if (msg.includes("already_claimed")) toast.info("Você já resgatou hoje. Volte amanhã!");
      else toast.error("Não foi possível resgatar agora.");
    } finally {
      setClaiming(false);
    }
  }

  const filtered = useMemo(() => {
    if (filter === "all") return txs;
    return txs.filter((t) => t.direction === filter);
  }, [txs, filter]);

  if (loading) {
    return (
      <div className="glass flex h-40 items-center justify-center rounded-3xl">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!status) return null;

  const atMax = status.balance >= COIN_MAX;
  const canClaim = status.can_claim_today && !atMax;

  return (
    <div className="space-y-5">
      {/* Balance card */}
      <div
        className="relative overflow-hidden rounded-3xl border border-amber-300/30 p-6 shadow-elegant sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, #f59e0b 14%, var(--card)) 0%, var(--card) 65%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.40), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(244,114,182,0.25), transparent 70%)" }}
        />
        <div className="relative flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Wallet className="h-4 w-4 text-amber-500" /> Saldo atual
        </div>
        <div className="relative mt-4 flex items-end gap-3">
          <img
            src={coinIcon}
            alt="moeda"
            className={`h-12 w-12 drop-shadow ${pulse ? "animate-bounce" : ""}`}
          />
          <div
            className={`text-5xl font-bold tabular-nums tracking-tight sm:text-6xl ${pulse ? "text-amber-500" : ""}`}
          >
            {displayBalance}
          </div>
          <div className="mb-2 text-sm text-muted-foreground">/ {COIN_MAX}</div>
        </div>
        <p className="relative mt-3 text-xs text-muted-foreground/80">
          Use moedas para enviar stickers, comprar molduras, auras e recados extras.
        </p>
      </div>

      {/* Daily redeem */}
      <div className="glass relative overflow-hidden rounded-3xl p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Resgate diário</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {canClaim ? (
                <>Resgate disponível agora ✨</>
              ) : atMax ? (
                <>Limite máximo atingido</>
              ) : (
                <>
                  Próximo resgate disponível em{" "}
                  <span className="font-medium text-foreground">{countdown}</span>
                </>
              )}
            </p>
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

      {/* Extrato */}
      <div className="glass rounded-3xl p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Extrato</h3>
            <p className="text-xs text-muted-foreground">Suas movimentações de moedas</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border bg-card/60 p-1">
            {(
              [
                { v: "all", label: "Tudo" },
                { v: "out", label: "Compras" },
                { v: "in", label: "Ganhos" },
              ] as { v: Filter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setFilter(opt.v)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === opt.v
                    ? "bg-foreground text-background shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {txsLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2">
              {filtered.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/30 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">Nenhuma movimentação encontrada.</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Quando você resgatar moedas ou fizer uma compra, ela aparece por aqui.
      </p>
    </div>
  );
}

function TxRow({ tx }: { tx: CoinTx }) {
  const isIn = tx.direction === "in";
  const valueColor = isIn
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";
  const iconWrap = isIn
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  const d = new Date(tx.created_at);
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const resolvedIcon = tx.icon_url
    ? (DECORATION_ASSETS[tx.icon_url] ??
      (tx.icon_url.startsWith("http") || tx.icon_url.startsWith("/") ? tx.icon_url : null))
    : null;
  const KindIcon =
    tx.kind === "daily_claim"
      ? DollarSign
      : tx.kind === "anonymous_extra"
        ? VenetianMask
        : isIn
          ? ArrowDownLeft
          : ArrowUpRight;
  return (
    <li className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 shadow-soft backdrop-blur transition hover:border-border hover:bg-card/80">
      <div className="relative shrink-0">
        {resolvedIcon ? (
          <img
            src={resolvedIcon}
            alt=""
            className="h-11 w-11 rounded-xl border border-border/40 bg-card object-contain p-1"
            loading="lazy"
          />
        ) : (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconWrap}`}>
            <KindIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.title}</p>
        {tx.subtitle && <p className="truncate text-xs text-muted-foreground">{tx.subtitle}</p>}
      </div>
      <div className="flex flex-col items-end gap-0.5 text-right">
        <span
          className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${valueColor}`}
        >
          {isIn ? "+" : "−"}
          {tx.amount}
          <img src={coinIcon} alt="moedas" className="h-4 w-4 drop-shadow" />
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {date} · {time}
        </span>
      </div>
    </li>
  );
}
