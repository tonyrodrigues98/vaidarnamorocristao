import { supabase } from "@/integrations/supabase/client";
import {
  isEconomyItemKind,
  safeEconomyAssetUrl,
  safeEconomyColor,
  safeEconomyCssValue,
  type EconomyItem,
  type EconomyLedgerEntry,
  type EconomyReceipt,
  type EconomyRepository,
  type EconomyRiskGate,
  type EconomySnapshot,
} from "./contracts";

type JsonRecord = Record<string, unknown>;
const SAFE_ERROR = "Não foi possível sincronizar a economia agora.";

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nonNegativeInteger(value: unknown) {
  return Math.max(0, Math.trunc(finiteNumber(value)));
}

function parseRarity(value: unknown): EconomyItem["rarity"] {
  return value === "uncommon" || value === "rare" || value === "epic" || value === "legendary"
    ? value
    : "common";
}

function parseItem(value: unknown): EconomyItem | null {
  if (!isRecord(value) || !isEconomyItemKind(value.kind)) return null;
  const id = text(value.id);
  const name = text(value.name);
  if (!id || !name) return null;
  return {
    id,
    kind: value.kind,
    name,
    description: text(value.description),
    assetUrl: safeEconomyAssetUrl(value.asset_url),
    cssValue: safeEconomyCssValue(value.css_value),
    colorA: safeEconomyColor(value.color_a),
    colorB: safeEconomyColor(value.color_b),
    price: nonNegativeInteger(value.price),
    rarity: parseRarity(value.rarity),
    active: value.active === true,
    owned: value.owned === true,
    equipped: value.equipped === true,
    quantity: Math.max(1, nonNegativeInteger(value.quantity)),
    origin: nullableText(value.origin),
    acquiredAt: nullableText(value.acquired_at),
  };
}

function parseLedger(value: unknown): EconomyLedgerEntry | null {
  if (!isRecord(value)) return null;
  const id = text(value.id);
  if (!id) return null;
  return {
    id,
    amount: finiteNumber(value.amount),
    balanceAfter: finiteNumber(value.balance_after),
    direction: text(value.direction, "unknown"),
    kind: text(value.kind, "unknown"),
    title: text(value.title, "Movimentação"),
    subtitle: text(value.subtitle),
    createdAt: text(value.created_at),
  };
}

export function parseEconomyReceipt(value: unknown): EconomyReceipt {
  const row = isRecord(value) ? value : {};
  const action =
    row.action === "equip" || row.action === "unequip" || row.action === "admin-adjust"
      ? row.action
      : "purchase";
  return {
    receiptId: text(row.receipt_id),
    action,
    itemKind: isEconomyItemKind(row.item_kind)
      ? row.item_kind
      : row.item_kind === "coins"
        ? "coins"
        : null,
    itemId: nullableText(row.item_id),
    balanceAfter:
      typeof row.balance_after === "number" && Number.isFinite(row.balance_after)
        ? row.balance_after
        : null,
    completedAt: text(row.completed_at),
  };
}

function parseGate(value: unknown): EconomyRiskGate | null {
  if (!isRecord(value) || typeof value.feature !== "string") return null;
  return {
    feature: value.feature,
    enabled: value.enabled === true,
    rulesVersion: text(value.rules_version),
    reason: text(value.reason),
  };
}

export function parseEconomySnapshot(value: unknown): EconomySnapshot {
  const row = isRecord(value) ? value : {};
  const reconciliation = isRecord(row.reconciliation) ? row.reconciliation : {};
  const preserved = isRecord(row.preserved_families) ? row.preserved_families : {};
  const status =
    reconciliation.status === "consistent" || reconciliation.status === "investigation-required"
      ? reconciliation.status
      : "baseline-unverified";

  return {
    balance: nonNegativeInteger(row.balance),
    xpTotal: nonNegativeInteger(row.xp_total),
    level: Math.max(1, nonNegativeInteger(row.level)),
    catalog: Array.isArray(row.catalog)
      ? row.catalog.map(parseItem).filter((item): item is EconomyItem => item !== null)
      : [],
    inventory: Array.isArray(row.inventory)
      ? row.inventory.map(parseItem).filter((item): item is EconomyItem => item !== null)
      : [],
    ledger: Array.isArray(row.ledger)
      ? row.ledger.map(parseLedger).filter((item): item is EconomyLedgerEntry => item !== null)
      : [],
    receipts: Array.isArray(row.receipts) ? row.receipts.map(parseEconomyReceipt) : [],
    reconciliation: {
      status,
      latestLedgerBalance:
        typeof reconciliation.latest_ledger_balance === "number"
          ? reconciliation.latest_ledger_balance
          : null,
      balanceDelta:
        typeof reconciliation.balance_delta === "number" ? reconciliation.balance_delta : null,
      invalidEquippedCount: nonNegativeInteger(reconciliation.invalid_equipped_count),
    },
    preservedFamilies: {
      badges: nonNegativeInteger(preserved.badges),
      giftsReceived: nonNegativeInteger(preserved.gifts_received),
      avatarLegacyItems: nonNegativeInteger(preserved.avatar_legacy_items),
      petBackgrounds: nonNegativeInteger(preserved.pet_backgrounds),
      petAlbumStickers: nonNegativeInteger(preserved.pet_album_stickers),
    },
    riskGates: Array.isArray(row.risk_gates)
      ? row.risk_gates.map(parseGate).filter((gate): gate is EconomyRiskGate => gate !== null)
      : [],
  };
}

async function rpc<T>(name: string, args?: JsonRecord): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(SAFE_ERROR);
  return data as T;
}

export const supabaseEconomyRepository: EconomyRepository = {
  async loadHub(_userId) {
    return parseEconomySnapshot(await rpc("get_economy_hub_v2"));
  },
  async purchase(_userId, item, idempotencyKey) {
    return parseEconomyReceipt(
      await rpc("purchase_economy_item_v2", {
        _item_kind: item.kind,
        _item_id: item.id,
        _idempotency_key: idempotencyKey,
      }),
    );
  },
  async setEquipped(_userId, itemKind, itemId, idempotencyKey) {
    return parseEconomyReceipt(
      await rpc("set_equipped_economy_item_v2", {
        _item_kind: itemKind,
        _item_id: itemId,
        _idempotency_key: idempotencyKey,
      }),
    );
  },
};

export const economyRepositoryBoundaries = Object.freeze({
  serverOwnsPriceAndBalanceMutation: true,
  commandsRequireIdempotency: true,
  presentationReceivesSession: false,
  catalogsRemainSeparate: true,
  chanceBasedBoxesDefaultEnabled: false,
});
