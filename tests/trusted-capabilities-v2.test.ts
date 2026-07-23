import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  "supabase/migrations/20260723000001_v2_trusted_reward_capabilities.sql",
);
const migration = readFileSync(migrationPath, "utf8");

const genericFunctions = [
  "grant_coin_event(uuid, integer, text)",
  "award_xp(text, integer, integer, jsonb)",
  "track_achievement(uuid, text, integer, text)",
  "progress_mission_action(uuid, text, integer)",
  "create_notification(uuid, text, text, text, text, uuid, uuid)",
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(path)) ? [path] : [];
  });
}

describe("trusted reward migration contract", () => {
  it("fails preflight when any expected legacy signature is absent", () => {
    expect(migration).toContain("to_regprocedure(required_signature)");
    for (const signature of genericFunctions) {
      expect(migration).toContain(`public.${signature}`);
    }
  });

  it("revokes every generic helper from browser roles and grants only service_role", () => {
    for (const signature of genericFunctions) {
      const escaped = signature.replace(/[(),]/g, (token) => `\\${token}`).replace(/\s+/g, "\\s+");
      expect(migration).toMatch(
        new RegExp(
          `REVOKE ALL ON FUNCTION public\\.${escaped}\\s+FROM PUBLIC, anon, authenticated;`,
          "i",
        ),
      );
      expect(migration).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${escaped}\\s+(?:TO\\s+)?service_role`, "i"),
      );
    }
  });

  it("derives care identity, reward, caps and metadata on the trusted side", () => {
    expect(migration).toContain("caller_id uuid := auth.uid()");
    expect(migration).toContain("pet.user_id = caller_id");
    expect(migration).toContain("reward_source := 'care_rescue'");
    expect(migration).toContain("reward_amount := 15");
    expect(migration).toContain("daily_cap := 4");
    expect(migration).toContain("reward_source := 'care_low'");
    expect(migration).toContain("reward_amount := 8");
    expect(migration).toContain("daily_cap := 6");
    expect(migration).toContain("'capability', 'award_my_care_xp'");
  });

  it("makes a care event claim idempotent and keeps its inputs server-owned", () => {
    expect(migration).toContain("UNIQUE (recipient_id, event_kind, event_id)");
    expect(migration).toContain("ON CONFLICT (recipient_id, event_kind, event_id) DO NOTHING");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON TABLE public.pet_care_state");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON TABLE public.pet_care_events");
    expect(migration).not.toMatch(/\b(?:DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM)\b/i);
  });

  it("uses explicit search paths and closes future PUBLIC function defaults", () => {
    expect(migration.match(/SET search_path = pg_catalog, public/g)?.length).toBeGreaterThanOrEqual(
      6,
    );
    expect(migration).toContain(
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC",
    );
  });
});

describe("trusted reward browser boundary", () => {
  it("calls only the narrow care capability from application source", () => {
    const xpSource = readFileSync(resolve("src/lib/xp.ts"), "utf8");
    const careSource = readFileSync(resolve("src/components/pet/PetCareActionSheet.tsx"), "utf8");

    expect(xpSource).toMatch(/supabase\.rpc\(\s*"award_my_care_xp"/);
    expect(xpSource).not.toMatch(/supabase\.rpc\(\s*"award_xp"/);
    expect(careSource).toContain("awardCareXp(userPetId)");
    expect(careSource).not.toContain("XP_SOURCES");
  });

  it("has no direct generic reward/progress RPC call outside generated types", () => {
    const forbidden = [
      '"grant_coin_event"',
      '"award_xp"',
      '"track_achievement"',
      '"progress_mission_action"',
      '"create_notification"',
    ];
    const offenders = sourceFiles(resolve("src"))
      .filter((path) => !path.endsWith(join("integrations", "supabase", "types.ts")))
      .flatMap((path) => {
        const source = readFileSync(path, "utf8");
        return forbidden.some((name) => source.includes(`rpc(${name}`)) ? [path] : [];
      });

    expect(offenders).toEqual([]);
  });
});
