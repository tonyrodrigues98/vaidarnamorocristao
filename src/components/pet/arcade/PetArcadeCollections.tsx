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
  claimPetSurpriseEgg,
  getArcadeErrorMessage,
  getPetAlbumState,
  getPetArcadeDailyMissions,
  openPetAlbumPack,
  startPetCapsule,
  startPetScratch,
  startPetSurpriseEgg,
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
        <ArcadeStage className="bg-gradient-to-br from-zinc-800 via-slate-900 to-zinc-950 p-3" glowClassName="bg-slate-200/20">
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

export function SurpriseEggGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [state, setState] = useState<PetAlbumState | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ArcadeGameResult | null>(null);
  const [now, setNow] = useState(Date.now());

  async function load() {
    try {
      setState(await getPetAlbumState());
    } catch {
      setState(null);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const egg = state?.egg;
  const remaining = egg ? Math.max(0, new Date(egg.open_after).getTime() - now) : 0;
  const instantEnabled = Boolean(config.difficulty_config.instant_open_enabled);
  const instantCost = Number(config.difficulty_config.instant_open_cost ?? 0);

  async function buy() {
    setBusy(true);
    try {
      const next = await startPetSurpriseEgg(config.min_entry);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      await load();
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function open(instant = false) {
    if (!egg) return;
    setBusy(true);
    try {
      const next = await claimPetSurpriseEgg(egg.id, instant);
      setResult(next);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      await load();
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
      icon={<Egg className="size-5" />}
    >
      <div className="space-y-4">
        <ArcadeStage className="grid min-h-80 place-items-center bg-gradient-to-b from-violet-950 via-indigo-950 to-amber-200" glowClassName="bg-violet-300/30">
          <span className="absolute size-52 rounded-full bg-white/15 blur-3xl" />
          <motion.div
            animate={
              egg && remaining === 0
                ? { rotate: [-3, 3, -3], scale: [1, 1.04, 1] }
                : { y: [0, -6, 0] }
            }
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="relative grid size-40 place-items-center rounded-[48%_52%_45%_55%] border border-white/60 bg-gradient-to-br from-amber-100 via-rose-200 to-violet-400 shadow-[0_30px_80px_rgba(139,92,246,.45)]"
          >
            <Egg className="size-16 text-white drop-shadow" />
          </motion.div>
          {egg ? (
            <span className="absolute bottom-5 rounded-full bg-black/35 px-4 py-2 text-xs font-bold text-white backdrop-blur">
              {remaining === 0
                ? "Pronto para abrir"
                : `Pronto em ${Math.ceil(remaining / 60000)} min`}
            </span>
          ) : null}
        </ArcadeStage>
        {result ? (
          <ResultCard result={result} title="Ovo aberto" onAgain={() => setResult(null)} />
        ) : egg ? (
          <div className="grid gap-2">
            <Button
              onClick={() => void open(false)}
              disabled={busy || remaining > 0}
              className="h-12 w-full rounded-2xl bg-violet-600 text-white"
            >
              <PackageOpen className="size-4" /> Abrir ovo
            </Button>
            {remaining > 0 && instantEnabled ? (
              <Button
                variant="outline"
                onClick={() => void open(true)}
                disabled={busy || balance < instantCost}
                className="h-11 rounded-2xl border-violet-200"
              >
                Abrir agora · {instantCost} moedas
              </Button>
            ) : null}
          </div>
        ) : (
          <Button
            onClick={() => void buy()}
            disabled={busy || balance < config.min_entry}
            className="h-12 w-full rounded-2xl bg-violet-600 text-white"
          >
            <Egg className="size-4" /> Comprar ovo · {config.min_entry} moedas
          </Button>
        )}
      </div>
    </ArcadePanel>
  );
}

export function PetAlbumGame({ config, balance, onBalanceChange, onFinished }: ArcadeGameProps) {
  const [state, setState] = useState<PetAlbumState | null>(null);
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<PetAlbumSticker[]>([]);
  const [reveal, setReveal] = useState(0);
  const load = useCallback(async () => {
    const next = await getPetAlbumState();
    setState(next);
    setCategory((current) => current || next.stickers[0]?.category || "");
  }, []);
  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);
  const categories = useMemo(
    () => [...new Set((state?.stickers ?? []).map((s) => s.category))],
    [state],
  );
  const page = (state?.stickers ?? []).filter((s) => s.category === category);
  const complete = page.length > 0 && page.every((s) => s.quantity > 0);
  const claimed = state?.claimed.includes(`category:${category}`);
  const prices = (config.difficulty_config.pack_prices ?? {}) as Record<string, number>;

  async function buy(size: 3 | 5 | 10) {
    setBusy(true);
    setOpened([]);
    setReveal(0);
    try {
      const next = await openPetAlbumPack(size, createArcadeClientSeed());
      const cards = (next.result?.stickers as PetAlbumSticker[] | undefined) ?? [];
      setOpened(cards);
      if (typeof next.new_balance === "number") onBalanceChange(next.new_balance);
      cards.forEach((_, i) => window.setTimeout(() => setReveal(i + 1), 350 * (i + 1)));
      await load();
      onFinished();
    } catch (error) {
      toast.error(getArcadeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function claim() {
    setBusy(true);
    try {
      const next = await claimPetAlbumCategory(category);
      onBalanceChange(next.new_balance);
      await load();
      onFinished();
      toast.success(`Página completa: +${next.coins} moedas e +${next.xp} XP`);
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
      icon={<BookOpen className="size-5" />}
    >
      <div className="space-y-4">
        {opened.length ? (
          <ArcadeStage className="overflow-x-auto bg-gradient-to-br from-indigo-950 via-slate-950 to-rose-950 p-4" glowClassName="bg-indigo-400/25">
            <div className="flex min-w-max gap-3">
              {opened.map((s, i) => (
                <motion.div
                  key={`${s.id}-${i}`}
                  initial={{ opacity: 0, y: 30, rotateY: 90 }}
                  animate={
                    i < reveal
                      ? { opacity: 1, y: 0, rotateY: 0 }
                      : { opacity: 0, y: 30, rotateY: 90 }
                  }
                  className={cn("w-36 rounded-[22px] border-2 p-2 shadow-2xl", RARITY_STYLE[s.rarity])}
                >
                  <PetImg
                    src={s.image_path}
                    alt={s.name}
                    className="aspect-square w-full object-contain"
                  />
                  <p className="mt-2 truncate text-xs font-black">{s.name}</p>
                  <p className="text-[9px] uppercase text-neutral-500">
                    {s.is_new ? "Nova" : "Repetida"} · {s.rarity}
                  </p>
                </motion.div>
              ))}
            </div>
          </ArcadeStage>
        ) : null}
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-xs font-bold",
                c === category ? "bg-indigo-600 text-white" : "bg-neutral-100",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="rounded-[28px] border border-indigo-100 bg-[linear-gradient(135deg,#eef2ff,#fff_48%,#fff1f2)] p-3 shadow-inner">
          <div className="grid grid-cols-3 gap-2">
            {page.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "relative aspect-[0.78] overflow-hidden rounded-2xl border p-1",
                  s.quantity > 0
                    ? RARITY_STYLE[s.rarity]
                    : "border-neutral-200 bg-neutral-200 grayscale",
                )}
              >
                <PetImg
                  src={s.image_path}
                  alt={s.name}
                  className={cn(
                    "size-full object-contain",
                    s.quantity === 0 && "opacity-20 blur-sm",
                  )}
                />
                {s.quantity > 0 ? (
                  <span className="absolute right-1 top-1 rounded-full bg-white px-1.5 text-[9px] font-bold">
                    x{s.quantity}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([3, 5, 10] as const).map((size) => (
            <Button
              key={size}
              variant="outline"
              disabled={busy || balance < Number(prices[String(size)] ?? 0)}
              onClick={() => void buy(size)}
              className="h-auto min-h-16 flex-col rounded-2xl"
            >
              <PackageOpen className="size-4" />
              <span>Pacote {size}</span>
              <small>{prices[String(size)] ?? config.min_entry} moedas</small>
            </Button>
          ))}
        </div>
        {complete && !claimed ? (
          <Button
            onClick={() => void claim()}
            disabled={busy}
            className="h-12 w-full rounded-2xl bg-indigo-600 text-white"
          >
            <Gift className="size-4" /> Resgatar página completa
          </Button>
        ) : null}
        <p className="text-center text-xs text-neutral-500">
          {page.filter((s) => s.quantity > 0).length}/{page.length} nesta página
        </p>
      </div>
    </ArcadePanel>
  );
}

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
        <ArcadeStage className="grid min-h-80 place-items-center bg-gradient-to-b from-rose-500 via-fuchsia-950 to-sky-950" glowClassName="bg-rose-300/30">
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
        <ArcadeStage className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-4" glowClassName="bg-emerald-400/25">
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
