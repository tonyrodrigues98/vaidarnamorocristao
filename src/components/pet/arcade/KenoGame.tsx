import { useEffect, useMemo, useState } from "react";
import { Grid3X3, Check } from "lucide-react";
import { toast } from "sonner";

import { getArcadeErrorMessage, startKeno, type ArcadeGameResult } from "@/lib/petArcade";
import { cn } from "@/lib/utils";
import {
  ArcadePanel,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";

export function KenoGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const cfg = config.difficulty_config as { grid_size?: number; pick_count?: number };
  const gridSize = Number(cfg.grid_size ?? 40);
  const pickCount = Number(cfg.pick_count ?? 6);
  const [entry, setEntry] = useState(config.min_entry);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const data = result?.result ?? {};
  const drawn = useMemo(
    () => (Array.isArray(data.drawn_numbers) ? (data.drawn_numbers as number[]) : []),
    [data.drawn_numbers],
  );

  useEffect(() => {
    if (!result || revealCount >= drawn.length) return;
    const timer = window.setTimeout(() => setRevealCount((value) => value + 1), 120);
    return () => window.clearTimeout(timer);
  }, [drawn.length, result, revealCount]);

  function toggle(number: number) {
    if (busy || result) return;
    setSelected((current) =>
      current.includes(number)
        ? current.filter((value) => value !== number)
        : current.length < pickCount
          ? [...current, number]
          : current,
    );
  }

  async function start() {
    if (!validateEntry(entry, config, balance))
      return toast.error("Revise a quantidade de moedas.");
    if (selected.length !== pickCount) return toast.error(`Escolha ${pickCount} números.`);
    setBusy(true);
    try {
      const next = await startKeno(entry, selected, createArcadeClientSeed());
      setResult(next);
      setRevealCount(0);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const revealed = drawn.slice(0, revealCount);
  const done = result && revealCount >= drawn.length;

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Grid3X3 className="size-5" />}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-violet-50 px-4 py-3 text-xs font-bold text-violet-800">
          <span>
            Escolhas: {selected.length}/{pickCount}
          </span>
          {result ? (
            <span>Acertos: {Number(data.hits ?? 0)}</span>
          ) : (
            <span>Grade com {gridSize} números</span>
          )}
        </div>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: gridSize }, (_, index) => index + 1).map((number) => {
            const picked = selected.includes(number);
            const drawnNow = revealed.includes(number);
            return (
              <button
                key={number}
                type="button"
                onClick={() => toggle(number)}
                className={cn(
                  "aspect-square rounded-lg border text-[11px] font-black transition",
                  drawnNow && picked
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : drawnNow
                      ? "border-amber-400 bg-amber-100 text-amber-800"
                      : picked
                        ? "border-violet-500 bg-violet-500 text-white"
                        : "border-neutral-200 bg-white text-neutral-600",
                )}
              >
                {drawnNow && picked ? <Check className="mx-auto size-3" /> : number}
              </button>
            );
          })}
        </div>
        {!result ? (
          <>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy}
            />
            <StartButton
              busy={busy}
              disabled={selected.length !== pickCount}
              onClick={() => void start()}
            >
              Revelar números
            </StartButton>
          </>
        ) : done ? (
          <ResultCard
            result={result}
            title={`${Number(data.hits ?? 0)} acertos nesta rodada`}
            onAgain={() => {
              setResult(null);
              setSelected([]);
              setRevealCount(0);
            }}
          />
        ) : (
          <div className="rounded-2xl bg-neutral-950 p-4 text-center text-sm font-bold text-white">
            Revelando a sequência...
          </div>
        )}
      </div>
    </ArcadePanel>
  );
}
