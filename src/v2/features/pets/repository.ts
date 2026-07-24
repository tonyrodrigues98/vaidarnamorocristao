import { supabase } from "@/integrations/supabase/client";
import {
  isPetArcadeGameId,
  isPetCareKind,
  safePetAssetUrl,
  type PetArcadeHistory,
  type PetArcadeServerGame,
  type PetArcadeSnapshot,
  type PetCareHistoryEntry,
  type PetCareItem,
  type PetCareReceipt,
  type PetCatalogReference,
  type PetIdentity,
  type PetPlatformRepository,
  type PetPlatformSnapshot,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar os dados do pet agora.";

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nonNegativeInteger(value: unknown) {
  return Math.max(0, Math.trunc(number(value)));
}

function parseReference(value: unknown): PetCatalogReference | null {
  if (!isRecord(value) || !text(value.id) || !text(value.name)) return null;
  return {
    id: text(value.id),
    name: text(value.name),
    imageUrl: safePetAssetUrl(value.image_url),
    imageUrlBaby: safePetAssetUrl(value.image_url_baby),
    imageUrlAdult: safePetAssetUrl(value.image_url_adult),
    kind: nullableText(value.kind),
    description: nullableText(value.description),
  };
}

function parsePet(value: unknown): PetIdentity | null {
  if (!isRecord(value)) return null;
  const category = parseReference(value.category);
  const lifeStage = parseReference(value.life_stage);
  const personality = parseReference(value.personality);
  if (!text(value.id) || !category || !lifeStage || !personality) return null;
  return {
    id: text(value.id),
    customName: text(value.custom_name, "Meu pet"),
    visibility: text(value.visibility, "private"),
    isEquipped: value.is_equipped === true,
    createdAt: text(value.created_at),
    category,
    species: parseReference(value.species),
    variant: parseReference(value.variant),
    lifeStage,
    personality,
    benefit: parseReference(value.benefit),
  };
}

function parseCareItem(value: unknown): PetCareItem | null {
  if (!isRecord(value) || !text(value.id) || !isPetCareKind(value.kind)) return null;
  return {
    id: text(value.id),
    kind: value.kind,
    name: text(value.name, "Cuidado"),
    description: text(value.description),
    imageUrl: safePetAssetUrl(value.image_url),
    costCoins: nonNegativeInteger(value.cost_coins),
    restoreAmount: nonNegativeInteger(value.restore_amount),
    energyCost: nonNegativeInteger(value.energy_cost),
    sleepHours: nonNegativeInteger(value.sleep_hours),
    dailyUses: nonNegativeInteger(value.daily_uses),
    usesToday: nonNegativeInteger(value.uses_today),
  };
}

function parseHistory(value: unknown): PetCareHistoryEntry | null {
  if (!isRecord(value) || !text(value.id)) return null;
  return {
    id: text(value.id),
    kind: text(value.kind, "care"),
    delta: number(value.delta),
    costCoins: nonNegativeInteger(value.cost_coins),
    createdAt: text(value.created_at),
  };
}

export function parsePetPlatformSnapshot(value: unknown): PetPlatformSnapshot {
  const row = isRecord(value) ? value : {};
  const config = isRecord(row.care_config) ? row.care_config : {};
  const preserved = isRecord(row.preserved_families) ? row.preserved_families : {};
  return {
    serverNow: text(row.server_now),
    pet: parsePet(row.pet),
    careConfig: {
      decayPerHour: Math.max(0, number(config.decay_per_hour, 2)),
      energyRegenMinutesPerPoint: Math.max(1, number(config.energy_regen_minutes_per_point, 6)),
    },
    careState: Array.isArray(row.care_state)
      ? row.care_state
          .filter(isRecord)
          .map((state) => ({
            kind: text(state.kind),
            valueAtAnchor: number(state.value_at_anchor),
            anchorAt: text(state.anchor_at),
          }))
          .filter((state) => state.kind && state.anchorAt)
      : [],
    careItems: Array.isArray(row.care_items)
      ? row.care_items.map(parseCareItem).filter((item): item is PetCareItem => item !== null)
      : [],
    careHistory: Array.isArray(row.care_history)
      ? row.care_history
          .map(parseHistory)
          .filter((entry): entry is PetCareHistoryEntry => entry !== null)
      : [],
    preservedFamilies: {
      userPetsCount: nonNegativeInteger(preserved.user_pets_count),
      userPetsEquippedCount: nonNegativeInteger(preserved.user_pets_equipped_count),
      userPetsV2Count: nonNegativeInteger(preserved.user_pets_v2_count),
      userPetsV2EquippedCount: nonNegativeInteger(preserved.user_pets_v2_equipped_count),
    },
  };
}

export function parsePetCareReceipt(value: unknown): PetCareReceipt {
  const row = isRecord(value) ? value : {};
  return {
    receiptId: text(row.receipt_id),
    userPetId: text(row.user_pet_id),
    itemId: text(row.item_id),
    completedAt: text(row.completed_at),
  };
}

function parseArcadeGame(value: unknown): PetArcadeServerGame | null {
  if (!isRecord(value) || !isPetArcadeGameId(value.game_type)) return null;
  return {
    gameType: value.game_type,
    displayName: text(value.display_name, value.game_type),
    description: text(value.description),
    category: text(value.category, "unknown"),
    enabled: value.is_enabled === true,
    dailyPlayLimit: nonNegativeInteger(value.daily_play_limit),
    dailyWinLimit: nonNegativeInteger(value.daily_win_limit),
  };
}

function parseArcadeHistory(value: unknown): PetArcadeHistory | null {
  if (!isRecord(value) || !text(value.id) || !isPetArcadeGameId(value.game_type)) return null;
  return {
    id: text(value.id),
    gameType: value.game_type,
    status: text(value.status, "unknown"),
    rewardCoins: nonNegativeInteger(value.reward_coins),
    xpReward: nonNegativeInteger(value.xp_reward),
    startedAt: text(value.started_at),
  };
}

export function parsePetArcadeSnapshot(
  catalogValue: unknown,
  historyValue: unknown,
  usageValue: unknown,
): PetArcadeSnapshot {
  const catalog = isRecord(catalogValue) ? catalogValue : {};
  const settings = isRecord(catalog.settings) ? catalog.settings : {};
  const usage = isRecord(usageValue) ? usageValue : {};
  return {
    platformEnabled: settings.is_enabled === true,
    maintenanceMessage: text(settings.maintenance_message),
    healthyPlayMessage: text(settings.healthy_play_message),
    usageToday: nonNegativeInteger(usage.total_used),
    games: Array.isArray(catalog.games)
      ? catalog.games
          .map(parseArcadeGame)
          .filter((game): game is PetArcadeServerGame => game !== null)
      : [],
    history: Array.isArray(historyValue)
      ? historyValue
          .map(parseArcadeHistory)
          .filter((entry): entry is PetArcadeHistory => entry !== null)
      : [],
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabasePetPlatformRepository: PetPlatformRepository = {
  async loadHub(_userId) {
    return parsePetPlatformSnapshot(await rpc("get_pet_platform_hub_v2"));
  },
  async applyCare(_userId, petId, itemId, idempotencyKey) {
    return parsePetCareReceipt(
      await rpc("apply_pet_care_v2", {
        _user_pet_id: petId,
        _item_id: itemId,
        _idempotency_key: idempotencyKey,
      }),
    );
  },
  async loadArcade(_userId) {
    const [catalog, history, usage] = await Promise.all([
      rpc("get_pet_arcade_catalog"),
      rpc("get_pet_arcade_history_v2", { _limit: 20 }),
      rpc("get_pet_arcade_usage_today"),
    ]);
    return parsePetArcadeSnapshot(catalog, history, usage);
  },
};

export const petRepositoryBoundaries = Object.freeze({
  serverOwnsTimeAndDecay: true,
  serverOwnsRewardsAndCosts: true,
  commandsRequireIdempotency: true,
  legacyAndV2PetTablesRemainSeparate: true,
  arcadeLoadsOnlyWhenRequested: true,
  presentationReceivesSession: false,
});
