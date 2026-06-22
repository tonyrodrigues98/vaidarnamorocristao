import { useState } from "react";
import { Cookie, Circle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { getArcadeErrorMessage, startPlinko, type ArcadeGameResult } from "@/lib/petArcade";
import {
  ArcadePanel,
  ArcadeStage,
  DifficultyButtons,
  EntryControl,
  ArcadeMetric,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";
import { AutoPlayControls } from "./AutoPlayControls";

export function PlinkoGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [difficulty, setDifficulty] = useState("leve");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [animating, setAnimating] = useState(false);

  async function start(): Promise<boolean> {
    if (!validateEntry(entry, config, balance)) {
      toast.error("Revise a quantidade de moedas.");
      return false;
    }
    setBusy(true);
    setResult(null);
    try {
      const next = await startPlinko(entry, difficulty, createArcadeClientSeed());
      setResult(next);
      setAnimating(true);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      window.setTimeout(() => {
        setAnimating(false);
        onFinished();
      }, 1800);
      return Number(next.new_balance ?? balance) >= entry;
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const data = result?.result ?? {};
  const slots = Array.isArray(data.slots) ? (data.slots as number[]) : [];
  const slot = Number(data.slot ?? 0);

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Cookie className="size-5" />}
    >
      <div className="space-y-4">
        <ArcadeStage className="h-72 border-orange-200/60 bg-gradient-to-b from-orange-950 via-amber-900 to-orange-700" glowClassName="bg-orange-300/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_34%)]" />
          <div className="absolute inset-x-5 top-8 grid grid-cols-7 gap-x-5 gap-y-4 opacity-55">
            {Array.from({ length: 42 }, (_, index) => (
              <Circle key={index} className="size-2 fill-orange-200 text-orange-200/90" />
            ))}
          </div>
          {result ? (
            <motion.div
              key={result.game_id}
              initial={{ left: "50%", top: 10, rotate: 0 }}
              animate={{
                left: `${((slot + 0.5) / Math.max(slots.length, 1)) * 100}%`,
                top: 220,
                rotate: 720,
              }}
              transition={{ duration: 1.65, ease: [0.22, 0.8, 0.3, 1] }}
              className="absolute z-10 -ml-4 grid size-8 place-items-center rounded-full bg-orange-500 text-white shadow-lg"
            >
              <Cookie className="size-5" />
            </motion.div>
          ) : (
            <div className="absolute left-1/2 top-3 -ml-4 grid size-8 place-items-center rounded-full bg-orange-200 text-orange-600">
              <Cookie className="size-5" />
            </div>
          )}
          <div className="absolute inset-x-2 bottom-2 flex gap-1">
            {(slots.length ? slots : [2, 1.5, 1.2, 0.8, 0.6, 0.8, 1.2, 1.5, 2]).map(
              (value, index) => (
              <div
                  key={`${value}-${index}`}
                  className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-xl text-[10px] font-black ${result && index === slot && !animating ? "bg-white text-orange-700 shadow-lg" : "bg-white/12 text-white backdrop-blur-sm"}`}
                >
                  {Number(value).toFixed(Number(value) % 1 ? 1 : 0)}x
                </div>
              ),
            )}
          </div>
        </ArcadeStage>
        <div className="grid grid-cols-2 gap-2">
          <ArcadeMetric label="Entrada atual" value={`${entry} moedas`} tone="dark" />
          <ArcadeMetric
            label="Dificuldade"
            value={difficulty === "leve" ? "Leve" : difficulty === "aventureiro" ? "Aventureiro" : "Radical"}
          />
        </div>

        {!result || animating ? (
          <>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy || animating}
            />
            <DifficultyButtons
              value={difficulty}
              onChange={setDifficulty}
              disabled={busy || animating}
            />
            <StartButton busy={busy || animating} onClick={() => void start()}>
              Começar queda
            </StartButton>
          </>
        ) : (
          <ResultCard result={result} onAgain={() => setResult(null)} />
        )}
        <AutoPlayControls
          cooldownSeconds={config.cooldown_seconds}
          disabled={busy || animating}
          onRound={start}
        />
      </div>
    </ArcadePanel>
  );
}
