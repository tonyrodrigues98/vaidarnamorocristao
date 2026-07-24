import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMMUNITY_ONBOARDING_STEPS,
  COMMUNITY_ONBOARDING_VERSION,
  EMPTY_COMMUNITY_ONBOARDING_ANSWERS,
  getAgeFromBirthDate,
  nextCommunityOnboardingStep,
  previousCommunityOnboardingStep,
  validateCommunityOnboardingStep,
} from "../src/v2/features/onboarding/contracts";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const migration = read(
  "supabase/migrations/20260723000004_v2_community_onboarding_dating_opt_in.sql",
);
const component = read("src/v2/features/onboarding/CommunityOnboardingFlow.tsx");

describe("V2-009C community-first onboarding", () => {
  it("contains only community profile steps and keeps romantic questions out", () => {
    expect(COMMUNITY_ONBOARDING_VERSION).toBe("community_onboarding_v1");
    expect(COMMUNITY_ONBOARDING_STEPS).toEqual([
      "identity",
      "birth",
      "photo",
      "location",
      "introduction",
      "faith",
      "privacy",
    ]);
    expect(COMMUNITY_ONBOARDING_STEPS.join(" ")).not.toMatch(
      /sex|marital|height|seeking|dating|namoro/i,
    );
  });

  it("validates adulthood deterministically and rejects malformed dates", () => {
    const today = new Date("2026-07-23T12:00:00.000Z");
    expect(getAgeFromBirthDate("2008-07-23", today)).toBe(18);
    expect(getAgeFromBirthDate("2008-07-24", today)).toBe(17);
    expect(getAgeFromBirthDate("2026-02-31", today)).toBeNull();
    expect(
      validateCommunityOnboardingStep(
        "birth",
        { ...EMPTY_COMMUNITY_ONBOARDING_ANSWERS, birthDate: "2008-07-23" },
        today,
      ),
    ).toBeNull();
  });

  it("has stable forward and backward resume semantics", () => {
    expect(nextCommunityOnboardingStep("identity")).toBe("birth");
    expect(previousCommunityOnboardingStep("identity")).toBe("identity");
    expect(nextCommunityOnboardingStep("privacy")).toBe("privacy");
    expect(previousCommunityOnboardingStep("privacy")).toBe("faith");
  });

  it("expands the legacy profile contract and stores owner-only versioned progress", () => {
    expect(migration).toContain("ALTER COLUMN sex DROP NOT NULL");
    expect(migration).toContain("ALTER COLUMN marital DROP NOT NULL");
    expect(migration).toContain("community_onboarding_progress");
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).toContain("questionnaire_version text NOT NULL");
    expect(migration).toContain("community_onboarding_completed_at");
  });

  it("completes the community profile without activating Dating", () => {
    const start = migration.indexOf(
      "CREATE OR REPLACE FUNCTION public.complete_community_onboarding",
    );
    const end = migration.indexOf("CREATE OR REPLACE FUNCTION public.activate_dating_membership");
    const completionFunction = migration.slice(start, end);
    expect(completionFunction).toContain("'pending'::public.profile_status");
    expect(completionFunction).toContain("community_onboarding_progress");
    expect(completionFunction).not.toContain("INSERT INTO public.dating_memberships");
    expect(completionFunction).not.toContain("anonymous_message_settings");
  });

  it("keeps UI presentation independent from Supabase and auth implementation", () => {
    expect(component).not.toMatch(/integrations\/supabase|useAuth|access_token|refresh_token/i);
    expect(component).toContain("Namoro e recados anônimos permanecem desligados.");
    expect(component).toContain("repository.saveProgress");
    expect(component).toContain("repository.completeCommunityOnboarding");
  });
});
