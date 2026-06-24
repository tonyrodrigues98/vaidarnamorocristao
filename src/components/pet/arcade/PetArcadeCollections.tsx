import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  CircleDot,
  Clock3,
  Coins,
  Egg,
  Gift,
  Loader2,
  PackageOpen,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { PetImg } from "@/components/pet/PetImg";
import { Button } from "@/components/ui/button";
import {
  claimPetAlbumCategory,
  claimPetArcadeMission,
  getArcadeErrorMessage,
  getPetAlbumState,
  getPetArcadeDailyMissions,
  openPetAlbumPack,
  startPetCapsule,
  startPetScratch,
  type ArcadeGameResult,
  type PetAlbumState,
  type PetAlbumSticker,
  type PetArcadeMission,
} from "@/lib/petArcade";
import { playGrabFinalDing, playGrabTick, unlockGrabAudio } from "@/lib/grabAudio";
import { cn } from "@/lib/utils";
import {
  ArcadeMetric,
  ArcadePanel,
  ArcadeStage,
  EntryControl,
  type ArcadeGameProps,
  ResultCard,
} from "./ArcadeGameUi";
import { createArcadeClientSeed, validateEntry } from "./arcadeUiUtils";
import albumArtwork from "@/assets/pet-arcade/album-card.webp";
import capsuleArtwork from "@/assets/pet-arcade/capsule-card.webp";

const RARITY_STYLE: Record<string, string> = {
  common: "border-neutral-200 bg-white",
  uncommon: "border-emerald-300 bg-emerald-50",
  rare: "border-sky-300 bg-sky-50",
  epic: "border-violet-300 bg-violet-50",
  legendary: "border-amber-300 bg-amber-50 shadow-amber-200/60",
};

export function ScratchGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [entry, setEntry] = useState(config.min_entry);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [revealed, setRevealed] = useState<number[]>([]);
  const tiles = (result?.result?.tiles as PetAlbumSticker[] | undefined) ?? [];

  async function start() {
    if (!validateEntry(entry, config, balance))
      return toast.error("Revise a quantidade de moedas.");
    setBusy(true);
    try {
      const next = await startPetScratch(entry, createArcadeClientSeed());
      setResult(next);
      setRevealed([]);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<Sparkles className="size-5" />}
    >
      <div className="space-y-4">
        <ArcadeStage
          className="bg-gradient-to-br from-zinc-800 via-slate-900 to-zinc-950 p-3"
          glowClassName="bg-slate-200/20"
        >
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-white/80">
            <span>Revele os nove espaços</span>
            <span>{revealed.length}/9</span>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[24px] bg-white/8 p-2 shadow-inner">
            {Array.from({ length: 9 }, (_, index) => {
              const open = revealed.includes(index);
              const tile = tiles[index];
              return (
                <motion.button
                  key={index}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={!result || open}
                  onClick={() => setRevealed((current) => [...current, index])}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-white bg-white shadow-sm"
                >
                  {tile ? (
                    <PetImg
                      src={tile.image_path}
                      alt={tile.name}
                      className="size-full object-contain p-1"
                    />
                  ) : null}
                  {!open ? (
                    <motion.span
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#d4d4d8,#fafafa_48%,#a1a1aa)] text-neutral-600 after:absolute after:inset-0 after:bg-[repeating-linear-gradient(135deg,transparent_0_8px,rgba(255,255,255,.35)_8px_10px)]"
                    >
                      <Sparkles className="size-6" />
                    </motion.span>
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        </ArcadeStage>
        {!result ? (
          <>
            <EntryControl
              value={entry}
              onChange={setEntry}
              config={config}
              balance={balance}
              disabled={busy}
            />
            <Button
              onClick={() => void start()}
              disabled={busy}
              className="h-12 w-full rounded-2xl bg-neutral-800 text-white"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{" "}
              Comprar raspadinha
            </Button>
          </>
        ) : revealed.length < 9 ? (
          <Button
            onClick={() => setRevealed(Array.from({ length: 9 }, (_, i) => i))}
            variant="outline"
            className="h-11 w-full rounded-xl"
          >
            Revelar tudo
          </Button>
        ) : (
          <ResultCard
            result={result}
            title={
              Number(result.result?.max_match ?? 0) >= 3
                ? "Combinação encontrada"
                : "Raspadinha revelada"
            }
            onAgain={() => setResult(null)}
          />
        )}
      </div>
    </ArcadePanel>
  );
}

export { SurpriseEggGame } from "./SurpriseEggScene";
export { PetAlbumGame } from "./PetAlbumScene";


export function CapsuleGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [sound, setSound] = useState(true);
  async function play() {
    if (balance < config.min_entry) return toast.error("Saldo insuficiente.");
    setBusy(true);
    if (sound) unlockGrabAudio();
    try {
      if (sound)
        for (let i = 0; i < 7; i++) window.setTimeout(() => playGrabTick(1 - i / 8), i * 110);
      const next = await startPetCapsule(config.min_entry, createArcadeClientSeed());
      setResult(next);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      if (sound) window.setTimeout(playGrabFinalDing, 900);
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      window.setTimeout(() => setBusy(false), 1000);
    }
  }
  const item = result?.result?.item as
    | { name?: string; image_path?: string; kind?: string }
    | undefined;
  return (
    <ArcadePanel
      title={config.display_name}
      description={config.description}
      icon={<CircleDot className="size-5" />}
    >
      <div className="space-y-4">
        <ArcadeStage
          className="grid min-h-80 place-items-center bg-gradient-to-b from-rose-500 via-fuchsia-950 to-sky-950"
          glowClassName="bg-rose-300/30"
        >
          <img
            src={capsuleArtwork}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-35"
          />
          <button
            onClick={() => setSound((v) => !v)}
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/80"
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <motion.div
            animate={busy ? { rotate: [0, -8, 8, 0], y: [0, -4, 0] } : { y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 0.7 }}
            className="grid size-48 place-items-center rounded-[45%_45%_30%_30%] border-8 border-white/70 bg-white/25 shadow-[0_28px_70px_rgba(244,63,94,.35)] backdrop-blur"
          >
            <CircleDot className="size-24 text-rose-600" />
          </motion.div>
          <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
            <ArcadeMetric label="Custo" value={`${config.min_entry}`} />
            <ArcadeMetric label="Estado" value={busy ? "Girando" : "Pronta"} tone="warning" />
          </div>
        </ArcadeStage>
        {item ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            {item.image_path ? (
              <PetImg
                src={item.image_path}
                alt={item.name ?? "Item"}
                className="mx-auto size-20 object-contain"
              />
            ) : null}
            <p className="mt-2 font-black">{item.name}</p>
            <p className="text-xs text-emerald-700">Adicionado ao inventário de cuidado</p>
          </div>
        ) : null}
        <Button
          onClick={() => void play()}
          disabled={busy || balance < config.min_entry}
          className="h-12 w-full rounded-2xl bg-rose-500 text-white"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <CircleDot className="size-4" />}{" "}
          Girar · {config.min_entry} moedas
        </Button>
      </div>
    </ArcadePanel>
  );
}

export function DailyMissionsGame({ onBalanceChange, onFinished }: ArcadeGameProps) {
  const [missions, setMissions] = useState<PetArcadeMission[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  async function load() {
    setMissions(await getPetArcadeDailyMissions());
  }
  useEffect(() => {
    void load().catch(() => undefined);
  }, []);
  async function claim(id: string) {
    setBusy(id);
    try {
      const next = await claimPetArcadeMission(id);
      onBalanceChange(next.new_balance);
      await load();
      onFinished();
      toast.success(`Missão resgatada: +${next.coins} moedas e +${next.xp} XP`);
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(null);
    }
  }
  const done = missions.filter((m) => m.status === "claimed").length;
  return (
    <ArcadePanel
      title="Missões Diárias"
      description="Objetivos conectados às suas aventuras reais."
      icon={<Check className="size-5" />}
    >
      <div className="space-y-3">
        <ArcadeStage
          className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-4"
          glowClassName="bg-emerald-400/25"
        >
          <div className="flex justify-between text-xs font-bold">
            <span>Progresso do dia</span>
            <span>
              {done}/{missions.length}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <motion.div
              animate={{ width: `${missions.length ? (done / missions.length) * 100 : 0}%` }}
              className="h-full rounded-full bg-emerald-300"
            />
          </div>
        </ArcadeStage>
        {missions.map((m) => {
          const progress = Math.min(100, (m.progress / m.target_value) * 100);
          return (
            <div key={m.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    m.status === "claimed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  {m.status === "claimed" ? (
                    <Check className="size-5" />
                  ) : (
                    <Star className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{m.title}</p>
                  <p className="text-xs text-neutral-500">{m.description}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div style={{ width: `${progress}%` }} className="h-full bg-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-neutral-500">
                    <span>
                      {m.progress}/{m.target_value}
                    </span>
                    <span>
                      <Coins className="mr-1 inline size-3" />
                      {m.reward_config.coins ?? 0} · +{m.reward_config.xp ?? 0} XP
                    </span>
                  </div>
                </div>
              </div>
              {m.status === "completed" ? (
                <Button
                  onClick={() => void claim(m.id)}
                  disabled={busy === m.id}
                  className="mt-3 h-10 w-full rounded-xl bg-emerald-600 text-white"
                >
                  Resgatar
                </Button>
              ) : null}
            </div>
          );
        })}
        <p className="flex items-center justify-center gap-1 text-[10px] text-neutral-400">
          <Clock3 className="size-3" /> Reinicia diariamente no horário de Brasília
        </p>
      </div>
    </ArcadePanel>
  );
}
