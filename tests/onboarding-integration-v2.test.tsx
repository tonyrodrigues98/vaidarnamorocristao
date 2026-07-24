import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CommunityOnboardingFlow, DatingOptInFlow } from "../src/v2/features/onboarding";
import type {
  CommunityOnboardingRepository,
  DatingOptInRepository,
} from "../src/v2/features/onboarding/contracts";

function communityRepository(): CommunityOnboardingRepository {
  return {
    loadProgress: vi.fn(async () => null),
    saveProgress: vi.fn(async () => {}),
    verifyAndUploadPhoto: vi.fn(async () => ({
      url: "https://example.test/photo.jpg",
      needsReview: false,
      aiVerified: true,
      confidence: 1,
    })),
    completeCommunityOnboarding: vi.fn(async () => ({ profileStatus: "pending" })),
  };
}

function datingRepository(): DatingOptInRepository {
  return {
    loadMembership: vi.fn(async () => ({ status: "inactive", receiveAnonymous: false })),
    activate: vi.fn(async () => ({ status: "active", receiveAnonymous: false })),
    pause: vi.fn(async () => ({ status: "paused", receiveAnonymous: false })),
    deactivate: vi.fn(async () => ({ status: "inactive", receiveAnonymous: false })),
  };
}

describe("V2-009C onboarding integration boundaries", () => {
  it("imports and renders the community flow SSR-safe without starting data calls", () => {
    const repository = communityRepository();
    const markup = renderToStaticMarkup(
      <CommunityOnboardingFlow userId="user-a" repository={repository} onComplete={() => {}} />,
    );
    expect(markup).toContain("Restaurando seu cadastro");
    expect(repository.loadProgress).not.toHaveBeenCalled();
    expect(markup).not.toMatch(/access_token|refresh_token|service_role/i);
  });

  it("imports and renders the Dating flow SSR-safe without activating anything", () => {
    const repository = datingRepository();
    const markup = renderToStaticMarkup(
      <DatingOptInFlow userId="user-a" repository={repository} onClose={() => {}} />,
    );
    expect(markup).toContain("Carregando modo Namoro");
    expect(repository.loadMembership).not.toHaveBeenCalled();
    expect(repository.activate).not.toHaveBeenCalled();
  });

  it("keeps the UI adapter contracts free of sessions and tokens", () => {
    const communityKeys = Object.keys(communityRepository());
    const datingKeys = Object.keys(datingRepository());
    expect(communityKeys).toEqual([
      "loadProgress",
      "saveProgress",
      "verifyAndUploadPhoto",
      "completeCommunityOnboarding",
    ]);
    expect(datingKeys).toEqual(["loadMembership", "activate", "pause", "deactivate"]);
    expect([...communityKeys, ...datingKeys].join(" ")).not.toMatch(/session|token|supabase/i);
  });
});
