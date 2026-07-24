import { describe, expect, it } from "vitest";
import {
  ADMIN_MODULES,
  adminModulesForRole,
  adminSafetyContract,
} from "../src/v2/features/admin/contracts";

describe("V2-021 Admin module contracts", () => {
  it("organizes the console into the required domains", () => {
    expect(ADMIN_MODULES.map((module) => module.id)).toEqual([
      "overview",
      "users",
      "verification",
      "moderation",
      "community",
      "dating",
      "conversations",
      "content",
      "economy",
      "catalogs",
      "pets",
      "games",
      "cinema",
      "notifications",
      "support",
      "team",
      "audit",
    ]);
  });

  it("uses a conservative role matrix", () => {
    expect(adminModulesForRole("user")).toEqual([]);
    expect(adminModulesForRole("moderador").map((module) => module.id)).not.toContain("economy");
    expect(adminModulesForRole("apresentador").map((module) => module.id)).not.toContain("team");
    expect(adminModulesForRole("admin").map((module) => module.id)).not.toContain("team");
    expect(adminModulesForRole("super_admin").map((module) => module.id)).toContain("team");
  });

  it("declares a capability and preserved destination for every module", () => {
    for (const module of ADMIN_MODULES) {
      expect(module.capability).toMatch(/^[a-z][a-z.-]+$/);
      expect(module.legacyDestination).toMatch(/^\//);
      expect(module.allowedRoles).not.toContain("user");
    }
  });

  it("keeps domain rules and private metrics out of presentation", () => {
    expect(adminSafetyContract).toEqual({
      clientGrantsCapabilities: false,
      clientCalculatesBalance: false,
      clientChangesMatch: false,
      clientChangesPurpose: false,
      clientGrantsReward: false,
      sensitiveActionsRequireReason: true,
      sensitiveActionsRequireRequestId: true,
      auditStoresPrivateContent: false,
      vanityMetricsAllowed: false,
    });
  });
});
