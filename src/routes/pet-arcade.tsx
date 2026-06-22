import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Coins, Gamepad2, Gem, Loader2, PawPrint, Rocket, Wrench } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { ArcadeHistory } from "@/components/pet/arcade/ArcadeHistory";
import { TreasureAdventure } from "@/components/pet/arcade/TreasureAdventure";
import { StellarFlight } from "@/components/pet/arcade/StellarFlight";
import { useAuth } from "@/lib/auth";
import { getMyCoins } from "@/lib/coins";
import { resolvePetDisplayImage } from "@/lib/petCatalog";
import { myPetV2QueryOptions } from "@/lib/petQueries";
import { getActivePetArcadeRounds, getPetArcadeConfig, getPetArcadeHistory } from "@/lib/petArcade";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pet-arcade")({
  head: () => ({ meta: [{ title: "Pet Arcade | VaiDarNamoro" }] }),
  component: PetArcadePage,
});

function PetArcadePage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [game, setGame] = useState<"treasure" | "flight">("treasure");
  const [balance, setBalance] = useState(0);

  const petQuery = useQuery(myPetV2QueryOptions(user?.id));
  const configQuery = useQuery({
    queryKey: ["pet-arcade", "config"],
    queryFn: getPetArcadeConfig,
    enabled: !!user,
    staleTime: 60_000,
  });
  const coinsQuery = useQuery({
    queryKey: ["coins", "mine"],
    queryFn: getMyCoins,
    enabled: !!user,
  });
  const historyQuery = useQuery({
    queryKey: ["pet-arcade", "history"],
    queryFn: () => getPetArcadeHistory(20),
    enabled: !!user,
  });
  const activeQuery = useQuery({
    queryKey: ["pet-arcade", "active"],
    queryFn: getActivePetArcadeRounds,
    enabled: !!user,
  });

  useEffect(() => {
    if (coinsQuery.data) setBalance(coinsQuery.data.balance);
  }, [coinsQuery.data]);

  const refreshArcade = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["pet-arcade"] });
    void queryClient.invalidateQueries({ queryKey: ["coins", "mine"] });
  }, [queryClient]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  const pet = petQuery.data ?? null;
  const petImage = pet
    ? resolvePetDisplayImage(pet.variant, pet.life_stage?.kind ?? null) ||
      resolvePetDisplayImage(pet.species, pet.life_stage?.kind ?? null) ||
      pet.category?.image_url ||
      null
    : null;
  const config = configQuery.data;
  const history = historyQuery.data ?? [];
  const activeRounds = activeQuery.data ?? [];
  const activeTreasure = activeRounds.find((round) => round.game_type === "treasure");
  const activeFlight = activeRounds.find((round) => round.game_type === "flight");
  const recentFlightMultipliers = history
    .filter((item) => item.game_type === "flight" && item.status !== "active")
    .map((item) => Number(item.final_multiplier ?? item.multiplier));
  const loadingData =
    petQuery.isLoading ||
    configQuery.isLoading ||
    coinsQuery.isLoading ||
    historyQuery.isLoading ||
    activeQuery.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-white to-sky-50/50 text-neutral-950">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pb-12 sm:pt-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            to="/meu-pet"
            className="app-pressable grid h-11 w-11 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm"
            aria-label="Voltar para Meu Pet"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-semibold uppercase text-rose-500">Aventuras do pet</p>
            <h1 className="truncate text-xl font-black">Pet Arcade</h1>
          </div>
          <div className="inline-flex h-11 items-center gap-2 rounded-full border border-amber-200 bg-white px-3 shadow-sm">
            <CoinIcon className="h-5 w-5" />
            <span className="font-black">{balance}</span>
          </div>
        </div>

        <section className="mb-5 overflow-hidden rounded-3xl border border-white bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 to-sky-100">
              {petImage ? (
                <img
                  src={petImage}
                  alt={pet?.custom_name ?? "Pet"}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <PawPrint className="h-7 w-7 text-rose-500" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-rose-500" />
                <p className="text-sm font-bold">{pet?.custom_name ?? "Seu pet"}</p>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                {config?.explanatory_text ??
                  "Aventuras do seu pet com moedas internas do app e recompensas controladas pelo servidor."}
              </p>
            </div>
          </div>
        </section>

        {loadingData ? (
          <div className="grid min-h-64 place-items-center rounded-3xl bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
          </div>
        ) : configQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm">
            <Wrench className="mx-auto h-8 w-8 text-rose-500" />
            <h2 className="mt-3 font-bold">Pet Arcade ainda não está configurado</h2>
            <p className="mt-2 text-sm text-neutral-600">
              A migration do Pet Arcade precisa ser aplicada no Supabase antes de usar esta tela.
            </p>
          </div>
        ) : !pet ? (
          <div className="rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm">
            <PawPrint className="mx-auto h-9 w-9 text-amber-500" />
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
        ) : config?.maintenance ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
            <Wrench className="mx-auto h-9 w-9 text-neutral-500" />
            <h2 className="mt-3 text-lg font-bold">Pet Arcade em manutenção</h2>
            <p className="mt-2 text-sm text-neutral-600">
              As aventuras voltarão assim que a manutenção terminar.
            </p>
          </div>
        ) : config ? (
          <>
            <div className="mb-4 grid grid-cols-2 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setGame("treasure")}
                disabled={!config.treasure_active}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition",
                  game === "treasure" ? "bg-amber-500 text-white shadow" : "text-neutral-500",
                )}
              >
                <Gem className="h-4 w-4" /> Tesouros
              </button>
              <button
                type="button"
                onClick={() => setGame("flight")}
                disabled={!config.flight_active}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition",
                  game === "flight" ? "bg-sky-500 text-white shadow" : "text-neutral-500",
                )}
              >
                <Rocket className="h-4 w-4" /> Voo Estelar
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
              <div>
                {game === "treasure" ? (
                  <TreasureAdventure
                    config={config}
                    balance={balance}
                    activeRound={activeTreasure}
                    onBalanceChange={setBalance}
                    onFinished={refreshArcade}
                  />
                ) : (
                  <StellarFlight
                    config={config}
                    balance={balance}
                    petImage={petImage}
                    activeRound={activeFlight}
                    recentMultipliers={recentFlightMultipliers}
                    onBalanceChange={setBalance}
                    onFinished={refreshArcade}
                  />
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                      <Coins className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-neutral-500">Saldo disponível</p>
                      <p className="text-xl font-black">{balance} moedas</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-neutral-400">Rodadas/dia</p>
                      <p className="mt-1 font-bold text-neutral-800">{config.daily_round_limit}</p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-neutral-400">Máximo</p>
                      <p className="mt-1 font-bold text-neutral-800">
                        {Number(config.max_multiplier)}x
                      </p>
                    </div>
                  </div>
                </div>
                <ArcadeHistory items={history} />
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
