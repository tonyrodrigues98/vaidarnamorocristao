import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Layers3, Coins } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import {
  chooseHilo,
  collectHilo,
  getArcadeErrorMessage,
  resumeArcadeGame,
  startHilo,
  type ArcadeGameResult,
} from "@/lib/petArcade";
import {
  ArcadePanel,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";

const CARD_LABELS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function HiloGame({
  config,
  balance,
  activeRound,
  onBalanceChange,
  onFinished,
}: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState<ArcadeGameResult | null>(null);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);

  useEffect(() => {
    if (!activeRound || round || result) return;
    void resumeArcadeGame(activeRound.round_id)
      .then(setRound)
      .catch(() => undefined);
  }, [activeRound, result, round]);

  async function start() {
    if (!validateEntry(entry, config, balance))
      return toast.error("Revise a quantidade de moedas.");
    setBusy(true);
    setResult(null);
    try {
      const next = await startHilo(entry, createArcadeClientSeed());
      setRound(next);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function choose(choice: "higher" | "lower") {
    if (!round) return;
    setBusy(true);
    try {
      const next = await chooseHilo(round.game_id, choice, Number(round.step ?? 0));
      if (next.status === "active") setRound({ ...round, ...next });
      else {
        setResult(next);
        setRound(null);
        if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
        onFinished();
      }
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function collect() {
    if (!round) return;
    setBusy(true);
    try {
      const next = await collectHilo(round.game_id);
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

  const card = Number(round?.current_card ?? result?.result?.next_card ?? 1);
  const step = Number(round?.step ?? 0);

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Layers3 className="size-5" />}
    >
      <div className="space-y-5">
        <div className="relative grid min-h-72 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-900 to-rose-900 p-6 text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_30%,white_0,transparent_35%),radial-gradient(circle_at_70%_70%,#fb7185_0,transparent_35%)]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={`${card}-${step}`}
              initial={{ rotateY: 90, scale: 0.85 }}
              animate={{ rotateY: 0, scale: 1 }}
              exit={{ rotateY: -90, scale: 0.85 }}
              className="relative flex h-48 w-36 flex-col justify-between rounded-3xl border border-white/60 bg-white p-4 text-indigo-950 shadow-2xl"
            >
              <span className="text-2xl font-black">{CARD_LABELS[Math.max(0, card - 1)]}</span>
              <span className="self-center text-5xl font-black text-rose-500">V</span>
              <span className="self-end rotate-180 text-2xl font-black">
                {CARD_LABELS[Math.max(0, card - 1)]}
              </span>
            </motion.div>
          </AnimatePresence>
          {round ? (
            <div className="relative mt-4 flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                Sequência {step}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                {Number(round.multiplier ?? 1).toFixed(2)}x
              </span>
            </div>
          ) : null}
        </div>

        {!round && !result ? (
          <>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy}
            />
            <StartButton busy={busy} onClick={() => void start()}>
              Começar sequência
            </StartButton>
          </>
        ) : round ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void choose("higher")}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-black text-white disabled:opacity-50"
            >
              <ArrowUp className="size-5" /> Maior
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void choose("lower")}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-sky-500 font-black text-white disabled:opacity-50"
            >
              <ArrowDown className="size-5" /> Menor
            </button>
            {step > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void collect()}
                className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-neutral-950 font-black text-white disabled:opacity-50"
              >
                <Coins className="size-4" /> Recolher recompensa
              </button>
            ) : null}
          </div>
        ) : result ? (
          <ResultCard result={result} onAgain={() => setResult(null)} />
        ) : null}
      </div>
    </ArcadePanel>
  );
}
