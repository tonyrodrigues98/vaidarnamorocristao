export const ECONOMY_ITEM_KINDS = [
  "frame",
  "aura",
  "sticker",
  "background",
  "name-gradient",
] as const;

export type EconomyItemKind = (typeof ECONOMY_ITEM_KINDS)[number];
export type EconomyRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type EconomyReconciliationStatus =
  | "consistent"
  | "baseline-unverified"
  | "investigation-required";

export interface EconomyItem {
  readonly id: string;
  readonly kind: EconomyItemKind;
  readonly name: string;
  readonly description: string;
  readonly assetUrl: string | null;
  readonly cssValue: string | null;
  readonly colorA: string | null;
  readonly colorB: string | null;
  readonly price: number;
  readonly rarity: EconomyRarity;
  readonly active: boolean;
  readonly owned: boolean;
  readonly equipped: boolean;
  readonly quantity: number;
  readonly origin: string | null;
  readonly acquiredAt: string | null;
}

export interface EconomyLedgerEntry {
  readonly id: string;
  readonly amount: number;
  readonly balanceAfter: number;
  readonly direction: string;
  readonly kind: string;
  readonly title: string;
  readonly subtitle: string;
  readonly createdAt: string;
}

export interface EconomyReceipt {
  readonly receiptId: string;
  readonly action: "purchase" | "equip" | "unequip" | "admin-adjust";
  readonly itemKind: EconomyItemKind | "coins" | null;
  readonly itemId: string | null;
  readonly balanceAfter: number | null;
  readonly completedAt: string;
}

export interface EconomyReconciliation {
  readonly status: EconomyReconciliationStatus;
  readonly latestLedgerBalance: number | null;
  readonly balanceDelta: number | null;
  readonly invalidEquippedCount: number;
}

export interface EconomyRiskGate {
  readonly feature: string;
  readonly enabled: boolean;
  readonly rulesVersion: string;
  readonly reason: string;
}

export interface PreservedInventoryFamilies {
  readonly badges: number;
  readonly giftsReceived: number;
  readonly avatarLegacyItems: number;
  readonly petBackgrounds: number;
  readonly petAlbumStickers: number;
}

export interface EconomySnapshot {
  readonly balance: number;
  readonly xpTotal: number;
  readonly level: number;
  readonly catalog: readonly EconomyItem[];
  readonly inventory: readonly EconomyItem[];
  readonly ledger: readonly EconomyLedgerEntry[];
  readonly receipts: readonly EconomyReceipt[];
  readonly reconciliation: EconomyReconciliation;
  readonly preservedFamilies: PreservedInventoryFamilies;
  readonly riskGates: readonly EconomyRiskGate[];
}

export interface EconomyRepository {
  loadHub(userId: string): Promise<EconomySnapshot>;
  purchase(
    userId: string,
    item: Pick<EconomyItem, "id" | "kind">,
    idempotencyKey: string,
  ): Promise<EconomyReceipt>;
  setEquipped(
    userId: string,
    itemKind: EconomyItemKind,
    itemId: string | null,
    idempotencyKey: string,
  ): Promise<EconomyReceipt>;
}

export function isEconomyItemKind(value: unknown): value is EconomyItemKind {
  return typeof value === "string" && ECONOMY_ITEM_KINDS.includes(value as EconomyItemKind);
}

export function createEconomyCommandKey(randomUUID: () => string): string {
  const generated = randomUUID();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(generated)
  ) {
    throw new Error("secure_command_key_unavailable");
  }
  return generated;
}

export function safeEconomyAssetUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function safeEconomyColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^#[0-9a-f]{3,8}$/i.test(normalized) ? normalized : null;
}

export function safeEconomyCssValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 240 ||
    /url\s*\(|expression\s*\(|javascript:|@import|[{};]/i.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

export function formatCoinAmount(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}
