export const PET_CARE_KINDS = ["feed", "play", "hygiene", "sleep", "affection"] as const;
export type PetCareKind = (typeof PET_CARE_KINDS)[number];

export const PET_ARCADE_GAME_IDS = [
  "treasure",
  "flight",
  "plinko",
  "keno",
  "wheel",
  "hilo",
  "towers",
  "coinflip",
  "race",
  "memory",
  "piggybank",
  "dice",
  "scratch",
  "egg",
  "album",
  "capsule",
  "missions",
] as const;
export type PetArcadeGameId = (typeof PET_ARCADE_GAME_IDS)[number];

export interface PetCatalogReference {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string | null;
  readonly imageUrlBaby?: string | null;
  readonly imageUrlAdult?: string | null;
  readonly kind?: string | null;
  readonly description?: string | null;
}

export interface PetIdentity {
  readonly id: string;
  readonly customName: string;
  readonly visibility: string;
  readonly isEquipped: boolean;
  readonly createdAt: string;
  readonly category: PetCatalogReference;
  readonly species: PetCatalogReference | null;
  readonly variant: PetCatalogReference | null;
  readonly lifeStage: PetCatalogReference;
  readonly personality: PetCatalogReference;
  readonly benefit: PetCatalogReference | null;
}

export interface PetCareConfig {
  readonly decayPerHour: number;
  readonly energyRegenMinutesPerPoint: number;
}

export interface PetCareAnchor {
  readonly kind: string;
  readonly valueAtAnchor: number;
  readonly anchorAt: string;
}

export interface PetCareItem {
  readonly id: string;
  readonly kind: PetCareKind;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly costCoins: number;
  readonly restoreAmount: number;
  readonly energyCost: number;
  readonly sleepHours: number;
  readonly dailyUses: number;
  readonly usesToday: number;
}

export interface PetCareHistoryEntry {
  readonly id: string;
  readonly kind: string;
  readonly delta: number;
  readonly costCoins: number;
  readonly createdAt: string;
}

export interface PreservedPetFamilies {
  readonly userPetsCount: number;
  readonly userPetsEquippedCount: number;
  readonly userPetsV2Count: number;
  readonly userPetsV2EquippedCount: number;
}

export interface PetPlatformSnapshot {
  readonly serverNow: string;
  readonly pet: PetIdentity | null;
  readonly careConfig: PetCareConfig;
  readonly careState: readonly PetCareAnchor[];
  readonly careItems: readonly PetCareItem[];
  readonly careHistory: readonly PetCareHistoryEntry[];
  readonly preservedFamilies: PreservedPetFamilies;
}

export interface PetCareReceipt {
  readonly receiptId: string;
  readonly userPetId: string;
  readonly itemId: string;
  readonly completedAt: string;
}

export interface PetArcadeServerGame {
  readonly gameType: PetArcadeGameId;
  readonly displayName: string;
  readonly description: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly dailyPlayLimit: number;
  readonly dailyWinLimit: number;
}

export interface PetArcadeHistory {
  readonly id: string;
  readonly gameType: PetArcadeGameId;
  readonly status: string;
  readonly rewardCoins: number;
  readonly xpReward: number;
  readonly startedAt: string;
}

export interface PetArcadeSnapshot {
  readonly platformEnabled: boolean;
  readonly maintenanceMessage: string;
  readonly healthyPlayMessage: string;
  readonly usageToday: number;
  readonly games: readonly PetArcadeServerGame[];
  readonly history: readonly PetArcadeHistory[];
}

export interface PetPlatformRepository {
  loadHub(userId: string): Promise<PetPlatformSnapshot>;
  applyCare(
    userId: string,
    petId: string,
    itemId: string,
    idempotencyKey: string,
  ): Promise<PetCareReceipt>;
  loadArcade(userId: string): Promise<PetArcadeSnapshot>;
}

export interface PetArcadeManifestEntry {
  readonly id: PetArcadeGameId;
  readonly version: "legacy-v1";
  readonly status: "awaiting-product-decision";
  readonly engine: "react-legacy-adapter";
  readonly orientation: "portrait" | "responsive";
  readonly assetFamily: string;
  readonly saveContract: "server-round" | "server-progress" | "server-collection";
  readonly rewardAuthority: "server";
  readonly accessibility: "keyboard-and-touch-review-required";
  readonly performanceBudget: "lazy-load-before-play";
  readonly telemetry: "round-receipt-without-pii";
  readonly offlinePolicy: "no-new-rounds-offline";
  readonly adminContract: "preserve-existing-controls";
}

const COLLECTION_GAMES = new Set<PetArcadeGameId>(["album", "missions"]);
const PROGRESS_GAMES = new Set<PetArcadeGameId>(["egg", "piggybank", "capsule"]);

export const PET_ARCADE_MANIFEST: readonly PetArcadeManifestEntry[] = Object.freeze(
  PET_ARCADE_GAME_IDS.map((id) =>
    Object.freeze({
      id,
      version: "legacy-v1",
      status: "awaiting-product-decision",
      engine: "react-legacy-adapter",
      orientation: id === "flight" || id === "race" ? "responsive" : "portrait",
      assetFamily: `pet-arcade/${id}`,
      saveContract: COLLECTION_GAMES.has(id)
        ? "server-collection"
        : PROGRESS_GAMES.has(id)
          ? "server-progress"
          : "server-round",
      rewardAuthority: "server",
      accessibility: "keyboard-and-touch-review-required",
      performanceBudget: "lazy-load-before-play",
      telemetry: "round-receipt-without-pii",
      offlinePolicy: "no-new-rounds-offline",
      adminContract: "preserve-existing-controls",
    }),
  ),
);

export function isPetCareKind(value: unknown): value is PetCareKind {
  return typeof value === "string" && PET_CARE_KINDS.includes(value as PetCareKind);
}

export function isPetArcadeGameId(value: unknown): value is PetArcadeGameId {
  return typeof value === "string" && PET_ARCADE_GAME_IDS.includes(value as PetArcadeGameId);
}

export function clampPetNeed(value: number): number {
  return Math.max(0, Math.min(100, Math.floor(Number.isFinite(value) ? value : 0)));
}

export function derivePetNeedAtServerTime(
  anchor: PetCareAnchor,
  config: PetCareConfig,
  serverNow: string,
): number {
  const anchorMs = Date.parse(anchor.anchorAt);
  const serverMs = Date.parse(serverNow);
  if (!Number.isFinite(anchorMs) || !Number.isFinite(serverMs) || serverMs <= anchorMs) {
    return clampPetNeed(anchor.valueAtAnchor);
  }
  const elapsedMinutes = (serverMs - anchorMs) / 60_000;
  if (anchor.kind === "energy") {
    const minutesPerPoint = Math.max(1, config.energyRegenMinutesPerPoint);
    return clampPetNeed(anchor.valueAtAnchor + Math.floor(elapsedMinutes / minutesPerPoint));
  }
  return clampPetNeed(anchor.valueAtAnchor - config.decayPerHour * (elapsedMinutes / 60));
}

export function createPetCommandKey(randomUUID: () => string): string {
  const key = randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new Error("secure_pet_command_key_unavailable");
  }
  return key;
}

export function safePetAssetUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
