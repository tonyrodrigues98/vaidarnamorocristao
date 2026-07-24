import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase", "migrations", "20260723000009_v2_optional_dating_mode.sql"),
  "utf8",
);
const runtime = readFileSync(
  join(root, "src", "v2", "integration", "V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const registry = readFileSync(join(root, "src", "v2", "integration", "route-registry.ts"), "utf8");

describe("V2-014 server-authoritative dating boundaries", () => {
  it("requires active memberships for both discovery participants", () => {
    expect(migration).toMatch(/viewer_membership\.status = 'active'/);
    expect(migration).toMatch(/candidate_membership\.status = 'active'/);
  });

  it("preserves the legacy sex rule under an explicit version", () => {
    expect(migration).toContain("viewer.sex <> candidate.sex");
    expect(migration).toContain("legacy-opposite-sex-v1");
    expect(migration).toContain("explicit product decision");
  });

  it("applies bilateral blocks, commitment and hidden-staff exclusion", () => {
    expect(migration).toContain("v2_community_users_blocked(_viewer_id, _candidate_id)");
    expect(migration).toContain("relationship_commitments");
    expect(migration).toContain("get_hidden_staff_ids()");
  });

  it("serializes reciprocal interest and keeps matches canonical", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("ON CONFLICT (sender_id, receiver_id) DO NOTHING");
    expect(migration).toContain("ON CONFLICT (user_a, user_b) DO NOTHING");
    expect(migration).toContain("least(_uid, _target_user_id)");
    expect(migration).toContain("greatest(_uid, _target_user_id)");
  });

  it("rate-limits mutating interest and report entry points", () => {
    expect(migration).toContain("dating_interest_rate_limited");
    expect(migration).toContain("dating_report_rate_limited");
  });

  it("does not delete or overwrite romantic history", () => {
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
    expect(migration).not.toMatch(/\bTRUNCATE\b/i);
  });

  it("exposes only authenticated RPC entry points and keeps the helper private", () => {
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.v2_dating_users_eligible\(uuid, uuid\)[\s\S]*authenticated;/,
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_dating_discovery_v2[\s\S]*TO authenticated, service_role;/,
    );
    expect(migration).not.toMatch(/GRANT EXECUTE[\s\S]{0,160}\bTO anon\b/);
  });

  it("integrates only through the canonical feature flag, identity and auth provider", () => {
    expect(runtime).toContain("v2FeatureFlags.dating");
    expect(runtime).toContain('route?.slug === "pretendentes"');
    expect(runtime).toContain("refreshRole");
    expect(runtime).not.toMatch(/const\s*\{[^}]*\bsession\b[^}]*\}\s*=\s*useAuth/);
    expect(runtime).not.toMatch(/\bsession\s*=\s*\{/);
    expect(runtime).not.toContain("supabase");
  });

  it("keeps the route capability-scoped instead of universally visible", () => {
    expect(registry).toMatch(/slug: "pretendentes"[\s\S]*requiredDomain: "dating"/);
    expect(registry).not.toContain("VITE_FF_V2_DATING");
  });
});
