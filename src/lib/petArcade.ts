import { supabase } from "@/integrations/supabase/client";

export type ArcadeGameType = "treasure" | "flight";
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

async function callRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw error;
  return data as T;
}

export function getPetArcadeConfig() {
  return callRpc<PetArcadeConfig>("get_pet_arcade_config");
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

export function getArcadeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (normalized.includes("insufficient_coins")) return "Saldo insuficiente para esta entrada.";
  if (normalized.includes("pet_required")) return "Escolha um pet antes de entrar no Pet Arcade.";
  if (normalized.includes("daily_round_limit"))
    return "Seu limite diário de rodadas foi alcançado.";
  if (normalized.includes("game_unavailable"))
    return "Esta aventura está temporariamente indisponível.";
  if (normalized.includes("round_in_progress")) return "Você já possui uma rodada em andamento.";
  if (normalized.includes("round_already_finished")) return "Esta rodada já foi finalizada.";
  if (normalized.includes("position_already_revealed")) return "Essa casa já foi revelada.";
  if (normalized.includes("invalid_entry"))
    return "Escolha uma entrada dentro dos limites permitidos.";
  return "Não foi possível concluir esta ação. Tente novamente.";
}
