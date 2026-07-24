import { describe, expect, it } from "vitest";
import {
  DATING_ELIGIBILITY_RULE,
  isDatingModeState,
  isDatingReportReason,
  parseDatingCursor,
  safeDatingMediaUrl,
} from "../src/v2/features/dating/contracts";
import { parseDatingDiscovery, parseDatingMembership } from "../src/v2/features/dating/repository";

describe("V2-014 optional dating contracts", () => {
  it("models every canonical mode without equating community access to dating", () => {
    expect(
      ["inactive", "active", "paused", "legacy-confirmation", "committed", "restricted"].every(
        isDatingModeState,
      ),
    ).toBe(true);
    expect(isDatingModeState("community")).toBe(false);
  });

  it("maps legacy membership values without inventing consent", () => {
    expect(parseDatingMembership({ status: "legacy_active_pending_confirmation" })).toEqual({
      state: "legacy-confirmation",
      receiveAnonymous: false,
    });
    expect(parseDatingMembership({ status: "paused_by_commitment" }).state).toBe("committed");
    expect(parseDatingMembership({ status: "unknown" }).state).toBe("inactive");
  });

  it("keeps the ratified legacy eligibility rule explicit and versioned", () => {
    expect(DATING_ELIGIBILITY_RULE.id).toBe("legacy-opposite-sex-v1");
    expect(DATING_ELIGIBILITY_RULE.bilateralPreferenceChangeRequiresProductDecision).toBe(true);
  });

  it("accepts only complete stable pagination cursors", () => {
    const cursor = {
      unseenPriority: 1,
      sameStatePriority: 0,
      createdAt: "2026-07-23T12:00:00.000Z",
      id: "12345678-abcd-4321-abcd-123456789abc",
    };
    expect(parseDatingCursor(cursor)).toEqual(cursor);
    expect(parseDatingCursor({ ...cursor, createdAt: "invalid" })).toBeNull();
    expect(parseDatingCursor({ ...cursor, unseenPriority: 2 })).toBeNull();
  });

  it("parses untrusted discovery rows and drops malformed candidates", () => {
    const page = parseDatingDiscovery({
      items: [
        {
          id: "candidate-1",
          display_name: "Ana",
          age: 28,
          city: "Recife",
          state: "PE",
          church: "Igreja local",
          photo_url: "https://cdn.example/photo.jpg",
          explanation: "mesmo_estado_e_recente",
          interest_state: "received",
        },
        { id: "", display_name: "", age: 12 },
      ],
      hasMore: true,
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      displayName: "Ana",
      explanation: "mesmo_estado_e_recente",
      interestState: "received",
    });
    expect(page.eligibilityRule).toBe("legacy-opposite-sex-v1");
  });

  it("allows only relative or HTTPS romantic media", () => {
    expect(safeDatingMediaUrl("/profile-photos/a.jpg")).toBe("/profile-photos/a.jpg");
    expect(safeDatingMediaUrl("https://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg");
    expect(safeDatingMediaUrl("javascript:alert(1)")).toBeNull();
    expect(safeDatingMediaUrl("//attacker.example/a.jpg")).toBeNull();
  });

  it("uses a closed report-reason allowlist", () => {
    expect(isDatingReportReason("harassment")).toBe(true);
    expect(isDatingReportReason("custom SQL")).toBe(false);
  });
});
