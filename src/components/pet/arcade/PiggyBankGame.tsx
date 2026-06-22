import { useEffect, useState } from "react";
import { Clock3, PiggyBank, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  cancelPiggyBank,
  claimPiggyBank,
  getArcadeErrorMessage,
  resumeArcadeGame,
  startPiggyBank,
  type ArcadeGameResult,
} from "@/lib/petArcade";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  ArcadePanel,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";

export function PiggyBankGame({
  config,
  balance,
  activeRound,
  onBalanceChange,
  onFinished,
}: ArcadeGameProps) {
  const cfg = config.difficulty_config as {
    default_hours?: number;
    min_hours?: number;
    max_hours?: number;
    bonus_percent?: number;
    allow_cancel?: boolean;
  };
  const [deposit, setDeposit] = useState(Math.min(config.min_entry, balance));
  const [hours, setHours] = useState(Number(cfg.default_hours ?? 8));
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState<ArcadeGameResult | null>(null);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeRound || round || result) return;
    void resumeArcadeGame(activeRound.round_id)
      .then(setRound)
      .catch(() => undefined);
  }, [activeRound, result, round]);

  useEffect(() => {
    if (!round) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [round]);

  async function start() {
    if (deposit < config.min_entry || deposit > config.max_entry || deposit > balance)
      return toast.error("Revise o depósito.");
    setBusy(true);
    try {
      const next = await startPiggyBank(deposit, hours);
      setRound(next);
      setResult(null);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (!round) return;
    setBusy(true);
    try {
      const next = await claimPiggyBank(round.game_id);
      setResult(next);
      setRound(null);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!round) return;
    setBusy(true);
    try {
      const next = await cancelPiggyBank(round.game_id);
      setResult(next);
      setRound(null);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const unlockAt = round?.unlock_at ? new Date(String(round.unlock_at)).getTime() : 0;
  const startedAt = unlockAt - Number(round?.hours ?? hours) * 3_600_000;
  const progress = round
    ? Math.max(0, Math.min(100, ((now - startedAt) / Math.max(unlockAt - startedAt, 1)) * 100))
    : 0;
  const ready = Boolean(round && now >= unlockAt);
  const remainingMs = Math.max(0, unlockAt - now);
  const remainingHours = Math.floor(remainingMs / 3_600_000);
  const remainingMinutes = Math.ceil((remainingMs % 3_600_000) / 60_000);

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<PiggyBank className="size-5" />}
    >
      <div className="space-y-5">
        <div className="relative grid min-h-64 place-items-center overflow-hidden rounded-[30px] bg-gradient-to-br from-amber-100 via-white to-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <span aria-hidden className="absolute -right-10 top-0 size-36 rounded-full bg-amber-200/55 blur-3xl" />
          <motion.div
            animate={{ scale: round ? 1 + progress / 500 : 1 }}
            className="relative grid size-40 place-items-center rounded-full bg-white/70 shadow-xl backdrop-blur"
          >
            <PiggyBank className="size-24 text-rose-500" />
            {round ? (
              <span className="absolute bottom-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950">
                <CoinIcon className="size-4" /> {Number(round.deposit ?? deposit)}
              </span>
            ) : null}
          </motion.div>
          {round ? (
            <div className="absolute inset-x-5 bottom-4 h-2 overflow-hidden rounded-full bg-white">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
              />
            </div>
          ) : null}
        </div>

        {!round && !result ? (
          <>
            <EntryControl
              value={deposit}
              onChange={setDeposit}
              config={config}
              balance={balance}
              disabled={busy}
              label="Depósito no cofrinho"
            />
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>Tempo de cuidado</span>
                <span>{hours} horas</span>
              </div>
              <input
                type="range"
                min={Number(cfg.min_hours ?? 8)}
                max={Number(cfg.max_hours ?? 24)}
                value={hours}
                onChange={(event) => setHours(Number(event.target.value))}
                className="w-full accent-rose-500"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Bônus configurado: {Number(cfg.bonus_percent ?? 5)}%
              </p>
            </div>
            <StartButton busy={busy} onClick={() => void start()}>
              Guardar moedas
            </StartButton>
          </>
        ) : round ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              {ready ? (
                <Sparkles className="size-6 text-amber-600" />
              ) : (
                <Clock3 className="size-6 text-amber-600" />
              )}
              <div>
                <p className="font-black text-neutral-950">
                  {ready ? "Cofrinho pronto" : "Cofrinho em crescimento"}
                </p>
                <p className="text-xs text-neutral-600">
                  {ready
                    ? "Seu pet cuidou das moedas até o tempo combinado."
                    : `Faltam cerca de ${remainingHours}h ${remainingMinutes}min.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={busy || !ready}
              onClick={() => void claim()}
              className="h-12 w-full rounded-2xl bg-rose-500 font-black text-white disabled:opacity-40"
            >
              Abrir cofrinho
            </button>
            {cfg.allow_cancel ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void cancel()}
                className="h-10 w-full rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600"
              >
                Encerrar cuidado antecipadamente
              </button>
            ) : null}
          </div>
        ) : result ? (
          <ResultCard
            result={result}
            title={result.status === "cancelled" ? "Cofrinho encerrado" : "Cofrinho aberto"}
            onAgain={() => setResult(null)}
          />
        ) : null}
      </div>
    </ArcadePanel>
  );
}
