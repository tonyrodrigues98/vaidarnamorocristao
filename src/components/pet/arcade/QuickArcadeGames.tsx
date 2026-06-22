import { useMemo, useState } from "react";
import { Dices, Heart, PawPrint } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  getArcadeErrorMessage,
  startCoinFlip,
  startDice,
  type ArcadeGameResult,
} from "@/lib/petArcade";
import { cn } from "@/lib/utils";
import {
  ArcadePanel,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";
import { AutoPlayControls } from "./AutoPlayControls";

export function CoinFlipGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [side, setSide] = useState<"paw" | "heart">("paw");
  const [busy, setBusy] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);

  async function start(): Promise<boolean> {
    if (!validateEntry(entry, config, balance)) {
      toast.error("Revise a quantidade de moedas.");
      return false;
    }
    setBusy(true);
    setResult(null);
    try {
      const next = await startCoinFlip(entry, side, createArcadeClientSeed());
      setResult(next);
      setFlipping(true);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      window.setTimeout(() => {
        setFlipping(false);
        onFinished();
      }, 1500);
      return Number(next.new_balance ?? balance) >= entry;
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const outcome = String(result?.result?.outcome ?? side);
  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<PawPrint className="size-5" />}
    >
      <div className="space-y-5">
        <div className="grid min-h-64 place-items-center rounded-3xl bg-gradient-to-br from-pink-100 via-white to-amber-100 [perspective:800px]">
          <motion.div
            animate={{
              rotateY: flipping
                ? 1800 + (outcome === "heart" ? 180 : 0)
                : outcome === "heart"
                  ? 180
                  : 0,
              y: flipping ? [0, -55, 0] : 0,
            }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="relative size-36 rounded-full [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 grid place-items-center rounded-full border-8 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-500 text-amber-900 shadow-2xl [backface-visibility:hidden]">
              <PawPrint className="size-14" />
            </div>
            <div className="absolute inset-0 grid place-items-center rounded-full border-8 border-rose-300 bg-gradient-to-br from-rose-100 to-rose-500 text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Heart className="size-14 fill-current" />
            </div>
          </motion.div>
        </div>
        {!result || flipping ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(["paw", "heart"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={busy || flipping}
                  onClick={() => setSide(value)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-2xl border font-bold",
                    side === value
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-neutral-200 bg-white text-neutral-600",
                  )}
                >
                  {value === "paw" ? <PawPrint className="size-4" /> : <Heart className="size-4" />}{" "}
                  {value === "paw" ? "Patinha" : "Coração"}
                </button>
              ))}
            </div>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy || flipping}
            />
            <StartButton busy={busy || flipping} onClick={() => void start()}>
              Girar moeda
            </StartButton>
          </>
        ) : (
          <ResultCard result={result} onAgain={() => setResult(null)} />
        )}
        <AutoPlayControls
          cooldownSeconds={config.cooldown_seconds}
          disabled={busy || flipping}
          onRound={start}
        />
      </div>
    </ArcadePanel>
  );
}

export function DiceGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [target, setTarget] = useState(50);
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const chance = condition === "above" ? 100 - target : target;
  const estimatedMultiplier = useMemo(
    () => Math.min(config.max_multiplier, 0.97 / Math.max(chance / 101, 0.01)),
    [chance, config.max_multiplier],
  );

  async function start(): Promise<boolean> {
    if (!validateEntry(entry, config, balance)) {
      toast.error("Revise a quantidade de moedas.");
      return false;
    }
    setBusy(true);
    setResult(null);
    try {
      const next = await startDice(entry, condition, target, createArcadeClientSeed());
      setResult(next);
      setRolling(true);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      window.setTimeout(() => {
        setRolling(false);
        onFinished();
      }, 1300);
      return Number(next.new_balance ?? balance) >= entry;
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Dices className="size-5" />}
    >
      <div className="space-y-5">
        <div className="grid min-h-60 place-items-center rounded-3xl bg-gradient-to-br from-blue-950 to-indigo-800 text-white">
          <motion.div
            animate={{ rotate: rolling ? 1080 : 0, scale: rolling ? [1, 0.75, 1.1, 1] : 1 }}
            transition={{ duration: 1.2 }}
            className="grid size-32 place-items-center rounded-3xl border border-white/30 bg-white/10 shadow-2xl backdrop-blur"
          >
            {result && !rolling ? (
              <span className="text-5xl font-black">{Number(result.result?.value ?? 0)}</span>
            ) : (
              <Dices className="size-16" />
            )}
          </motion.div>
        </div>
        {!result || rolling ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition("above")}
                className={cn(
                  "h-11 rounded-xl border text-sm font-bold",
                  condition === "above"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-neutral-200",
                )}
              >
                Acima de
              </button>
              <button
                type="button"
                onClick={() => setCondition("below")}
                className={cn(
                  "h-11 rounded-xl border text-sm font-bold",
                  condition === "below"
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-neutral-200",
                )}
              >
                Abaixo de
              </button>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="mb-3 flex items-center justify-between text-xs font-bold text-neutral-600">
                <span>Alvo {target}</span>
                <span>
                  Chance aproximada {chance}% · {estimatedMultiplier.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={95}
                value={target}
                onChange={(event) => setTarget(Number(event.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy || rolling}
            />
            <StartButton busy={busy || rolling} onClick={() => void start()}>
              Lançar dados
            </StartButton>
          </>
        ) : (
          <ResultCard
            result={result}
            title={`Resultado ${Number(result.result?.value ?? 0)}`}
            onAgain={() => setResult(null)}
          />
        )}
        <AutoPlayControls
          cooldownSeconds={config.cooldown_seconds}
          disabled={busy || rolling}
          onRound={start}
        />
      </div>
    </ArcadePanel>
  );
}
