import { useState } from "react";
import { Disc3, Triangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { getArcadeErrorMessage, startWheel, type ArcadeGameResult } from "@/lib/petArcade";
import {
  ArcadePanel,
  ArcadeStage,
  ArcadeMetric,
  DifficultyButtons,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";
import { AutoPlayControls } from "./AutoPlayControls";
import wheelArtwork from "@/assets/pet-arcade/wheel-card.webp";

type WheelSegment = { m: number; w: number };

export function WheelGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [difficulty, setDifficulty] = useState("leve");
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const defaults = ((
    config.difficulty_config[difficulty] as { segments?: WheelSegment[] } | undefined
  )?.segments ?? []) as WheelSegment[];
  const resultSegments = (result?.result?.segments as WheelSegment[] | undefined) ?? defaults;

  async function start(): Promise<boolean> {
    if (!validateEntry(entry, config, balance)) {
      toast.error("Revise a quantidade de moedas.");
      return false;
    }
    setBusy(true);
    setResult(null);
    try {
      const next = await startWheel(entry, difficulty, createArcadeClientSeed());
      const index = Number(next.result?.segment_index ?? 0);
      const count = Math.max(
        (next.result?.segments as unknown[] | undefined)?.length ?? defaults.length,
        1,
      );
      setResult(next);
      setSpinning(true);
      setRotation((current) => current + 1440 + (360 - index * (360 / count)));
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      window.setTimeout(() => {
        setSpinning(false);
        onFinished();
      }, 2500);
      return Number(next.new_balance ?? balance) >= entry;
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const colors = ["#fb7185", "#f97316", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];
  const wheelGradient = resultSegments.length
    ? `conic-gradient(${resultSegments.map((_, index) => `${colors[index % colors.length]} ${index * (100 / resultSegments.length)}% ${(index + 1) * (100 / resultSegments.length)}%`).join(",")})`
    : "conic-gradient(#fb7185 0 20%,#f97316 20% 40%,#fbbf24 40% 60%,#34d399 60% 80%,#60a5fa 80% 100%)";

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Disc3 className="size-5" />}
    >
      <div className="space-y-5">
        <ArcadeStage
          className="border-rose-200/60 bg-gradient-to-br from-rose-950 via-orange-900 to-amber-700"
          glowClassName="bg-rose-300/20"
        >
          <img
            src={wheelArtwork}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
          />
          <div className="relative mx-auto size-64 max-w-full">
            <Triangle className="absolute left-1/2 top-0 z-10 size-8 -translate-x-1/2 rotate-180 fill-neutral-950 text-neutral-950" />
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 2.35, ease: [0.12, 0.7, 0.15, 1] }}
              className="absolute inset-5 rounded-full border-8 border-white shadow-[0_15px_45px_rgba(15,23,42,0.2)]"
              style={{ background: wheelGradient }}
            >
              {resultSegments.map((segment, index) => {
                const angle =
                  index * (360 / resultSegments.length) + 360 / resultSegments.length / 2;
                return (
                  <span
                    key={`${segment.m}-${index}`}
                    className="absolute left-1/2 top-1/2 text-xs font-black text-white drop-shadow"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-86px) rotate(${-angle}deg)`,
                    }}
                  >
                    {segment.m}x
                  </span>
                );
              })}
              <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg">
                <Disc3 className="size-6 text-rose-500" />
              </span>
            </motion.div>
          </div>
        </ArcadeStage>
        <div className="grid grid-cols-2 gap-2">
          <ArcadeMetric label="Entrada" value={`${entry} moedas`} tone="dark" />
          <ArcadeMetric
            label="Modo"
            value={
              difficulty === "leve"
                ? "Leve"
                : difficulty === "aventureiro"
                  ? "Aventureiro"
                  : "Radical"
            }
          />
        </div>

        {!result || spinning ? (
          <>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy || spinning}
            />
            <DifficultyButtons
              value={difficulty}
              onChange={setDifficulty}
              disabled={busy || spinning}
            />
            <StartButton busy={busy || spinning} onClick={() => void start()}>
              Girar a roda
            </StartButton>
          </>
        ) : (
          <ResultCard result={result} onAgain={() => setResult(null)} />
        )}
        <AutoPlayControls
          cooldownSeconds={config.cooldown_seconds}
          disabled={busy || spinning}
          onRound={start}
        />
      </div>
    </ArcadePanel>
  );
}
