import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gem, Loader2, Map, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  collectTreasureReward,
  getArcadeErrorMessage,
  revealTreasureCell,
  startTreasureRound,
  type ActiveArcadeRound,
  type PetArcadeConfig,
  type TreasureDifficulty,
  type TreasureRound,
} from "@/lib/petArcade";

const DIFFICULTIES: { id: TreasureDifficulty; label: string; note: string }[] = [
  { id: "leve", label: "Leve", note: "Menos armadilhas" },
  { id: "aventureiro", label: "Aventureiro", note: "Equilíbrio maior" },
  { id: "radical", label: "Radical", note: "Recompensa mais rápida" },
];

type Props = {
  config: PetArcadeConfig;
  balance: number;
  activeRound?: ActiveArcadeRound;
  onBalanceChange: (balance: number) => void;
  onFinished: () => void;
};

export function TreasureAdventure({
  config,
  balance,
  activeRound,
  onBalanceChange,
  onFinished,
}: Props) {
  const [entry, setEntry] = useState(Math.min(25, config.max_entry));
  const [difficulty, setDifficulty] = useState<TreasureDifficulty>("leve");
  const [round, setRound] = useState<TreasureRound | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeRound || activeRound.game_type !== "treasure") return;
    setRound({
      round_id: activeRound.round_id,
      status: "active",
      difficulty: activeRound.difficulty ?? "leve",
      grid_size: activeRound.grid_size ?? config.treasure_grid_size,
      trap_count: activeRound.trap_count ?? 0,
      revealed_positions: activeRound.revealed_positions ?? [],
      safe_reveals: activeRound.safe_reveals ?? 0,
      multiplier: Number(activeRound.multiplier),
      server_seed_hash: activeRound.server_seed_hash,
      client_seed: activeRound.client_seed,
      nonce: activeRound.nonce,
    });
  }, [activeRound, config.treasure_grid_size]);

  async function startRound() {
    if (entry > balance) {
      toast.error("Saldo insuficiente para esta entrada.");
      return;
    }
    setBusy(true);
    try {
      const data = await startTreasureRound({
        entryCoins: entry,
        difficulty,
        clientSeed: crypto.randomUUID(),
      });
      setRound({ ...data, revealed_positions: [] });
      if (typeof data.new_balance === "number") onBalanceChange(data.new_balance);
      toast.success("Aventura iniciada");
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function reveal(position: number) {
    if (!round || round.status !== "active" || busy) return;
    if ((round.revealed_positions ?? []).includes(position)) return;
    setBusy(true);
    try {
      const result = await revealTreasureCell(round.round_id, position);
      setRound((current) =>
        current
          ? {
              ...current,
              ...result,
              revealed_positions: [...(current.revealed_positions ?? []), position],
            }
          : result,
      );
      if (result.status === "lost") {
        toast.error("Uma armadilha encerrou a aventura.");
        onFinished();
      }
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function collect() {
    if (!round || round.status !== "active" || busy) return;
    setBusy(true);
    try {
      const result = await collectTreasureReward(round.round_id);
      setRound((current) => (current ? { ...current, ...result } : result));
      if (typeof result.new_balance === "number") onBalanceChange(result.new_balance);
      toast.success(`Você recolheu ${result.reward_coins ?? 0} moedas.`);
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const revealed = new Set(round?.revealed_positions ?? []);
  const traps = new Set(round?.trap_positions ?? []);
  const possibleReward =
    round?.potential_reward ?? Math.floor(entry * Number(round?.multiplier ?? 1));
  const canCollect = round?.status === "active" && (round.safe_reveals ?? 0) > 0;

  return (
    <section className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_24px_70px_rgba(180,83,9,0.10)]">
      <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
            <Gem className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-neutral-950">Campo de Tesouros</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Revele casas seguras e recolha as moedas antes de encontrar uma armadilha.
            </p>
          </div>
        </div>
      </div>

      {!round ? (
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">
              Moedas de entrada
            </label>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <CoinIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                <Input
                  type="number"
                  min={config.min_entry}
                  max={config.max_entry}
                  value={entry}
                  onChange={(event) => setEntry(Number(event.target.value))}
                  className="h-12 rounded-2xl pl-10 text-base font-bold"
                />
              </div>
              {[10, 25, 50, 100]
                .filter((value) => value <= config.max_entry)
                .map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEntry(value)}
                    className="h-10 min-w-10 rounded-xl bg-neutral-100 px-2 text-xs font-bold text-neutral-700"
                  >
                    {value}
                  </button>
                ))}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">
              Permitido: {config.min_entry} a {config.max_entry} moedas
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-neutral-500">Dificuldade</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDifficulty(item.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    difficulty === item.id
                      ? "border-amber-400 bg-amber-50 ring-2 ring-amber-100"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <span className="block text-xs font-bold text-neutral-900">{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-tight text-neutral-500">
                    {item.note}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => void startRound()}
            disabled={busy || entry < config.min_entry || entry > config.max_entry}
            className="h-12 w-full rounded-2xl bg-amber-500 font-bold text-white hover:bg-amber-600"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Map className="h-4 w-4" />}
            Começar aventura
          </Button>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-950 p-3 text-white">
              <p className="text-[10px] uppercase text-white/60">Multiplicador</p>
              <p className="mt-1 text-2xl font-black">{Number(round.multiplier).toFixed(2)}x</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-900">
              <p className="text-[10px] uppercase text-emerald-700">Pode recolher</p>
              <p className="mt-1 flex items-center gap-1 text-2xl font-black">
                <CoinIcon className="h-5 w-5" /> {possibleReward}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2" aria-label="Campo de casas fechadas">
            {Array.from({ length: round.grid_size }).map((_, position) => {
              const isRevealed = revealed.has(position);
              const isTrap = traps.has(position);
              return (
                <motion.button
                  key={position}
                  type="button"
                  whileTap={round.status === "active" && !isRevealed ? { scale: 0.92 } : undefined}
                  onClick={() => void reveal(position)}
                  disabled={busy || round.status !== "active" || isRevealed}
                  className={`aspect-square rounded-2xl border transition ${
                    isTrap
                      ? "border-rose-200 bg-rose-100 text-rose-600"
                      : isRevealed
                        ? "border-emerald-200 bg-emerald-100 text-emerald-600"
                        : "border-amber-200 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 shadow-sm"
                  }`}
                  aria-label={
                    isRevealed ? `Casa ${position + 1} revelada` : `Revelar casa ${position + 1}`
                  }
                >
                  {isTrap ? (
                    <TriangleAlert className="mx-auto h-5 w-5" />
                  ) : isRevealed ? (
                    <ShieldCheck className="mx-auto h-5 w-5" />
                  ) : (
                    <Gem className="mx-auto h-4 w-4 opacity-55" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {round.status === "active" ? (
            <Button
              onClick={() => void collect()}
              disabled={!canCollect || busy}
              className="mt-4 h-12 w-full rounded-2xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gem className="h-4 w-4" />}
              Recolher moedas
            </Button>
          ) : (
            <div
              className={`mt-4 rounded-2xl p-4 ${round.status === "collected" ? "bg-emerald-50" : "bg-rose-50"}`}
            >
              <p className="font-bold text-neutral-950">
                {round.status === "collected" ? "Tesouro recolhido" : "Aventura encerrada"}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Entrada {entry} · {Number(round.multiplier).toFixed(2)}x · Recompensa{" "}
                {round.reward_coins ?? 0}
              </p>
              <Button
                variant="outline"
                onClick={() => setRound(null)}
                className="mt-3 h-10 rounded-xl"
              >
                Jogar novamente
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
