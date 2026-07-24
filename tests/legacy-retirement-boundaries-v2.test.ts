import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEGACY_RETIREMENT_TELEMETRY_BOUNDARIES,
  createLegacyRetirementEvent,
  emitLegacyRetirementEvent,
} from "../src/v2/platform/legacy-retirement";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("V2 logical retirement boundaries", () => {
  it("keeps the runtime import SSR-safe and telemetry local", () => {
    const telemetry = read("src/v2/platform/legacy-retirement/telemetry.ts");
    const event = createLegacyRetirementEvent(
      {
        name: "legacy-route-redirected",
        surface: "dating-index",
        routeFamily: "dating",
      },
      123,
    );

    expect(() => emitLegacyRetirementEvent(event)).not.toThrow();
    expect(event).toEqual({
      name: "legacy-route-redirected",
      surface: "dating-index",
      routeFamily: "dating",
      occurredAt: 123,
    });
    expect(telemetry).not.toMatch(/\b(fetch|supabase|axios|email|userId|profileId)\s*\(/);
    expect(LEGACY_RETIREMENT_TELEMETRY_BOUNDARIES.networkSinkConfigured).toBe(false);
  });

  it("keeps physical deletion and migration operations outside the module", () => {
    const files = [
      "src/v2/platform/legacy-retirement/contracts.ts",
      "src/v2/platform/legacy-retirement/runtime.ts",
      "src/v2/platform/legacy-retirement/telemetry.ts",
    ];
    const source = files.map(read).join("\n");

    expect(source).not.toMatch(/\b(drop|delete from|truncate|alter table|storage\.remove)\b/i);
    expect(source).not.toContain("service_role");
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("keeps the legacy pages present behind reversible wrappers", () => {
    const dating = read("src/routes/pretendentes/index.tsx");
    const avatar = read("src/routes/avatar.tsx");
    const creator = read("src/routes/avatar.criar.tsx");
    const admin = read("src/routes/admin/avatar.tsx");

    expect(dating).toContain("function LegacyPretendentesList()");
    expect(dating).toContain("legacyRetirementState.datingIndexRetired");
    expect(avatar).toContain("function LegacyAvatarPage()");
    expect(creator).toContain("function LegacyAvatarCreatePage()");
    expect(admin).toContain("function LegacyAdminAvatarPage()");
  });

  it("removes the dating index from universal navigation only through the same gate", () => {
    const mobile = read("src/components/mobile/MobileBottomNav.tsx");
    const header = read("src/components/layout/Header.tsx");

    expect(mobile).toContain("shouldShowLegacyDatingNavigation()");
    expect(mobile).toContain('item.to !== "/pretendentes"');
    expect(header).toContain("showLegacyDatingNavigation &&");
    expect(header).toContain('to="/pretendentes"');
  });

  it("records no item as safe for physical removal", () => {
    const readiness = JSON.parse(
      read("docs/reestruturacao-v2/audit/legacy-retirement-readiness.json"),
    ) as {
      physicalDeletionAllowed: boolean;
      safeForPhysicalRemoval: unknown[];
      surfaces: Array<{ ready: boolean; blockers: string[] }>;
    };

    expect(readiness.physicalDeletionAllowed).toBe(false);
    expect(readiness.safeForPhysicalRemoval).toEqual([]);
    expect(readiness.surfaces.every((surface) => !surface.ready)).toBe(true);
    expect(readiness.surfaces.flatMap((surface) => surface.blockers)).toContain(
      "compensation decision pending Antonio",
    );
  });
});
