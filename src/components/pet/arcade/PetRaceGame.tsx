import { useState } from "react";
import { Flag, PawPrint, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { PetImg } from "@/components/pet/PetImg";
import { getArcadeErrorMessage, startPetRace, type ArcadeGameResult } from "@/lib/petArcade";
import {
  ArcadeMetric,
  ArcadePanel,
  ArcadeStage,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
  StartButton,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";

type Racer = {
  id: string;
  name: string;
  image_url: string | null;
  is_user: boolean;
  care_score: number | null;
};

export function PetRaceGame({
  config,
  balance,
  petImage,
  careScore: careScoreProp = 75,
  onBalanceChange,
  onFinished,
}: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [busy, setBusy] = useState(false);
  const [racing, setRacing] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);

  async function start() {
    if (!validateEntry(entry, config, balance) && entry !== 0)
      return toast.error("Revise a quantidade de moedas.");
    setBusy(true);
    setResult(null);
    try {
      const next = await startPetRace(entry, createArcadeClientSeed());
      setResult(next);
      setRacing(true);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      const seconds = Number(next.result?.duration_seconds ?? 10);
      window.setTimeout(() => {
        setRacing(false);
        onFinished();
      }, seconds * 1000);
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const racers = (result?.result?.racers as Racer[] | undefined) ?? [];
  const userPosition = Number(result?.result?.user_position ?? 0);
  const careScore = Number(result?.result?.care_score ?? 0);
  const displayCareScore = careScore || careScoreProp;
  const approximateChance = Math.round(
    ((35 + displayCareScore * 0.65) / (35 + displayCareScore * 0.65 + 275)) * 100,
  );
  const duration = Number(result?.result?.duration_seconds ?? 10);

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Flag className="size-5" />}
    >
      <div className="space-y-4">
        <ArcadeStage className="bg-gradient-to-br from-sky-950 via-cyan-950 to-emerald-950 p-3" glowClassName="bg-cyan-300/25">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur">
            <span>Cuidado geral: {displayCareScore}%</span>
            <span>
              {racing
                ? "Corrida em andamento"
                : result
                  ? `Colocação: ${userPosition}º`
                  : "6 competidores"}
            </span>
          </div>
          <div className="space-y-2">
            {(racers.length
              ? racers
              : Array.from({ length: 6 }, (_, index) => ({
                  id: String(index),
                  name: index === 0 ? "Seu pet" : `Pet ${index + 1}`,
                  image_url: index === 0 ? (petImage ?? null) : null,
                  is_user: index === 0,
                  care_score: null,
                }))
            ).map((racer, index) => {
              const finalIndex = racers.findIndex((item) => item.id === racer.id);
              const finish = racers.length ? Math.max(76, 98 - finalIndex * 2) : 8;
              const middle = [
                22 + ((index * 13) % 28),
                48 + ((index * 7) % 25),
                67 + ((index * 11) % 18),
              ];
              return (
                <div
                  key={racer.id}
                  className="relative h-14 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-sm backdrop-blur-sm"
                >
                  <div className="absolute inset-y-0 right-3 border-r-2 border-dashed border-rose-300" />
                  <motion.div
                    initial={{ left: "4%" }}
                    animate={{
                      left: racing
                        ? middle.map((value) => `${value}%`).concat(`${finish}%`)
                        : result
                          ? `${finish}%`
                          : "4%",
                    }}
                    transition={{
                      duration: racing ? duration : 0.4,
                      times: racing ? [0, 0.3, 0.58, 1] : undefined,
                      ease: racing ? "easeInOut" : "easeOut",
                    }}
                    className="absolute top-1/2 -translate-y-1/2"
                  >
                    <div
                      className={`grid size-10 place-items-center overflow-hidden rounded-full border-2 bg-white shadow ${racer.is_user ? "border-rose-500" : "border-cyan-300"}`}
                    >
                      {racer.image_url ? (
                        <PetImg
                          src={racer.image_url}
                          alt={racer.name}
                          className="size-full object-contain"
                        />
                      ) : (
                        <PawPrint className="size-5 text-cyan-500" />
                      )}
                    </div>
                  </motion.div>
                  <span className="absolute left-2 top-1 text-[9px] font-bold text-white/75">
                    {racer.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ArcadeMetric label="Cuidado" value={`${displayCareScore}%`} tone="success" />
            <ArcadeMetric label="Chance aproximada" value={`${approximateChance}%`} />
          </div>
        </ArcadeStage>

        {!result || racing ? (
          <>
            {!racing ? (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-center text-xs font-bold text-cyan-900">
                Chance aproximada do seu pet: {approximateChance}%
              </div>
            ) : null}
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy || racing}
            />
            <button
              type="button"
              disabled={busy || racing}
              onClick={() => setEntry(0)}
              className="h-10 w-full rounded-xl border border-cyan-200 bg-cyan-50 text-xs font-bold text-cyan-800 disabled:opacity-50"
            >
              Usar corrida gratuita disponível
            </button>
            <StartButton busy={busy || racing} onClick={() => void start()}>
              Iniciar corrida
            </StartButton>
          </>
        ) : (
          <div className="space-y-3">
            {userPosition <= 3 ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
                <Trophy className="size-6" />
                <span className="font-black">Seu pet chegou em {userPosition}º lugar</span>
              </div>
            ) : null}
            <ResultCard
              result={result}
              title={`Corrida concluída em ${userPosition}º lugar`}
              onAgain={() => setResult(null)}
            />
          </div>
        )}
      </div>
    </ArcadePanel>
  );
}
