import { describe, expect, it } from "vitest";
import {
  createEconomyCommandKey,
  safeEconomyAssetUrl,
  safeEconomyColor,
  safeEconomyCssValue,
} from "../src/v2/features/economy/contracts";
import { parseEconomyReceipt, parseEconomySnapshot } from "../src/v2/features/economy/repository";

describe("V2-016 economy contracts", () => {
  it("parses separate catalog and inventory projections without inventing ownership", () => {
    const snapshot = parseEconomySnapshot({
      balance: 320,
      xp_total: 740,
      level: 5,
      catalog: [
        {
          id: "item-1",
          kind: "frame",
          name: "Esperança",
          price: 40,
          rarity: "rare",
          active: true,
          owned: false,
        },
        { id: "", kind: "unknown", name: "Inválido" },
      ],
      inventory: [
        {
          id: "item-2",
          kind: "background",
          name: "Alvorada",
          active: false,
          owned: true,
          equipped: true,
          quantity: 1,
          origin: "legacy",
        },
      ],
      preserved_families: { badges: 2, gifts_received: 3, avatar_legacy_items: 4 },
      reconciliation: { status: "investigation-required", invalid_equipped_count: 1 },
    });

    expect(snapshot.catalog).toHaveLength(1);
    expect(snapshot.catalog[0]).toMatchObject({ owned: false, kind: "frame", price: 40 });
    expect(snapshot.inventory[0]).toMatchObject({
      owned: true,
      active: false,
      origin: "legacy",
    });
    expect(snapshot.reconciliation.status).toBe("investigation-required");
    expect(snapshot.preservedFamilies).toMatchObject({
      badges: 2,
      giftsReceived: 3,
      avatarLegacyItems: 4,
    });
  });

  it("parses receipts without accepting arbitrary actions or identifiers", () => {
    expect(
      parseEconomyReceipt({
        receipt_id: "receipt-1",
        action: "equip",
        item_kind: "aura",
        item_id: "item-1",
        completed_at: "2026-07-23T12:00:00Z",
      }),
    ).toEqual({
      receiptId: "receipt-1",
      action: "equip",
      itemKind: "aura",
      itemId: "item-1",
      balanceAfter: null,
      completedAt: "2026-07-23T12:00:00Z",
    });
    expect(parseEconomyReceipt({ action: "execute-sql" }).action).toBe("purchase");
    expect(parseEconomyReceipt({ item_kind: "role" }).itemKind).toBeNull();
  });

  it("requires a cryptographically shaped command key", () => {
    expect(createEconomyCommandKey(() => "123e4567-e89b-42d3-a456-426614174000")).toBe(
      "123e4567-e89b-42d3-a456-426614174000",
    );
    expect(() => createEconomyCommandKey(() => "predictable")).toThrow(
      "secure_command_key_unavailable",
    );
  });

  it("accepts only safe preview assets, colors and inert CSS values", () => {
    expect(safeEconomyAssetUrl("/storage/frame.png")).toBe("/storage/frame.png");
    expect(safeEconomyAssetUrl("https://cdn.example/frame.png")).toBe(
      "https://cdn.example/frame.png",
    );
    expect(safeEconomyAssetUrl("javascript:alert(1)")).toBeNull();
    expect(safeEconomyAssetUrl("//attacker.example/frame.png")).toBeNull();
    expect(safeEconomyColor("#7c3aed")).toBe("#7c3aed");
    expect(safeEconomyColor("red")).toBeNull();
    expect(safeEconomyCssValue("0 0 12px #7c3aed")).toBe("0 0 12px #7c3aed");
    expect(safeEconomyCssValue("url(https://attacker.example)")).toBeNull();
    expect(safeEconomyCssValue("linear-gradient(red, blue); color: red")).toBeNull();
  });

  it("fails closed for malformed reconciliation and negative projections", () => {
    const snapshot = parseEconomySnapshot({
      balance: -90,
      xp_total: -1,
      level: 0,
      reconciliation: { status: "forged", invalid_equipped_count: -2 },
    });
    expect(snapshot.balance).toBe(0);
    expect(snapshot.xpTotal).toBe(0);
    expect(snapshot.level).toBe(1);
    expect(snapshot.reconciliation).toMatchObject({
      status: "baseline-unverified",
      invalidEquippedCount: 0,
    });
  });
});
