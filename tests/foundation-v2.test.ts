import { describe, expect, it } from "vitest";
import { normalizeBuildCommit } from "../src/v2/app/build-info";
import { V2_DESIGN_FOUNDATION } from "../src/v2/design-system/foundation";
import { v2DomainRegistry } from "../src/v2/domains/registry";
import { LEGACY_PRESERVATION_INVARIANTS } from "../src/v2/legacy/preservation";

describe("Community Platform V2 foundation", () => {
  it("keeps community and dating as independent domains", () => {
    const domainIds = v2DomainRegistry.map((domain) => domain.id);
    const community = v2DomainRegistry.find((domain) => domain.id === "community");
    const dating = v2DomainRegistry.find((domain) => domain.id === "dating");

    expect(new Set(domainIds).size).toBe(domainIds.length);
    expect(community?.mayDependOn).not.toContain("dating");
    expect(dating?.mayDependOn).not.toContain("community");
  });

  it("declares preservation invariants before legacy adapters are introduced", () => {
    expect(LEGACY_PRESERVATION_INVARIANTS).toContain("auth-users-and-sessions");
    expect(LEGACY_PRESERVATION_INVARIANTS).toContain("interests-matches-messages-and-purpose");
    expect(LEGACY_PRESERVATION_INVARIANTS).toContain("vault-secrets-cron-and-push-job");
  });

  it("sets the mobile and accessibility baseline without changing the legacy theme", () => {
    expect(V2_DESIGN_FOUNDATION.fontFamily).toBe("Poppins");
    expect(V2_DESIGN_FOUNDATION.mobileInputMinFontSizePx).toBeGreaterThanOrEqual(16);
    expect(V2_DESIGN_FOUNDATION.minimumTouchTargetPx).toBeGreaterThanOrEqual(44);
    expect(V2_DESIGN_FOUNDATION.respectsReducedMotion).toBe(true);
    expect(V2_DESIGN_FOUNDATION.respectsSafeAreas).toBe(true);
  });

  it("normalizes only valid source commit identifiers", () => {
    expect(normalizeBuildCommit("0DE09E755FF19BDCBA80EED37484CCE6EA1B4A4F")).toBe(
      "0de09e755ff19bdcba80eed37484cce6ea1b4a4f",
    );
    expect(normalizeBuildCommit("not-a-commit")).toBe("unknown");
    expect(normalizeBuildCommit(undefined)).toBe("unknown");
  });
});
