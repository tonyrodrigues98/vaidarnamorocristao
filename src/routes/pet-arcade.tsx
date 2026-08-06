import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  BookOpen,
  Building2,
  CircleDollarSign,
  CircleDot,
  Coins,
  Cookie,
  Dices,
  Disc3,
  Flag,
  Gamepad2,
  Gem,
  Grid3X3,
  Egg,
  Layers3,
  Loader2,
  PawPrint,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wrench,
  ListChecks,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { NativeArcadeHeader } from "@/components/pet/arcade/native/NativeArcadeHeader";
import { useNativeShellRuntime } from "@/components/native-shell/NativeShellRuntimeContext";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { PetImg } from "@/components/pet/PetImg";
import { TreasureAdventure } from "@/components/pet/arcade/TreasureAdventure";
import { StellarFlight } from "@/components/pet/arcade/StellarFlight";
import { PlinkoGame } from "@/components/pet/arcade/PlinkoGame";
import { KenoGame } from "@/components/pet/arcade/KenoGame";
import { WheelGame } from "@/components/pet/arcade/WheelGame";
import { HiloGame } from "@/components/pet/arcade/HiloGame";
import { TowersGame } from "@/components/pet/arcade/TowersGame";
import { CoinFlipGame, DiceGame } from "@/components/pet/arcade/QuickArcadeGames";
import { PetRaceGame } from "@/components/pet/arcade/PetRaceGame";
import { MemoryGame } from "@/components/pet/arcade/MemoryGame";
import { PiggyBankGame } from "@/components/pet/arcade/PiggyBankGame";
import { ArcadeHistoryV2 } from "@/components/pet/arcade/ArcadeHistoryV2";
import {
  CapsuleGame,
  DailyMissionsGame,
  PetAlbumGame,
  ScratchGame,
  SurpriseEggGame,
} from "@/components/pet/arcade/PetArcadeCollections";
import { useAuth } from "@/lib/auth";
import { getMyCoins } from "@/lib/coins";
import { deriveCurrentValue, getCareConfig, listCareState } from "@/lib/petCare";
import { resolvePetDisplayImage } from "@/lib/petCatalog";
import { myPetV2QueryOptions } from "@/lib/petQueries";
import {
  getActivePetArcadeRounds,
  getPetArcadeCatalog,
  getPetArcadeConfig,
  getPetArcadeHistory,
  getPetArcadeHistoryV2,
  getPetArcadeUsageToday,
  type ArcadeCategory,
  type ArcadeGameConfig,
  type ArcadeGameType,
  type ActiveArcadeRound,
  type PetArcadeConfig,
} from "@/lib/petArcade";
import { PET_CARE_ORDER } from "@/types/petCare";
import { cn } from "@/lib/utils";
import arcadeHero from "@/assets/pet-arcade/arcade-hero.webp";
import albumCard from "@/assets/pet-arcade/album-card.webp";
import capsuleCard from "@/assets/pet-arcade/capsule-card.webp";
import coinflipCard from "@/assets/pet-arcade/coinflip-card.webp";
import diceCard from "@/assets/pet-arcade/dice-card.webp";
import eggCard from "@/assets/pet-arcade/egg-card.webp";
import flightCard from "@/assets/pet-arcade/flight-card.webp";
import hiloCard from "@/assets/pet-arcade/hilo-card.webp";
import kenoCard from "@/assets/pet-arcade/keno-card.webp";
import memoryCard from "@/assets/pet-arcade/memory-card.webp";
import missionsCard from "@/assets/pet-arcade/missions-card.webp";
import piggybankCard from "@/assets/pet-arcade/piggybank-card.webp";
import plinkoCard from "@/assets/pet-arcade/plinko-card.webp";
import raceCard from "@/assets/pet-arcade/race-card.webp";
import scratchCard from "@/assets/pet-arcade/scratch-card.webp";
import treasureCard from "@/assets/pet-arcade/treasure-card.webp";
import towersCard from "@/assets/pet-arcade/towers-card.webp";
import wheelCard from "@/assets/pet-arcade/wheel-card.webp";

export const Route = createFileRoute("/pet-arcade")({
  head: () => ({ meta: [{ title: "Pet Arcade | VaiDarNamoro" }] }),
  component: PetArcadePage,
});

const GAME_ICONS: Record<ArcadeGameType, ComponentType<{ className?: string }>> = {
  treasure: Gem,
  flight: Rocket,
  plinko: Cookie,
  keno: Grid3X3,
  wheel: Disc3,
  hilo: Layers3,
  towers: Building2,
  coinflip: CircleDollarSign,
  race: Flag,
  memory: Brain,
  piggybank: PiggyBank,
  dice: Dices,
  scratch: Sparkles,
  egg: Egg,
  album: BookOpen,
  capsule: CircleDot,
  missions: ListChecks,
};

const FILTERS: { key: "all" | ArcadeCategory; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "quick", label: "Rápidos" },
  { key: "strategy", label: "Estratégia" },
  { key: "luck", label: "Sorte" },
  { key: "care", label: "Cuidado" },
];

const CATEGORY_LABELS: Record<ArcadeCategory, string> = {
  quick: "Rápido",
  strategy: "Estratégia",
  luck: "Sorte",
  care: "Cuidado",
};

const GAME_VISUALS: Record<
  ArcadeGameType,
  { surface: string; icon: string; glow: string; kicker: string; mesh: string; image?: string }
> = {
  treasure: {
    image: treasureCard,
    surface: "from-amber-950 via-stone-900 to-emerald-950",
    icon: "bg-amber-400 text-amber-950 shadow-amber-950/40",
    glow: "bg-amber-400/20",
    kicker: "Mapa secreto",
    mesh: "bg-[radial-gradient(circle_at_15%_15%,rgba(251,191,36,0.22),transparent_26%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.18),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.08),transparent_45%)]",
  },
  flight: {
    image: flightCard,
    surface: "from-indigo-950 via-slate-950 to-sky-900",
    icon: "bg-sky-300 text-sky-950 shadow-sky-950/40",
    glow: "bg-sky-400/20",
    kicker: "Rumo às estrelas",
    mesh: "bg-[radial-gradient(circle_at_20%_18%,rgba(125,211,252,0.22),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.14),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]",
  },
  plinko: {
    image: plinkoCard,
    surface: "from-orange-950 via-stone-950 to-amber-800",
    icon: "bg-orange-300 text-orange-950 shadow-orange-950/40",
    glow: "bg-orange-400/20",
    kicker: "Queda premiada",
    mesh: "bg-[radial-gradient(circle_at_18%_18%,rgba(251,146,60,0.24),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(251,191,36,0.18),transparent_24%),linear-gradient(160deg,rgba(255,255,255,0.06),transparent_46%)]",
  },
  keno: {
    image: kenoCard,
    surface: "from-violet-950 via-slate-950 to-fuchsia-900",
    icon: "bg-violet-300 text-violet-950 shadow-violet-950/40",
    glow: "bg-violet-400/20",
    kicker: "Escolha sua sequência",
    mesh: "bg-[radial-gradient(circle_at_15%_12%,rgba(196,181,253,0.24),transparent_24%),radial-gradient(circle_at_85%_14%,rgba(236,72,153,0.16),transparent_26%),linear-gradient(165deg,rgba(255,255,255,0.08),transparent_45%)]",
  },
  wheel: {
    image: wheelCard,
    surface: "from-rose-950 via-neutral-950 to-orange-900",
    icon: "bg-rose-300 text-rose-950 shadow-rose-950/40",
    glow: "bg-rose-400/20",
    kicker: "A roda vai girar",
    mesh: "bg-[radial-gradient(circle_at_15%_18%,rgba(251,113,133,0.24),transparent_24%),radial-gradient(circle_at_88%_16%,rgba(251,146,60,0.18),transparent_24%),linear-gradient(150deg,rgba(255,255,255,0.08),transparent_45%)]",
  },
  hilo: {
    image: hiloCard,
    surface: "from-indigo-950 via-neutral-950 to-purple-900",
    icon: "bg-indigo-300 text-indigo-950 shadow-indigo-950/40",
    glow: "bg-indigo-400/20",
    kicker: "Leia a próxima carta",
    mesh: "bg-[radial-gradient(circle_at_15%_18%,rgba(129,140,248,0.24),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(168,85,247,0.16),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  towers: {
    image: towersCard,
    surface: "from-emerald-950 via-neutral-950 to-teal-900",
    icon: "bg-emerald-300 text-emerald-950 shadow-emerald-950/40",
    glow: "bg-emerald-400/20",
    kicker: "Suba com cuidado",
    mesh: "bg-[radial-gradient(circle_at_15%_18%,rgba(110,231,183,0.24),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(34,197,94,0.16),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  coinflip: {
    image: coinflipCard,
    surface: "from-pink-950 via-neutral-950 to-amber-900",
    icon: "bg-pink-300 text-pink-950 shadow-pink-950/40",
    glow: "bg-pink-400/20",
    kicker: "Patinha ou coração",
    mesh: "bg-[radial-gradient(circle_at_16%_14%,rgba(251,113,133,0.24),transparent_24%),radial-gradient(circle_at_86%_16%,rgba(253,186,116,0.18),transparent_24%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  race: {
    image: raceCard,
    surface: "from-cyan-950 via-slate-950 to-emerald-900",
    icon: "bg-cyan-300 text-cyan-950 shadow-cyan-950/40",
    glow: "bg-cyan-400/20",
    kicker: "Prepare seu campeão",
    mesh: "bg-[radial-gradient(circle_at_16%_15%,rgba(103,232,249,0.24),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(52,211,153,0.16),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  memory: {
    image: memoryCard,
    surface: "from-teal-950 via-neutral-950 to-cyan-900",
    icon: "bg-teal-300 text-teal-950 shadow-teal-950/40",
    glow: "bg-teal-400/20",
    kicker: "Encontre os pares",
    mesh: "bg-[radial-gradient(circle_at_15%_16%,rgba(94,234,212,0.24),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.16),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  piggybank: {
    image: piggybankCard,
    surface: "from-amber-950 via-rose-950 to-stone-950",
    icon: "bg-amber-300 text-amber-950 shadow-amber-950/40",
    glow: "bg-amber-400/20",
    kicker: "Cultive sua reserva",
    mesh: "bg-[radial-gradient(circle_at_16%_15%,rgba(252,211,77,0.24),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(251,113,133,0.14),transparent_24%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  dice: {
    image: diceCard,
    surface: "from-blue-950 via-slate-950 to-indigo-900",
    icon: "bg-blue-300 text-blue-950 shadow-blue-950/40",
    glow: "bg-blue-400/20",
    kicker: "Acima ou abaixo",
    mesh: "bg-[radial-gradient(circle_at_15%_15%,rgba(147,197,253,0.24),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(129,140,248,0.16),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  scratch: {
    image: scratchCard,
    surface: "from-zinc-800 via-neutral-950 to-rose-950",
    icon: "bg-zinc-200 text-zinc-900 shadow-black/40",
    glow: "bg-white/15",
    kicker: "Revele a combinação",
    mesh: "bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(251,113,133,0.14),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  egg: {
    image: eggCard,
    surface: "from-violet-950 via-indigo-950 to-amber-900",
    icon: "bg-violet-200 text-violet-950 shadow-violet-950/40",
    glow: "bg-violet-300/20",
    kicker: "Uma descoberta incubando",
    mesh: "bg-[radial-gradient(circle_at_15%_15%,rgba(221,214,254,0.22),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(251,191,36,0.14),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  album: {
    image: albumCard,
    surface: "from-indigo-950 via-slate-950 to-rose-900",
    icon: "bg-indigo-200 text-indigo-950 shadow-indigo-950/40",
    glow: "bg-indigo-300/20",
    kicker: "Complete sua coleção",
    mesh: "bg-[radial-gradient(circle_at_15%_15%,rgba(199,210,254,0.22),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(251,113,133,0.14),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  capsule: {
    image: capsuleCard,
    surface: "from-rose-950 via-neutral-950 to-sky-900",
    icon: "bg-rose-200 text-rose-950 shadow-rose-950/40",
    glow: "bg-rose-300/20",
    kicker: "Cuidado em uma cápsula",
    mesh: "bg-[radial-gradient(circle_at_15%_15%,rgba(254,205,211,0.22),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(125,211,252,0.14),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
  missions: {
    image: missionsCard,
    surface: "from-emerald-950 via-neutral-950 to-teal-900",
    icon: "bg-emerald-200 text-emerald-950 shadow-emerald-950/40",
    glow: "bg-emerald-300/20",
    kicker: "Objetivos de hoje",
    mesh: "bg-[radial-gradient(circle_at_15%_15%,rgba(167,243,208,0.22),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(16,185,129,0.14),transparent_26%),linear-gradient(155deg,rgba(255,255,255,0.08),transparent_44%)]",
  },
};

const CARE_LABELS: Record<string, string> = {
  feed: "Fome",
  play: "Humor",
  hygiene: "Higiene",
  sleep: "Sono",
  affection: "Carinho",
  energy: "Energia",
};

function PetArcadePage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { active: nativeShellActive } = useNativeShellRuntime();
  const [selectedGame, setSelectedGame] = useState<ArcadeGameType | null>(null);
  const [filter, setFilter] = useState<"all" | ArcadeCategory>("all");
  const [balance, setBalance] = useState(0);

  const petQuery = useQuery(myPetV2QueryOptions(user?.id));
  const legacyConfigQuery = useQuery({
    queryKey: ["pet-arcade", "legacy-config"],
    queryFn: getPetArcadeConfig,
    enabled: !!user,
    staleTime: 60_000,
  });
  const catalogQuery = useQuery({
    queryKey: ["pet-arcade", "catalog"],
    queryFn: getPetArcadeCatalog,
    enabled: !!user,
    staleTime: 60_000,
  });
  const coinsQuery = useQuery({
    queryKey: ["coins", "mine"],
    queryFn: getMyCoins,
    enabled: !!user,
  });
  const historyQuery = useQuery({
    queryKey: ["pet-arcade", "history-v2"],
    queryFn: () => getPetArcadeHistoryV2(30),
    enabled: !!user,
  });
  const usageQuery = useQuery({
    queryKey: ["pet-arcade", "usage-today"],
    queryFn: getPetArcadeUsageToday,
    enabled: !!user,
  });
  const legacyHistoryQuery = useQuery({
    queryKey: ["pet-arcade", "history"],
    queryFn: () => getPetArcadeHistory(20),
    enabled: !!user,
  });
  const activeQuery = useQuery({
    queryKey: ["pet-arcade", "active"],
    queryFn: getActivePetArcadeRounds,
    enabled: !!user,
  });
  const careConfigQuery = useQuery({
    queryKey: ["pet-care", "config"],
    queryFn: getCareConfig,
    enabled: !!user,
  });
  const careQuery = useQuery({
    queryKey: ["pet-care", petQuery.data?.id],
    queryFn: () => listCareState(petQuery.data!.id),
    enabled: !!petQuery.data?.id,
  });

  useEffect(() => {
    if (coinsQuery.data) setBalance(coinsQuery.data.balance);
  }, [coinsQuery.data]);

  const refreshArcade = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["pet-arcade"] });
    void queryClient.invalidateQueries({ queryKey: ["coins", "mine"] });
  }, [queryClient]);

  const careValues = useMemo(() => {
    const cfg = careConfigQuery.data;
    const states = careQuery.data ?? [];
    if (!cfg) return [];
    return PET_CARE_ORDER.map((kind) => ({
      kind,
      label: CARE_LABELS[kind] ?? kind,
      value: deriveCurrentValue(
        states.find((state) => state.kind === kind),
        cfg,
        kind,
      ),
    }));
  }, [careConfigQuery.data, careQuery.data]);
  const careScore = careValues.length
    ? Math.round(careValues.reduce((sum, item) => sum + item.value, 0) / careValues.length)
    : 75;

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  const pet = petQuery.data ?? null;
  const petImage = pet
    ? resolvePetDisplayImage(pet.variant, pet.life_stage?.kind ?? null) ||
      resolvePetDisplayImage(pet.species, pet.life_stage?.kind ?? null) ||
      pet.category?.image_url ||
      null
    : null;
  const catalog = catalogQuery.data;
  const legacyConfig = legacyConfigQuery.data;
  const history = historyQuery.data ?? [];
  const usage = usageQuery.data;
  const legacyHistory = legacyHistoryQuery.data ?? [];
  const activeRounds = activeQuery.data ?? [];
  const activeTreasure = activeRounds.find((round) => round.game_type === "treasure");
  const activeFlight = activeRounds.find((round) => round.game_type === "flight");
  const selectedActive = selectedGame
    ? activeRounds.find((round) => round.game_type === selectedGame)
    : undefined;
  const recentFlightMultipliers = legacyHistory
    .filter((item) => item.game_type === "flight" && item.status !== "active")
    .map((item) => Number(item.final_multiplier ?? item.multiplier));
  const filteredGames = (catalog?.games ?? []).filter(
    (game) => filter === "all" || game.category === filter,
  );
  const selectedConfig = catalog?.games.find((game) => game.game_type === selectedGame);
  const loadingData =
    petQuery.isLoading ||
    catalogQuery.isLoading ||
    legacyConfigQuery.isLoading ||
    coinsQuery.isLoading ||
    historyQuery.isLoading ||
    activeQuery.isLoading;

  return (
    <div
      className={cn(
        "min-h-screen max-w-full overflow-x-clip",
        nativeShellActive
          ? "bg-background text-foreground"
          : "bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.12),_transparent_32%),radial-gradient(circle_at_100%_0,_rgba(125,211,252,0.12),_transparent_30%),linear-gradient(180deg,rgba(255,251,251,1),rgba(255,255,255,1),rgba(247,250,255,1))] text-neutral-950",
      )}
      data-vdn-native-arcade={nativeShellActive || undefined}
      data-vdn-native-arcade-playing={nativeShellActive && selectedGame ? true : undefined}
    >
      <Header />
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pb-12 sm:pt-8">
        {nativeShellActive ? (
          <NativeArcadeHeader
            balance={balance}
            petName={pet?.custom_name}
            petImage={petImage}
            careScore={careScore}
            usedToday={usage?.total_used}
            dailyLimit={catalog?.settings.daily_play_limit}
          />
        ) : (
          <div className="mb-5 grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3">
            <Link
              to="/meu-pet"
              className="app-pressable grid size-11 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm"
              aria-label="Voltar para Meu Pet"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] font-semibold uppercase text-rose-500">Aventuras do pet</p>
              <h1 className="truncate text-xl font-black">Pet Arcade</h1>
            </div>
            <div className="inline-flex h-11 max-w-28 shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-white px-3 shadow-sm">
              <CoinIcon className="size-5" />
              <span className="truncate font-black">{balance}</span>
            </div>
          </div>
        )}

        <section className="relative mb-6 min-h-[310px] overflow-hidden rounded-[34px] border border-white/80 bg-neutral-950 shadow-[0_28px_80px_rgba(99,68,40,0.22)] sm:min-h-[360px]">
          <img
            src={arcadeHero}
            alt="Mundo do Pet Arcade"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/15 to-white/5" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="rounded-[26px] border border-white/25 bg-neutral-950/55 p-4 text-white shadow-2xl backdrop-blur-md">
              <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-4">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[22px] border border-white/35 bg-white/15 shadow-lg sm:size-[76px]">
                  {petImage ? (
                    <PetImg
                      src={petImage}
                      alt={pet?.custom_name ?? "Pet"}
                      className="size-full object-contain p-1"
                    />
                  ) : (
                    <PawPrint className="size-8 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Gamepad2 className="size-4 text-amber-300" />
                    <p className="text-sm font-black">{pet?.custom_name ?? "Seu pet"}</p>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-300/15 px-2 py-1 text-[10px] font-bold text-emerald-100">
                      Cuidado {careScore}%
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm leading-relaxed text-white/75">
                    Aventuras rápidas, progressão e cuidado usando apenas moedas internas.
                  </p>
                  {careValues.length ? (
                    <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                      {careValues.map((item) => (
                        <div
                          key={item.kind}
                          className="rounded-xl border border-white/10 bg-white/10 px-2 py-1.5 backdrop-blur"
                        >
                          <p className="truncate text-[9px] text-white/55">{item.label}</p>
                          <p className="text-xs font-black">{Math.round(item.value)}%</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {loadingData ? (
          <div className="grid min-h-64 place-items-center rounded-3xl bg-white">
            <Loader2 className="size-7 animate-spin text-rose-500" />
          </div>
        ) : catalogQuery.isError || legacyConfigQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm">
            <Wrench className="mx-auto size-8 text-rose-500" />
            <h2 className="mt-3 font-bold">Pet Arcade ainda não está configurado</h2>
            <p className="mt-2 text-sm text-neutral-600">
              As migrations do Pet Arcade precisam ser aplicadas no Supabase.
            </p>
          </div>
        ) : !pet ? (
          <div className="rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm">
            <PawPrint className="mx-auto size-9 text-amber-500" />
            <h2 className="mt-3 text-lg font-bold">Escolha um pet primeiro</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Você precisa escolher um pet antes de entrar no Pet Arcade.
            </p>
            <Link
              to="/meu-pet"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-bold text-white"
            >
              Ir para Meu Pet
            </Link>
          </div>
        ) : !catalog?.settings.is_enabled ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
            <Wrench className="mx-auto size-9 text-neutral-500" />
            <h2 className="mt-3 text-lg font-bold">Pet Arcade em manutenção</h2>
            <p className="mt-2 text-sm text-neutral-600">{catalog?.settings.maintenance_message}</p>
          </div>
        ) : selectedGame && selectedConfig && legacyConfig ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setSelectedGame(null)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700"
            >
              <ArrowLeft className="size-4" /> Todas as aventuras
            </button>
            <GameStage
              game={selectedGame}
              config={selectedConfig}
              legacyConfig={legacyConfig}
              balance={balance}
              petImage={petImage}
              careScore={careScore}
              activeRound={selectedActive}
              activeTreasure={activeTreasure}
              activeFlight={activeFlight}
              recentFlightMultipliers={recentFlightMultipliers}
              onBalanceChange={setBalance}
              onFinished={refreshArcade}
            />
          </div>
        ) : (
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)]">
            <div className="min-w-0">
              <div className="mb-4 flex min-w-0 items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-rose-500">Pet Arcade</p>
                  <h2 className="mt-1 text-xl font-black text-neutral-950">Escolha sua aventura</h2>
                </div>
                <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold text-neutral-500 shadow-sm">
                  {filteredGames.length} jogos
                </span>
              </div>
              <div className="-mx-4 mb-5 flex touch-pan-x snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "h-10 shrink-0 snap-start rounded-full px-4 text-xs font-bold transition",
                      filter === item.key
                        ? "bg-neutral-950 text-white shadow-[0_18px_30px_rgba(15,23,42,0.16)]"
                        : "border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    active={activeRounds.some((round) => round.game_type === game.game_type)}
                    usedToday={usage?.by_game[game.game_type] ?? 0}
                    globalLimit={catalog.settings.daily_play_limit}
                    onOpen={() => setSelectedGame(game.game_type)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[30px] border border-amber-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,248,235,0.92),rgba(255,241,242,0.9))] p-5 shadow-[0_22px_55px_rgba(120,53,15,0.1)]">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                    <Coins className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs text-neutral-500">Saldo disponível</p>
                    <p className="text-xl font-black">{balance} moedas</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-neutral-400">Partidas hoje</p>
                    <p className="mt-1 font-bold">
                      {usage?.total_used ?? 0}/{catalog.settings.daily_play_limit}
                    </p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-neutral-400">Pet ativo</p>
                    <p className="mt-1 truncate font-bold">{pet.custom_name}</p>
                  </div>
                </div>
              </div>
              <ArcadeHistoryV2 items={history} />
            </div>
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <p>
            {catalog?.settings.healthy_play_message ??
              "Essas aventuras usam apenas moedas internas do app, sem valor financeiro real. Jogue com equilíbrio e cuide bem do seu pet."}
          </p>
        </div>
      </main>
    </div>
  );
}

function GameCard({
  game,
  active,
  usedToday,
  globalLimit,
  onOpen,
}: {
  game: ArcadeGameConfig;
  active: boolean;
  usedToday: number;
  globalLimit: number;
  onOpen: () => void;
}) {
  const Icon = GAME_ICONS[game.game_type];
  const visual = GAME_VISUALS[game.game_type];
  const limit = Math.min(game.daily_play_limit, globalLimit);
  return (
    <button
      type="button"
      disabled={!game.is_enabled}
      onClick={onOpen}
      className={cn(
        "group relative w-full min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br text-left text-white shadow-[0_22px_55px_rgba(15,23,42,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,23,42,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 active:scale-[0.985] disabled:opacity-50",
        visual.surface,
      )}
    >
      <span aria-hidden className={cn("absolute inset-0", visual.mesh)} />
      {visual.image ? (
        <div className="relative z-10 h-40 overflow-hidden">
          <img
            src={visual.image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-transparent to-transparent" />
        </div>
      ) : null}
      <div className={cn("relative z-10 p-3 sm:p-5", visual.image && "-mt-20 pt-3 sm:pt-5")}>
        <span
          aria-hidden
          className={cn(
            "absolute -right-12 -top-12 size-40 rounded-full blur-3xl transition duration-500 group-hover:scale-125",
            visual.glow,
          )}
        />
        <Icon
          aria-hidden
          className="absolute -right-5 top-12 size-32 rotate-[-8deg] text-white opacity-[0.07] transition duration-500 group-hover:rotate-0 group-hover:scale-110"
        />
        <div className="relative z-10 flex min-w-0 items-start justify-between gap-3">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-2xl shadow-xl sm:size-12",
              visual.icon,
            )}
          >
            <Icon className="size-5 sm:size-6" />
          </span>
          <span className="min-w-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase text-white/80 backdrop-blur-sm">
            {active ? "Em andamento" : CATEGORY_LABELS[game.category]}
          </span>
        </div>
        <div className="relative z-10 mt-5 min-w-0">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-white/55">
            <Sparkles className="size-3" /> {visual.kicker}
          </p>
          <h2 className="mt-1 break-words text-sm font-black leading-tight text-white sm:text-lg">
            {game.display_name}
          </h2>
        </div>
        <p className="relative z-10 mt-2 hidden line-clamp-3 break-words text-xs leading-relaxed text-white/65 sm:block">
          {game.description}
        </p>
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/82 backdrop-blur-sm">
            {game.min_entry}-{game.max_entry} moedas
          </span>
          <span className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/82 backdrop-blur-sm">
            {usedToday}/{limit} hoje
          </span>
        </div>
        <div className="relative z-10 mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t border-white/10 pt-3 text-[9px] font-bold uppercase text-white/55">
          <span className="min-w-0 truncate">
            Entrada {game.min_entry}–{game.max_entry}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-white/75">
            {usedToday}/{limit} hoje <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

type GameStageProps = {
  game: ArcadeGameType;
  config: ArcadeGameConfig;
  legacyConfig: PetArcadeConfig;
  balance: number;
  petImage: string | null;
  careScore: number;
  activeRound?: ActiveArcadeRound;
  activeTreasure?: ActiveArcadeRound;
  activeFlight?: ActiveArcadeRound;
  recentFlightMultipliers: number[];
  onBalanceChange: (balance: number) => void;
  onFinished: () => void;
};

function GameStage(props: GameStageProps) {
  const common = {
    config: props.config,
    balance: props.balance,
    petImage: props.petImage,
    careScore: props.careScore,
    activeRound: props.activeRound,
    onBalanceChange: props.onBalanceChange,
    onFinished: props.onFinished,
  };
  switch (props.game) {
    case "treasure":
      return (
        <TreasureAdventure
          config={props.legacyConfig}
          balance={props.balance}
          activeRound={props.activeTreasure}
          onBalanceChange={props.onBalanceChange}
          onFinished={props.onFinished}
        />
      );
    case "flight":
      return (
        <StellarFlight
          config={props.legacyConfig}
          balance={props.balance}
          petImage={props.petImage}
          activeRound={props.activeFlight}
          recentMultipliers={props.recentFlightMultipliers}
          onBalanceChange={props.onBalanceChange}
          onFinished={props.onFinished}
        />
      );
    case "plinko":
      return <PlinkoGame {...common} />;
    case "keno":
      return <KenoGame {...common} />;
    case "wheel":
      return <WheelGame {...common} />;
    case "hilo":
      return <HiloGame {...common} />;
    case "towers":
      return <TowersGame {...common} />;
    case "coinflip":
      return <CoinFlipGame {...common} />;
    case "race":
      return <PetRaceGame {...common} />;
    case "memory":
      return <MemoryGame {...common} />;
    case "piggybank":
      return <PiggyBankGame {...common} />;
    case "dice":
      return <DiceGame {...common} />;
    case "scratch":
      return <ScratchGame {...common} />;
    case "egg":
      return <SurpriseEggGame {...common} />;
    case "album":
      return <PetAlbumGame {...common} />;
    case "capsule":
      return <CapsuleGame {...common} />;
    case "missions":
      return <DailyMissionsGame {...common} />;
  }
}
