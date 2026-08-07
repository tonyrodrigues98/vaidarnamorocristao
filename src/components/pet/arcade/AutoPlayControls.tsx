import { useEffect, useRef, useState } from "react";
import { InfinityIcon, Loader2, Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

type AutoPlayControlsProps = {
  cooldownSeconds: number;
  disabled?: boolean;
  onRound: () => Promise<boolean>;
};

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function AutoPlayControls({ cooldownSeconds, disabled, onRound }: AutoPlayControlsProps) {
  const [roundLimit, setRoundLimit] = useState(5);
  const [completed, setCompleted] = useState(0);
  const [running, setRunning] = useState(false);
  const stopRequested = useRef(false);

  useEffect(
    () => () => {
      stopRequested.current = true;
    },
    [],
  );

  async function start() {
    if (running || disabled) return;
    stopRequested.current = false;
    setCompleted(0);
    setRunning(true);
    let count = 0;
    const delay = Math.max(500, cooldownSeconds * 1000 + 150);

    try {
      while (!stopRequested.current && (roundLimit === 0 || count < roundLimit)) {
        const canContinue = await onRound();
        if (!canContinue || stopRequested.current) break;
        count += 1;
        setCompleted(count);
        if (roundLimit !== 0 && count >= roundLimit) break;
        await wait(delay);
      }
    } finally {
      setRunning(false);
    }
  }

  function stop() {
    stopRequested.current = true;
  }

  return (
    <div className="rounded-[26px] border border-neutral-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-3 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-neutral-800">Modo automático</p>
          <p className="text-[10px] text-neutral-500">
            0 continua até Parar ou até um limite do Arcade.
          </p>
        </div>
        {running ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600">
            <Loader2 className="size-3 animate-spin" /> {completed} concluídas
          </span>
        ) : null}
      </div>
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Quantidade de partidas automáticas</span>
          <input
            type="number"
            min={0}
            max={100}
            value={roundLimit}
            disabled={running}
            onChange={(event) =>
              setRoundLimit(Math.min(100, Math.max(0, Number(event.target.value) || 0)))
            }
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-bold outline-none focus:border-rose-400"
          />
          {roundLimit === 0 ? (
            <InfinityIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          ) : null}
        </label>
        {running ? (
          <Button type="button" variant="destructive" className="h-11 rounded-xl" onClick={stop}>
            <Square className="size-4" /> Parar
          </Button>
        ) : (
          <Button
            type="button"
            className="h-11 rounded-xl bg-neutral-950 text-white"
            disabled={disabled}
            onClick={() => void start()}
          >
            <Play className="size-4" /> Iniciar
          </Button>
        )}
      </div>
    </div>
  );
}
