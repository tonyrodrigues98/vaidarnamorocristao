import { describe, expect, it } from "vitest";
import {
  resolveLegacyRetirementState,
  resolveLegacyRouteDisposition,
} from "../src/v2/platform/legacy-retirement/contracts";
import type { V2FeatureFlags } from "../src/v2/platform/feature-flags";

const enabledFeatures: V2FeatureFlags = {
  appShell: true,
  community: false,
  dating: true,
  messaging: false,
  profile: true,
  economy: false,
  customization: true,
  pets: false,
  content: false,
  admin: false,
  cinema: false,
  trust: false,
};

const enabledEvidence = {
  VITE_FF_V2_RETIRE_LEGACY_DATING_INDEX: "true",
  VITE_FF_V2_LEGACY_DATING_PARITY_CONFIRMED: "true",
  VITE_FF_V2_LEGACY_DATING_TELEMETRY_CONFIRMED: "true",
  VITE_FF_V2_LEGACY_DATING_DATA_RECONCILED: "true",
  VITE_FF_V2_QUARANTINE_CHARACTER_AVATAR: "true",
  VITE_FF_V2_CHARACTER_AVATAR_PARITY_CONFIRMED: "true",
  VITE_FF_V2_CHARACTER_AVATAR_INVENTORY_CONFIRMED: "true",
  VITE_FF_V2_CHARACTER_AVATAR_TELEMETRY_CONFIRMED: "true",
  VITE_FF_V2_CHARACTER_AVATAR_COMPENSATION_APPROVED: "true",
};

describe("V2 legacy route compatibility", () => {
  const enabled = resolveLegacyRetirementState(enabledEvidence, enabledFeatures);
  const disabled = resolveLegacyRetirementState({}, enabledFeatures);

  it("keeps every legacy route when readiness is incomplete", () => {
    for (const pathname of ["/pretendentes", "/pretendentes/abc", "/avatar", "/avatar/criar"]) {
      expect(resolveLegacyRouteDisposition(pathname, disabled)).toEqual({
        kind: "legacy",
        destination: null,
      });
    }
  });

  it("redirects only the old dating index after parity", () => {
    expect(resolveLegacyRouteDisposition("/pretendentes", enabled)).toEqual({
      kind: "redirect",
      destination: "/v2/pretendentes",
    });
    expect(resolveLegacyRouteDisposition("/pretendentes/", enabled)).toEqual({
      kind: "redirect",
      destination: "/v2/pretendentes",
    });
    expect(resolveLegacyRouteDisposition("/pretendentes/abc", enabled)).toEqual({
      kind: "legacy",
      destination: null,
    });
  });

  it("quarantines character creation, editing and administration together", () => {
    for (const pathname of ["/avatar", "/avatar/criar", "/avatar/looks", "/admin/avatar"]) {
      expect(resolveLegacyRouteDisposition(pathname, enabled)).toEqual({
        kind: "quarantine",
        destination: "/v2/perfil",
      });
    }
  });

  it("does not confuse a profile photo field with the retired character", () => {
    for (const pathname of ["/perfil", "/v2/perfil", "/admin/fotos", "/avatar_url"]) {
      expect(resolveLegacyRouteDisposition(pathname, enabled)).toEqual({
        kind: "legacy",
        destination: null,
      });
    }
  });
});
