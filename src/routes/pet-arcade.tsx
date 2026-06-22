import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  Building2,
  CircleDollarSign,
  Coins,
  Cookie,
  Dices,
  Disc3,
  Flag,
  Gamepad2,
  Gem,
  Grid3X3,
  Layers3,
  Loader2,
  PawPrint,
  PiggyBank,
  Rocket,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
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
};

const FILTERS: { key: "all" | ArcadeCategory; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "quick", label: "Rápidos" },
  { key: "strategy", label: "Estratégia" },
  { key: "luck", label: "Sorte" },
  { key: "care", label: "Cuidado" },
];

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
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-white to-sky-50/60 text-neutral-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pb-12 sm:pt-8">
        <div className="mb-5 flex items-center justify-between gap-3">
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
          <div className="inline-flex h-11 items-center gap-2 rounded-full border border-amber-200 bg-white px-3 shadow-sm">
            <CoinIcon className="size-5" />
            <span className="font-black">{balance}</span>
          </div>
        </div>

        <section className="mb-5 overflow-hidden rounded-3xl border border-white bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 to-sky-100">
              {petImage ? (
                <PetImg
                  src={petImage}
                  alt={pet?.custom_name ?? "Pet"}
                  className="size-full object-contain p-1"
                />
              ) : (
                <PawPrint className="size-8 text-rose-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Gamepad2 className="size-4 text-rose-500" />
                <p className="text-sm font-black">{pet?.custom_name ?? "Seu pet"}</p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  Cuidado {careScore}%
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                Aventuras rápidas, progressão e cuidado usando apenas moedas internas.
              </p>
              {careValues.length ? (
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {careValues.map((item) => (
                    <div key={item.kind} className="rounded-xl bg-neutral-50 px-2 py-1.5">
                      <p className="truncate text-[9px] text-neutral-400">{item.label}</p>
                      <p className="text-xs font-black">{Math.round(item.value)}%</p>
                    </div>
                  ))}
                </div>
              ) : null}
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
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)]">
            <div>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "h-10 shrink-0 rounded-full px-4 text-xs font-bold transition",
                      filter === item.key
                        ? "bg-neutral-950 text-white"
                        : "border border-neutral-200 bg-white text-neutral-600",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
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
  return (
    <button
      type="button"
      disabled={!game.is_enabled}
      onClick={onOpen}
      className="group min-h-48 overflow-hidden rounded-3xl border border-white bg-white p-5 text-left shadow-[0_16px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50"
    >
      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-100">
          <Icon className="size-6" />
        </span>
        {active ? (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
            Em andamento
          </span>
        ) : null}
      </div>
      <h2 className="mt-5 font-black tracking-tight text-neutral-950">{game.display_name}</h2>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">
        {game.description}
      </p>
      <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400">
        <span>
          Entrada {game.min_entry}–{game.max_entry}
        </span>
        <span>
          {usedToday}/{Math.min(game.daily_play_limit, globalLimit)} hoje
        </span>
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
  }
}
