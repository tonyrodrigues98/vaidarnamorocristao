import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Loader2, Rocket, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PetImg } from "@/components/pet/PetImg";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  collectFlightReward,
  finalizeFlightRound,
  getArcadeErrorMessage,
  startFlightRound,
  type ActiveArcadeRound,
  type FlightRound,
  type PetArcadeConfig,
} from "@/lib/petArcade";

type Props = {
  config: PetArcadeConfig;
  balance: number;
  petImage: string | null;
  activeRound?: ActiveArcadeRound;
  recentMultipliers: number[];
  onBalanceChange: (balance: number) => void;
  onFinished: () => void;
};

export function StellarFlight({
  config,
  balance,
  petImage,
  activeRound,
  recentMultipliers,
  onBalanceChange,
  onFinished,
}: Props) {
  const [entry, setEntry] = useState(Math.min(25, config.max_entry));
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoValue, setAutoValue] = useState(2);
  const [round, setRound] = useState<FlightRound | null>(null);
  const [displayMultiplier, setDisplayMultiplier] = useState(1);
  const [clockOffset, setClockOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const polling = useRef(false);

  useEffect(() => {
    if (!activeRound || activeRound.game_type !== "flight") return;
    setRound({
      round_id: activeRound.round_id,
      status: "active",
      started_at: activeRound.started_at,
      multiplier: Number(activeRound.multiplier),
      auto_collect_multiplier: activeRound.auto_collect_multiplier,
      server_seed_hash: activeRound.server_seed_hash,
      client_seed: activeRound.client_seed,
      nonce: activeRound.nonce,
    });
  }, [activeRound]);

  useEffect(() => {
    if (!round || round.status !== "active" || !round.started_at) return;
    const started = Date.parse(round.started_at);
    const animation = window.setInterval(() => {
      const elapsedSeconds = Math.max(0, Date.now() + clockOffset - started) / 1000;
      setDisplayMultiplier(Math.min(config.max_multiplier, Math.exp(elapsedSeconds / 12)));
    }, 60);
    return () => window.clearInterval(animation);
  }, [clockOffset, config.max_multiplier, round]);

  useEffect(() => {
    if (!round || round.status !== "active") return;
    let cancelled = false;
    const check = async () => {
      if (polling.current) return;
      polling.current = true;
      try {
        const result = await finalizeFlightRound(round.round_id);
        if (cancelled) return;
        if (result.status !== "active") {
          setRound((current) => (current ? { ...current, ...result } : result));
          setDisplayMultiplier(Number(result.multiplier));
          if (typeof result.new_balance === "number") onBalanceChange(result.new_balance);
          if (result.status === "collected") {
            toast.success(`Você recolheu ${result.reward_coins ?? 0} moedas.`);
          } else {
            toast.error("O voo terminou antes do recolhimento.");
          }
          onFinished();
        }
      } catch {
        // A próxima verificação tenta novamente; a rodada continua no backend.
      } finally {
        polling.current = false;
      }
    };
    void check();
    const timer = window.setInterval(() => void check(), 550);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onBalanceChange, onFinished, round]);

  async function startRound() {
    if (entry > balance) {
      toast.error("Saldo insuficiente para esta entrada.");
      return;
    }
    setBusy(true);
    try {
      const result = await startFlightRound({
        entryCoins: entry,
        autoCollectMultiplier: autoEnabled ? autoValue : null,
        clientSeed: crypto.randomUUID(),
      });
      setRound(result);
      setDisplayMultiplier(1);
      if (result.server_now) setClockOffset(Date.parse(result.server_now) - Date.now());
      if (typeof result.new_balance === "number") onBalanceChange(result.new_balance);
      toast.success("Voo iniciado");
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
      const result = await collectFlightReward(round.round_id);
      setRound((current) => (current ? { ...current, ...result } : result));
      setDisplayMultiplier(Number(result.multiplier));
      if (typeof result.new_balance === "number") onBalanceChange(result.new_balance);
      if (result.status === "collected") {
        toast.success(`Você recolheu ${result.reward_coins ?? 0} moedas.`);
      } else {
        toast.error("O voo terminou antes do recolhimento.");
      }
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const active = round?.status === "active";
  const flightProgress = Math.min(
    100,
    Math.max(0, (Math.log(Math.max(1, displayMultiplier)) / Math.log(config.max_multiplier)) * 100),
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_24px_70px_rgba(14,165,233,0.10)]">
      <div className="bg-gradient-to-br from-sky-50 via-white to-rose-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-200">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-neutral-950">Voo Estelar</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Acompanhe a subida e recolha as moedas antes de o voo terminar.
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
            <div className="relative mt-2">
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
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Recolhimento automático</p>
                <p className="mt-0.5 text-xs text-neutral-500">Opcional, validado pelo servidor</p>
              </div>
              <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
            </div>
            {autoEnabled && (
              <div className="relative mt-3">
                <Gauge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="number"
                  min={1.01}
                  max={config.max_multiplier}
                  step={0.1}
                  value={autoValue}
                  onChange={(event) => setAutoValue(Number(event.target.value))}
                  className="h-11 rounded-xl pl-9 pr-8 font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                  x
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={() => void startRound()}
            disabled={busy || entry < config.min_entry || entry > config.max_entry}
            className="h-12 w-full rounded-2xl bg-sky-500 font-bold text-white hover:bg-sky-600"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Iniciar voo
          </Button>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <div className="relative h-72 overflow-hidden rounded-3xl bg-gradient-to-b from-sky-500 via-sky-200 to-white">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,white_0_2px,transparent_3px),radial-gradient(circle_at_75%_35%,white_0_1.5px,transparent_2.5px)] [background-size:90px_90px,120px_120px]" />
            <div className="absolute inset-x-0 top-7 z-10 text-center">
              <p className="text-[11px] font-semibold uppercase text-white/75">
                Multiplicador atual
              </p>
              <motion.p
                key={displayMultiplier.toFixed(2)}
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                className="mt-1 text-5xl font-black text-white drop-shadow-lg"
              >
                {displayMultiplier.toFixed(2)}x
              </motion.p>
            </div>

            <motion.div
              className="absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
              animate={{
                bottom: `${12 + flightProgress * 0.5}%`,
                x: Math.sin(displayMultiplier) * 12,
              }}
              transition={{ duration: 0.2, ease: "linear" }}
            >
              {petImage ? (
                <PetImg
                  src={petImage}
                  alt="Pet no Voo Estelar"
                  className="h-16 w-16 object-contain drop-shadow-xl"
                />
              ) : (
                <Sparkles className="h-12 w-12 text-white" />
              )}
              <Rocket className="-mt-2 h-8 w-8 rotate-[-45deg] fill-white text-white drop-shadow" />
            </motion.div>

            <div className="absolute inset-x-4 bottom-4 z-20">
              {active ? (
                <Button
                  onClick={() => void collect()}
                  disabled={busy}
                  className="h-12 w-full rounded-2xl bg-white font-bold text-sky-700 shadow-xl hover:bg-white"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CoinIcon className="h-5 w-5" />
                  )}
                  Recolher agora
                </Button>
              ) : (
                <div className="rounded-2xl bg-white/95 p-4 text-center shadow-xl backdrop-blur">
                  <p className="font-bold text-neutral-950">
                    {round.status === "collected" ? "Moedas recolhidas" : "Voo encerrado"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-600">
                    {Number(round.multiplier).toFixed(2)}x · Recompensa {round.reward_coins ?? 0}
                  </p>
                </div>
              )}
            </div>
          </div>

          {!active && (
            <Button
              variant="outline"
              onClick={() => setRound(null)}
              className="mt-4 h-11 w-full rounded-2xl"
            >
              Voar novamente
            </Button>
          )}

          {recentMultipliers.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-neutral-400">Últimos voos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentMultipliers.slice(0, 8).map((value, index) => (
                  <span
                    key={`${value}-${index}`}
                    className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700"
                  >
                    {Number(value).toFixed(2)}x
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
