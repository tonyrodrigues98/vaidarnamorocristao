import { useEffect, useState } from "react";
import { Building2, DoorOpen, Coins, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  chooseTowerTile,
  collectTowers,
  getArcadeErrorMessage,
  resumeArcadeGame,
  startTowers,
  type ArcadeGameResult,
} from "@/lib/petArcade";
import { cn } from "@/lib/utils";
import {
  ArcadeMetric,
  ArcadePanel,
  ArcadeStage,
  DifficultyButtons,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";

export function TowersGame({
  config,
  balance,
  activeRound,
  onBalanceChange,
  onFinished,
}: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [difficulty, setDifficulty] = useState("leve");
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState<ArcadeGameResult | null>(null);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [lastChoice, setLastChoice] = useState<{ tile: number; safe: number[] } | null>(null);

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
    setLastChoice(null);
    try {
      const next = await startTowers(entry, difficulty, createArcadeClientSeed());
      setRound(next);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function choose(tile: number) {
    if (!round) return;
    setBusy(true);
    try {
      const next = await chooseTowerTile(round.game_id, tile, Number(round.floor ?? 0));
      const summary = (next.result ?? next) as Record<string, unknown>;
      const safe = Array.isArray(summary.safe_tiles) ? (summary.safe_tiles as number[]) : [];
      setLastChoice({ tile, safe });
      window.setTimeout(() => {
        if (next.status === "active") setRound({ ...round, ...next });
        else {
          setResult(next);
          setRound(null);
          if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
          onFinished();
        }
        setLastChoice(null);
      }, 650);
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
      const next = await collectTowers(round.game_id);
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

  const floor = Number(round?.floor ?? 0);
  const floors = Number(round?.floors ?? 6);
  const options = Number(round?.options ?? 3);

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Building2 className="size-5" />}
    >
      <div className="space-y-4">
        <ArcadeStage
          className="bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 p-4"
          glowClassName="bg-emerald-400/25"
        >
          <div className="mb-4 flex items-center justify-between text-xs font-bold">
            <span>
              Andar {Math.min(floor + 1, floors)} de {floors}
            </span>
            <span>{Number(round?.multiplier ?? 1).toFixed(2)}x</span>
          </div>
          <div className="space-y-2 [perspective:700px]">
            {Array.from({ length: floors }, (_, index) => floors - index).map((level) => (
              <div
                key={level}
                className={cn(
                  "flex h-8 items-center justify-center rounded-xl border text-xs font-bold",
                  level <= floor
                    ? "border-emerald-300 bg-emerald-400/30"
                    : level === floor + 1
                      ? "border-white bg-white/15"
                      : "border-white/10 bg-black/10 text-white/40",
                )}
              >
                {level <= floor ? <Check className="mr-1 size-3" /> : null} Andar {level}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ArcadeMetric label="Andar atual" value={`${Math.min(floor + 1, floors)}/${floors}`} />
            <ArcadeMetric
              label="Multiplicador"
              value={`${Number(round?.multiplier ?? 1).toFixed(2)}x`}
              tone="success"
            />
          </div>
        </ArcadeStage>

        {!round && !result ? (
          <>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy}
            />
            <DifficultyButtons value={difficulty} onChange={setDifficulty} disabled={busy} />
            <StartButton busy={busy} onClick={() => void start()}>
              Entrar na torre
            </StartButton>
          </>
        ) : round ? (
          <>
            <p className="text-center text-sm font-bold text-neutral-700">
              Escolha uma porta para subir
            </p>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${options}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: options }, (_, tile) => {
                const revealed = lastChoice !== null;
                const safe = lastChoice?.safe.includes(tile);
                return (
                  <motion.button
                    key={tile}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    disabled={busy || revealed}
                    onClick={() => void choose(tile)}
                    className={cn(
                      "grid aspect-[0.8] place-items-center rounded-2xl border-2 shadow-lg transition duration-300",
                      revealed
                        ? safe
                          ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                          : lastChoice?.tile === tile
                            ? "border-rose-400 bg-rose-100 text-rose-700"
                            : "border-neutral-200 bg-neutral-50 text-neutral-300"
                        : "border-amber-300 bg-gradient-to-b from-amber-50 via-amber-100 to-orange-200 text-amber-700 shadow-amber-100",
                    )}
                  >
                    {revealed ? (
                      safe ? (
                        <Check className="size-7" />
                      ) : (
                        <X className="size-7" />
                      )
                    ) : (
                      <DoorOpen className="size-7" />
                    )}
                  </motion.button>
                );
              })}
            </div>
            {floor > 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void collect()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 font-black text-white disabled:opacity-50"
              >
                <Coins className="size-4" /> Recolher moedas
              </button>
            ) : null}
          </>
        ) : result ? (
          <ResultCard result={result} onAgain={() => setResult(null)} />
        ) : null}
      </div>
    </ArcadePanel>
  );
}
