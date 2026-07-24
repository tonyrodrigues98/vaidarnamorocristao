import { describe, expect, it } from "vitest";
import {
  PET_ARCADE_GAME_IDS,
  PET_ARCADE_MANIFEST,
  clampPetNeed,
  createPetCommandKey,
  derivePetNeedAtServerTime,
  safePetAssetUrl,
} from "../src/v2/features/pets/contracts";
import {
  parsePetArcadeSnapshot,
  parsePetCareReceipt,
  parsePetPlatformSnapshot,
} from "../src/v2/features/pets/repository";

describe("V2-017 pets and arcade contracts", () => {
  it("derives decay from the supplied server clock and clamps long offline periods", () => {
    const anchor = {
      kind: "feed",
      valueAtAnchor: 80,
      anchorAt: "2026-07-20T10:00:00.000Z",
    };
    const config = { decayPerHour: 2, energyRegenMinutesPerPoint: 6 };
    expect(derivePetNeedAtServerTime(anchor, config, "2026-07-20T15:00:00.000Z")).toBe(70);
    expect(derivePetNeedAtServerTime(anchor, config, "2026-07-30T15:00:00.000Z")).toBe(0);
  });

  it("regenerates energy deterministically without consulting the client clock", () => {
    expect(
      derivePetNeedAtServerTime(
        { kind: "energy", valueAtAnchor: 20, anchorAt: "2026-07-20T10:00:00Z" },
        { decayPerHour: 2, energyRegenMinutesPerPoint: 6 },
        "2026-07-20T11:00:00Z",
      ),
    ).toBe(30);
    expect(clampPetNeed(Number.NaN)).toBe(0);
    expect(clampPetNeed(140)).toBe(100);
  });

  it("does not let an invalid or older server time alter the anchor", () => {
    const anchor = {
      kind: "hygiene",
      valueAtAnchor: 72,
      anchorAt: "2026-07-20T10:00:00Z",
    };
    const config = { decayPerHour: 2, energyRegenMinutesPerPoint: 6 };
    expect(derivePetNeedAtServerTime(anchor, config, "invalid")).toBe(72);
    expect(derivePetNeedAtServerTime(anchor, config, "2026-07-20T09:00:00Z")).toBe(72);
  });

  it("preserves V1 and V2 pet families as independent projections", () => {
    const snapshot = parsePetPlatformSnapshot({
      server_now: "2026-07-23T12:00:00Z",
      pet: null,
      preserved_families: {
        user_pets_count: 2,
        user_pets_equipped_count: 1,
        user_pets_v2_count: 3,
        user_pets_v2_equipped_count: 1,
      },
    });
    expect(snapshot.preservedFamilies).toEqual({
      userPetsCount: 2,
      userPetsEquippedCount: 1,
      userPetsV2Count: 3,
      userPetsV2EquippedCount: 1,
    });
    expect(snapshot.pet).toBeNull();
  });

  it("parses only compatible care kinds and safe media", () => {
    const snapshot = parsePetPlatformSnapshot({
      server_now: "2026-07-23T12:00:00Z",
      care_items: [
        {
          id: "item-1",
          kind: "feed",
          name: "Ração",
          image_url: "/pet/food.png",
          restore_amount: 20,
        },
        { id: "item-2", kind: "execute-sql", name: "Inválido" },
      ],
    });
    expect(snapshot.careItems).toHaveLength(1);
    expect(snapshot.careItems[0]).toMatchObject({
      kind: "feed",
      imageUrl: "/pet/food.png",
      restoreAmount: 20,
    });
    expect(safePetAssetUrl("javascript:alert(1)")).toBeNull();
    expect(safePetAssetUrl("//attacker.example/pet.png")).toBeNull();
  });

  it("requires cryptographically shaped idempotency keys", () => {
    expect(createPetCommandKey(() => "123e4567-e89b-42d3-a456-426614174000")).toBe(
      "123e4567-e89b-42d3-a456-426614174000",
    );
    expect(() => createPetCommandKey(() => "predictable")).toThrow(
      "secure_pet_command_key_unavailable",
    );
  });

  it("catalogs every legacy game without a removal decision", () => {
    expect(PET_ARCADE_GAME_IDS).toHaveLength(17);
    expect(PET_ARCADE_MANIFEST.map((entry) => entry.id)).toEqual(PET_ARCADE_GAME_IDS);
    expect(
      PET_ARCADE_MANIFEST.every(
        (entry) =>
          entry.status === "awaiting-product-decision" &&
          entry.rewardAuthority === "server" &&
          entry.offlinePolicy === "no-new-rounds-offline",
      ),
    ).toBe(true);
  });

  it("parses server catalog, history and usage without inventing games", () => {
    const snapshot = parsePetArcadeSnapshot(
      {
        settings: { is_enabled: true, healthy_play_message: "Jogue com equilíbrio." },
        games: [
          {
            game_type: "memory",
            display_name: "Memória",
            is_enabled: true,
            daily_play_limit: 4,
          },
          { game_type: "unknown", display_name: "Inexistente" },
        ],
      },
      [{ id: "round-1", game_type: "memory", status: "collected", reward_coins: 4 }],
      { total_used: 2 },
    );
    expect(snapshot.games).toHaveLength(1);
    expect(snapshot.history).toHaveLength(1);
    expect(snapshot.usageToday).toBe(2);
  });

  it("sanitizes care receipts to the stable public contract", () => {
    expect(
      parsePetCareReceipt({
        receipt_id: "receipt-1",
        user_pet_id: "pet-1",
        item_id: "item-1",
        completed_at: "2026-07-23T12:00:00Z",
        internal_state: { secret: true },
      }),
    ).toEqual({
      receiptId: "receipt-1",
      userPetId: "pet-1",
      itemId: "item-1",
      completedAt: "2026-07-23T12:00:00Z",
    });
  });
});
