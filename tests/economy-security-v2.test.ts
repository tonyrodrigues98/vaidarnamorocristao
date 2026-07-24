import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase", "migrations", "20260723000011_v2_economy_authority.sql"),
  "utf8",
);
const runtime = readFileSync(
  join(root, "src", "v2", "integration", "V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const registry = readFileSync(join(root, "src", "v2", "integration", "route-registry.ts"), "utf8");

describe("V2-016 server-authoritative economy", () => {
  it("preflights preserved atomic commands and performs no destructive contraction", () => {
    expect(migration).toContain("V2 economy preflight failed");
    expect(migration).toContain("public.purchase_decoration(uuid)");
    expect(migration).toContain("public.purchase_profile_background(uuid)");
    expect(migration).toContain("public.purchase_name_gradient(uuid)");
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bTRUNCATE\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
  });

  it("serializes commands and rejects idempotency-key reuse with altered intent", () => {
    expect(migration).toContain("UNIQUE (actor_id, idempotency_key)");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("idempotency_key_reused");
    expect(migration).toContain("IF _command.completed_at IS NOT NULL");
    expect(migration).toContain("RETURN _command.result");
  });

  it("keeps prices, debit, ownership and delivery inside the server transaction", () => {
    const purchase = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.purchase_economy_item_v2"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.set_equipped_economy_item_v2"),
    );
    expect(purchase).not.toMatch(/_price\b/);
    expect(purchase).toContain("item.active");
    expect(purchase).toContain("public.purchase_decoration(_item_id)");
    expect(purchase).toContain("public.purchase_profile_background(_item_id)");
    expect(purchase).toContain("public.purchase_name_gradient(_item_id)");
    expect(purchase).toContain("completed_at = now()");
  });

  it("validates ownership, active catalog state and the exact equipment slot", () => {
    const equipment = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.set_equipped_economy_item_v2"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.admin_adjust_economy_v2"),
    );
    expect(equipment).toContain("economy_item_not_owned_or_inactive");
    expect(equipment).toContain("item.type::text = _item_kind");
    expect(equipment).toContain("public.equip_decoration(_item_id)");
    expect(equipment).toContain("public.unequip_decoration");
    expect(equipment).toContain("_command.item_id IS DISTINCT FROM _item_id");
  });

  it("bounds and audits administrator adjustments without trusting a frontend role", () => {
    const admin = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.admin_adjust_economy_v2"),
      migration.indexOf("REVOKE ALL ON FUNCTION public.get_economy_hub_v2"),
    );
    expect(admin).toContain("public.has_role(_uid, 'admin')");
    expect(admin).toContain("public.has_role(_uid, 'super_admin')");
    expect(admin).toContain("abs(_amount) > 10000");
    expect(admin).toContain("'support_compensation'");
    expect(admin).toContain("public.admin_grant_coins");
    expect(admin).not.toMatch(/metadata\s+jsonb|_metadata/);
  });

  it("preserves separate inventory families and reports semantic reconciliation", () => {
    expect(migration).toContain("public.user_decorations");
    expect(migration).toContain("public.user_profile_backgrounds");
    expect(migration).toContain("public.user_name_gradients");
    expect(migration).toContain("public.user_avatar_inventory");
    expect(migration).toContain("public.user_pet_backgrounds");
    expect(migration).toContain("invalid_equipped_count");
    expect(migration).toContain("'investigation-required'");
  });

  it("keeps chance-based boxes disabled behind a server-owned gate", () => {
    expect(migration).toContain("'chance_based_boxes'");
    expect(migration).toContain("'legal-review-required-v1'");
    expect(migration).toMatch(/'chance_based_boxes',\s*false,/);
    expect(migration).not.toContain("open_economy_box_v2");
  });

  it("mounts the hub only through the canonical economy capability and flag", () => {
    expect(runtime).toContain('v2FeatureFlags.economy && route?.slug === "loja"');
    expect(runtime).toContain("<V2EconomyFeature");
    expect(registry).toMatch(/slug: "loja"[\s\S]*requiredDomain: "economy"/);
    expect(runtime).not.toContain("service_role");
  });
});
