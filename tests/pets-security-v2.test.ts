import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveIdentityAccess } from "../src/v2/platform/identity";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase", "migrations", "20260723000012_v2_pets_care_authority.sql"),
  "utf8",
);
const runtime = readFileSync(
  join(root, "src", "v2", "integration", "V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const registry = readFileSync(join(root, "src", "v2", "integration", "route-registry.ts"), "utf8");

describe("V2-017 pet authority and preservation", () => {
  it("preflights every preserved pet and arcade authority", () => {
    expect(migration).toContain("public.apply_pet_care(uuid,uuid)");
    expect(migration).toContain("public.pet_runtime_modifiers(uuid)");
    expect(migration).toContain("public.get_pet_arcade_catalog()");
    expect(migration).toContain("public.get_pet_arcade_history_v2(integer)");
    expect(migration).toContain("public.get_pet_arcade_usage_today()");
  });

  it("performs no contraction or cross-table pet consolidation", () => {
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bTRUNCATE\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
    expect(migration).toContain("'user_pets_count'");
    expect(migration).toContain("'user_pets_v2_count'");
    expect(migration).not.toMatch(
      /INSERT\s+INTO\s+public\.user_pets_v2[\s\S]*FROM\s+public\.user_pets\b/i,
    );
  });

  it("serializes and replays care commands without duplicating effects", () => {
    expect(migration).toContain("UNIQUE (actor_id, idempotency_key)");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("idempotency_key_reused");
    expect(migration).toContain("IF _command.completed_at IS NOT NULL");
    expect(migration).toContain("RETURN _command.result");
    expect(migration).toContain("public.apply_pet_care(_user_pet_id, _item_id)");
  });

  it("keeps ownership, compatible items, limits, economy and rewards inside preserved RPCs", () => {
    expect(migration).toContain("pet.id = _user_pet_id AND pet.user_id = _uid");
    expect(migration).toContain("item.id = _item_id AND item.active");
    expect(migration).not.toMatch(/_cost_coins|_restore_amount|_reward_coins|_xp_reward/);
    expect(migration).toContain("apply_pet_care_v2");
  });

  it("mounts pets only through the exact flag and a dedicated platform capability", () => {
    expect(runtime).toContain('v2FeatureFlags.pets && route?.slug === "meu-pet"');
    expect(runtime).toContain("<V2PetsFeature");
    expect(registry).toMatch(/slug: "meu-pet"[\s\S]*requiredDomain: "pets"/);
    const identity = resolveIdentityAccess({
      authenticated: true,
      resolution: "ready",
      profile: { status: "approved", deactivatedAt: null, deletionRequestedAt: null },
      terms: null,
    });
    expect(identity.capabilities).toContain("pets:use");
    expect(identity.canEnter("pets")).toBe(true);
  });

  it("does not reuse or make the legacy pet creation workflow a V2 dependency", () => {
    expect(runtime).not.toContain("createMyPetV2");
    expect(migration).not.toContain("create_my_pet_v2");
  });

  it("does not create a client-side game result, reward, odds or admin bypass", () => {
    const petsSource = [
      readFileSync(join(root, "src", "v2", "features", "pets", "contracts.ts"), "utf8"),
      readFileSync(join(root, "src", "v2", "features", "pets", "V2ArcadeCatalog.tsx"), "utf8"),
    ].join("\n");
    expect(petsSource).not.toMatch(/Math\.random|rewardCoins\s*=|service_role/);
    expect(petsSource).toContain('rewardAuthority: "server"');
    expect(petsSource).toContain('status: "awaiting-product-decision"');
  });
});
