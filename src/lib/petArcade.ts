import { supabase } from "@/integrations/supabase/client";

export type ArcadeGameType =
  | "treasure"
  | "flight"
  | "plinko"
  | "keno"
  | "wheel"
  | "hilo"
  | "towers"
  | "coinflip"
  | "race"
  | "memory"
  | "piggybank"
  | "dice";
export type ArcadeRoundStatus = "active" | "collected" | "lost" | "cancelled";
export type TreasureDifficulty = "leve" | "aventureiro" | "radical";

export type PetArcadeConfig = {
  id: number;
  treasure_active: boolean;
  flight_active: boolean;
  maintenance: boolean;
  min_entry: number;
  max_entry: number;
  daily_round_limit: number;
  daily_reward_limit: number;
  max_multiplier: number;
  treasure_grid_size: number;
  treasure_difficulties: Record<TreasureDifficulty, number>;
  explanatory_text: string;
  updated_at: string;
};

export type ArcadeVerification = {
  server_seed?: string | null;
  server_seed_hash?: string;
  client_seed?: string;
  nonce?: number;
};

export type TreasureRound = ArcadeVerification & {
  round_id: string;
  status: ArcadeRoundStatus;
  difficulty: TreasureDifficulty;
  grid_size: number;
  trap_count: number;
  revealed_positions?: number[];
  safe_reveals?: number;
  position?: number;
  is_trap?: boolean;
  multiplier: number;
  potential_reward?: number;
  reward_coins?: number;
  new_balance?: number;
  trap_positions?: number[];
  reward_limited?: boolean;
};

export type FlightRound = ArcadeVerification & {
  round_id: string;
  status: ArcadeRoundStatus;
  started_at?: string;
  server_now?: string;
  multiplier: number;
  auto_collect_multiplier?: number | null;
  reward_coins?: number;
  new_balance?: number;
  reward_limited?: boolean;
};

export type ArcadeHistoryItem = ArcadeVerification & {
  id: string;
  game_type: ArcadeGameType;
  status: ArcadeRoundStatus;
  entry_coins: number;
  multiplier: number;
  reward_coins: number;
  started_at: string;
  ended_at: string | null;
  difficulty?: TreasureDifficulty | null;
  trap_positions?: number[] | null;
  final_multiplier?: number | null;
};

export type ActiveArcadeRound = {
  round_id: string;
  game_type: ArcadeGameType;
  status: "active";
  entry_coins: number;
  multiplier: number;
  started_at: string;
  difficulty?: TreasureDifficulty;
  grid_size?: number;
  trap_count?: number;
  revealed_positions?: number[];
  safe_reveals?: number;
  auto_collect_multiplier?: number | null;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
};

export type AdminArcadeRound = {
  id: string;
  user_id: string;
  game_type: ArcadeGameType;
  status: ArcadeRoundStatus;
  entry_coins: number;
  current_multiplier: number;
  reward_coins: number;
  started_at: string;
  ended_at: string | null;
};

export type AdminArcadeSignal = {
  user_id: string;
  rounds_7d: number;
  total_entries: number;
  total_rewards: number;
  net_coins: number;
  high_activity: boolean;
};

export type ArcadeCategory = "quick" | "strategy" | "luck" | "care";

export type ArcadeGlobalSettings = {
  id: number;
  is_enabled: boolean;
  daily_play_limit: number;
  daily_win_limit: number;
  global_min_entry: number;
  global_max_entry: number;
  maintenance_message: string;
  healthy_play_message: string;
  created_at: string;
  updated_at: string;
};

export type ArcadeGameConfig = {
  id: string;
  game_type: ArcadeGameType;
  display_name: string;
  description: string;
  category: ArcadeCategory;
  is_enabled: boolean;
  min_entry: number;
  max_entry: number;
  daily_play_limit: number;
  daily_win_limit: number;
  cooldown_seconds: number;
  max_multiplier: number;
  difficulty_config: Record<string, unknown>;
  reward_config: Record<string, unknown>;
  visual_config: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ArcadeCatalog = {
  settings: ArcadeGlobalSettings;
  games: ArcadeGameConfig[];
};

export type ArcadeUsageToday = {
  total_used: number;
  by_game: Partial<Record<ArcadeGameType, number>>;
  day: string;
};

export type ArcadeGameResult = ArcadeVerification & {
  game_id: string;
  round_id?: string;
  game_type?: ArcadeGameType;
  status: ArcadeRoundStatus;
  multiplier?: number;
  reward_coins?: number;
  xp_reward?: number;
  new_balance?: number;
  result?: Record<string, unknown>;
  reward_limited?: boolean;
  [key: string]: unknown;
};

export type ArcadeHistoryV2Item = {
  id: string;
  game_type: ArcadeGameType;
  status: ArcadeRoundStatus;
  entry_coins: number;
  difficulty: string | null;
  current_multiplier: number;
  reward_coins: number;
  xp_reward: number;
  result_summary: Record<string, unknown>;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};

export type ArcadeAdminMetric = {
  game_type: ArcadeGameType;
  rounds: number;
  total_entries: number;
  total_rewards: number;
  net_coins: number;
};

async function callRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw error;
  return data as T;
}

export function getPetArcadeConfig() {
  return callRpc<PetArcadeConfig>("get_pet_arcade_config");
}

export function getPetArcadeCatalog() {
  return callRpc<ArcadeCatalog>("get_pet_arcade_catalog");
}

export function getPetArcadeHistoryV2(limit = 30) {
  return callRpc<ArcadeHistoryV2Item[]>("get_pet_arcade_history_v2", { _limit: limit });
}

export function getPetArcadeHistory(limit = 20) {
  return callRpc<ArcadeHistoryItem[]>("get_pet_arcade_history", { _limit: limit });
}

export function getActivePetArcadeRounds() {
  return callRpc<ActiveArcadeRound[]>("get_pet_arcade_active_rounds");
}

export function startTreasureRound(input: {
  entryCoins: number;
  difficulty: TreasureDifficulty;
  clientSeed: string;
}) {
  return callRpc<TreasureRound>("start_pet_arcade_treasure", {
    _entry_coins: input.entryCoins,
    _difficulty: input.difficulty,
    _client_seed: input.clientSeed,
  });
}

export function revealTreasureCell(roundId: string, position: number) {
  return callRpc<TreasureRound>("reveal_pet_arcade_treasure", {
    _round_id: roundId,
    _position: position,
  });
}

export function collectTreasureReward(roundId: string) {
  return callRpc<TreasureRound>("collect_pet_arcade_treasure", { _round_id: roundId });
}

export function startFlightRound(input: {
  entryCoins: number;
  autoCollectMultiplier: number | null;
  clientSeed: string;
}) {
  return callRpc<FlightRound>("start_pet_arcade_flight", {
    _entry_coins: input.entryCoins,
    _auto_collect_multiplier: input.autoCollectMultiplier,
    _client_seed: input.clientSeed,
  });
}

export function collectFlightReward(roundId: string) {
  return callRpc<FlightRound>("collect_pet_arcade_flight", { _round_id: roundId });
}

export function finalizeFlightRound(roundId: string) {
  return callRpc<FlightRound>("finalize_pet_arcade_flight", { _round_id: roundId });
}

export function updatePetArcadeConfig(patch: Partial<PetArcadeConfig>) {
  return callRpc<PetArcadeConfig>("pet_arcade_admin_update_config", { _patch: patch });
}

export function getAdminArcadeRounds(limit = 100) {
  return callRpc<AdminArcadeRound[]>("pet_arcade_admin_recent_rounds", { _limit: limit });
}

export function getAdminArcadeSignals() {
  return callRpc<AdminArcadeSignal[]>("pet_arcade_admin_user_signals");
}

export function startPlinko(entryCoins: number, difficulty: string, clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_plinko", {
    _entry_coins: entryCoins,
    _difficulty: difficulty,
    _client_seed: clientSeed,
  });
}

export function startKeno(entryCoins: number, chosenNumbers: number[], clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_keno", {
    _entry_coins: entryCoins,
    _chosen_numbers: chosenNumbers,
    _client_seed: clientSeed,
  });
}

export function startWheel(entryCoins: number, difficulty: string, clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_wheel", {
    _entry_coins: entryCoins,
    _difficulty: difficulty,
    _client_seed: clientSeed,
  });
}

export function startHilo(entryCoins: number, clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_hilo", {
    _entry_coins: entryCoins,
    _client_seed: clientSeed,
  });
}

export function chooseHilo(gameId: string, choice: "higher" | "lower", expectedStep: number) {
  return callRpc<ArcadeGameResult>("choose_pet_hilo", {
    _game_id: gameId,
    _choice: choice,
    _expected_step: expectedStep,
  });
}

export function collectHilo(gameId: string) {
  return callRpc<ArcadeGameResult>("cashout_pet_hilo", { _game_id: gameId });
}

export function startTowers(entryCoins: number, difficulty: string, clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_towers", {
    _entry_coins: entryCoins,
    _difficulty: difficulty,
    _client_seed: clientSeed,
  });
}

export function chooseTowerTile(gameId: string, tile: number, expectedFloor: number) {
  return callRpc<ArcadeGameResult>("choose_pet_tower_tile", {
    _game_id: gameId,
    _tile: tile,
    _expected_floor: expectedFloor,
  });
}

export function collectTowers(gameId: string) {
  return callRpc<ArcadeGameResult>("cashout_pet_towers", { _game_id: gameId });
}

export function startCoinFlip(entryCoins: number, side: "paw" | "heart", clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_coinflip", {
    _entry_coins: entryCoins,
    _side: side,
    _client_seed: clientSeed,
  });
}

export function startPetRace(entryCoins: number, clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_race", {
    _entry_coins: entryCoins,
    _client_seed: clientSeed,
  });
}

export function startMemory(entryCoins: number, difficulty: string, clientSeed: string) {
  return callRpc<ArcadeGameResult>("start_pet_memory", {
    _entry_coins: entryCoins,
    _difficulty: difficulty,
    _client_seed: clientSeed,
  });
}

export function revealMemoryCard(gameId: string, position: number) {
  return callRpc<ArcadeGameResult>("reveal_pet_memory_card", {
    _game_id: gameId,
    _position: position,
  });
}

export function startPiggyBank(deposit: number, hours: number) {
  return callRpc<ArcadeGameResult>("start_pet_piggybank", {
    _deposit: deposit,
    _hours: hours,
  });
}

export function claimPiggyBank(gameId: string) {
  return callRpc<ArcadeGameResult>("claim_pet_piggybank", { _game_id: gameId });
}

export function cancelPiggyBank(gameId: string) {
  return callRpc<ArcadeGameResult>("cancel_pet_piggybank", { _game_id: gameId });
}

export function startDice(
  entryCoins: number,
  condition: "above" | "below",
  target: number,
  clientSeed: string,
) {
  return callRpc<ArcadeGameResult>("start_pet_dice", {
    _entry_coins: entryCoins,
    _condition: condition,
    _target: target,
    _client_seed: clientSeed,
  });
}

export function resumeArcadeGame(gameId: string) {
  return callRpc<ArcadeGameResult>("resume_pet_arcade_game", { _game_id: gameId });
}

export function updatePetArcadeSettings(patch: Partial<ArcadeGlobalSettings>) {
  return callRpc<ArcadeGlobalSettings>("pet_arcade_admin_update_settings", { _patch: patch });
}

export function updatePetArcadeGameConfig(
  gameType: ArcadeGameType,
  patch: Partial<ArcadeGameConfig>,
) {
  return callRpc<ArcadeGameConfig>("pet_arcade_admin_update_game_config", {
    _game_type: gameType,
    _patch: patch,
  });
}

export function getPetArcadeAdminMetrics() {
  return callRpc<ArcadeAdminMetric[]>("pet_arcade_admin_metrics");
}

export function getPetArcadeUsageToday() {
  return callRpc<ArcadeUsageToday>("get_pet_arcade_usage_today");
}

export function getArcadeErrorMessage(error: unknown): string {
  const message = extractArcadeErrorText(error);
  const normalized = message.toLowerCase();
  if (normalized.includes("insufficient_coins")) return "Saldo insuficiente para esta entrada.";
  if (normalized.includes("pet_required")) return "Escolha um pet antes de entrar no Pet Arcade.";
  if (normalized.includes("daily_round_limit"))
    return "Seu limite diário de rodadas foi alcançado.";
  if (normalized.includes("game_unavailable"))
    return "Esta aventura está temporariamente indisponível.";
  if (normalized.includes("round_in_progress")) return "Você já possui uma rodada em andamento.";
  if (normalized.includes("round_already_finished")) return "Esta rodada já foi finalizada.";
  if (normalized.includes("game_daily_limit"))
    return "O limite diário desta aventura foi alcançado.";
  if (normalized.includes("cooldown_active"))
    return "Seu pet precisa de alguns instantes antes de iniciar outra rodada.";
  if (normalized.includes("invalid_selection")) return "Revise sua escolha antes de continuar.";
  if (normalized.includes("stale_action"))
    return "Esta ação já foi processada. O estado da rodada foi atualizado.";
  if (normalized.includes("piggybank_not_ready"))
    return "O cofrinho ainda está crescendo. Aguarde o tempo indicado.";
  if (normalized.includes("insufficient_pet_images"))
    return "Ainda não há pets suficientes desta fase para esta aventura.";
  if (normalized.includes("position_already_revealed")) return "Essa casa já foi revelada.";
  if (normalized.includes("invalid_entry"))
    return "Escolha uma entrada dentro dos limites permitidos.";
  return "Não foi possível concluir esta ação. Tente novamente.";
}

function extractArcadeErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== "object") return String(error ?? "");
  const record = error as Record<string, unknown>;
  return [record.message, record.details, record.hint, record.code]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}
