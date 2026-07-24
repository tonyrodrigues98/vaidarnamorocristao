import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DATING_ONBOARDING_VERSION,
  EMPTY_DATING_OPT_IN_ANSWERS,
  validateDatingOptIn,
} from "../src/v2/features/onboarding/contracts";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const migration = read(
  "supabase/migrations/20260723000004_v2_community_onboarding_dating_opt_in.sql",
);
const auth = read("src/lib/auth.tsx");
const component = read("src/v2/features/onboarding/DatingOptInFlow.tsx");
const route = read("src/routes/onboarding/namoro.tsx");

describe("V2-009C explicit Dating opt-in", () => {
  it("starts inactive, unconfirmed and with anonymous notes disabled", () => {
    expect(DATING_ONBOARDING_VERSION).toBe("dating_membership_v2");
    expect(EMPTY_DATING_OPT_IN_ANSWERS.explicitConsent).toBe(false);
    expect(EMPTY_DATING_OPT_IN_ANSWERS.receiveAnonymous).toBe(false);
    expect(validateDatingOptIn(EMPTY_DATING_OPT_IN_ANSWERS)).toContain(
      "A ativação do Namoro precisa de confirmação explícita.",
    );
  });

  it("accepts only a complete explicit romantic enrollment", () => {
    const errors = validateDatingOptIn({
      ...EMPTY_DATING_OPT_IN_ANSWERS,
      sex: "feminino",
      marital: "solteiro",
      explicitConsent: true,
    });
    expect(errors).toEqual([]);
    expect(
      validateDatingOptIn({
        ...EMPTY_DATING_OPT_IN_ANSWERS,
        sex: "masculino",
        marital: "solteiro",
        explicitConsent: true,
        locationScope: "personalizado",
      }),
    ).toContain("Escolha ao menos um estado.");
  });

  it("makes the database RPC authoritative and preserves community data on pause/deactivation", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.activate_dating_membership");
    expect(migration).toContain("approved_community_profile_required");
    expect(migration).toContain("dating_paused_by_commitment");
    expect(migration).toContain("dating_membership_restricted");
    expect(migration).toContain("coalesce(_receive_anonymous, false)");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.pause_dating_membership");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.deactivate_dating_membership");
    const deactivation = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.deactivate_dating_membership"),
      migration.indexOf("REVOKE ALL ON FUNCTION public.activate_dating_membership"),
    );
    expect(deactivation).toContain("accept_anonymous = false");
    expect(deactivation).not.toMatch(/DELETE FROM public\.(profiles|profile_preferences|matches)/);
  });

  it("exposes membership as owner-read and mutation only through authenticated RPCs", () => {
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON TABLE public.dating_memberships");
    expect(migration).toContain("GRANT SELECT ON TABLE public.dating_memberships TO authenticated");
    expect(migration).toContain("USING (auth.uid() = user_id)");
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.activate_dating_membership[\s\S]*TO authenticated/,
    );
  });

  it("stages eligible legacy users in batches without silently treating new users as active", () => {
    expect(migration).toContain("stage_legacy_dating_memberships");
    expect(migration).toContain("_legacy_cutover_at timestamptz");
    expect(migration).toContain("'legacy_active_pending_confirmation'");
    expect(migration).toContain("'paused_by_commitment'");
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.stage_legacy_dating_memberships[\s\S]*FROM PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.stage_legacy_dating_memberships[\s\S]*TO service_role/,
    );
    expect(migration).not.toMatch(/SELECT\s+public\.stage_legacy_dating_memberships/i);
  });

  it("loads romantic state only behind the exact Dating feature flag and fails closed", () => {
    expect(auth).toContain("v2FeatureFlags.dating");
    expect(auth).toContain('.from("dating_memberships")');
    expect(auth).toContain("rolesResult.error || profileResult.error || datingResult.error");
    expect(auth).toContain('"legacy-active-pending-confirmation"');
    expect(auth).toContain('"committed"');
    expect(auth).toContain('return "inactive"');
    expect(auth).not.toMatch(/VITE_.*SERVICE_ROLE|VITE_.*SECRET/);
  });

  it("keeps cancellation write-free and the route separate from community onboarding", () => {
    expect(component).toContain("onClick={onClose}");
    expect(component).not.toMatch(/supabase|useAuth|fetch\s*\(/i);
    expect(component).toContain("repository.activate");
    expect(component).toContain("repository.pause");
    expect(component).toContain("repository.deactivate");
    expect(route).toContain('createFileRoute("/onboarding/namoro")');
    expect(route).toContain("v2FeatureFlags.dating");
    expect(route).toContain('profileStatus !== "approved"');
  });
});
