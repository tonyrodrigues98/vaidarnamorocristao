import { describe, expect, it } from "vitest";
import {
  LEGACY_RETIREMENT_FLAG_ENV,
  LEGACY_RETIREMENT_INVARIANTS,
  resolveLegacyRetirementState,
} from "../src/v2/platform/legacy-retirement/contracts";
import type { V2FeatureFlags } from "../src/v2/platform/feature-flags";

const allFeatures: V2FeatureFlags = Object.freeze({
  appShell: true,
  community: true,
  dating: true,
  messaging: true,
  profile: true,
  economy: true,
  customization: true,
  pets: true,
  content: true,
  admin: true,
  cinema: true,
  trust: true,
});

const retirementEnvironment = Object.freeze(
  Object.fromEntries(Object.values(LEGACY_RETIREMENT_FLAG_ENV).map((name) => [name, "true"])),
);

describe("V2 logical legacy retirement", () => {
  it("fails closed when no retirement evidence is supplied", () => {
    const state = resolveLegacyRetirementState({}, allFeatures);

    expect(state.datingIndexRetired).toBe(false);
    expect(state.characterAvatarQuarantined).toBe(false);
    expect(state.dating.missing).toEqual(["parity", "telemetry", "data-reconciled"]);
    expect(state.characterAvatar.missing).toEqual([
      "parity",
      "telemetry",
      "inventory",
      "compensation",
    ]);
  });

  it("requires the replacement feature and app shell independently", () => {
    const state = resolveLegacyRetirementState(retirementEnvironment, {
      ...allFeatures,
      appShell: false,
      dating: false,
      profile: false,
    });

    expect(state.datingIndexRetired).toBe(false);
    expect(state.dating.missing).toEqual(["app-shell", "replacement"]);
    expect(state.characterAvatarQuarantined).toBe(false);
    expect(state.characterAvatar.missing).toContain("app-shell");
    expect(state.characterAvatar.missing).toContain("replacement");
  });

  it("does not accept truthy-looking strings as evidence", () => {
    const environment = { ...retirementEnvironment, [LEGACY_RETIREMENT_FLAG_ENV.datingData]: "1" };
    const state = resolveLegacyRetirementState(environment, allFeatures);

    expect(state.datingIndexRetired).toBe(false);
    expect(state.dating.missing).toEqual(["data-reconciled"]);
  });

  it("retires only when every explicit check and master gate pass", () => {
    const state = resolveLegacyRetirementState(retirementEnvironment, allFeatures);

    expect(state.datingIndexRetired).toBe(true);
    expect(state.characterAvatarQuarantined).toBe(true);
    expect(state.dating.missing).toEqual([]);
    expect(state.characterAvatar.missing).toEqual([]);
  });

  it("rolls back immediately when either master gate is disabled", () => {
    const environment = {
      ...retirementEnvironment,
      [LEGACY_RETIREMENT_FLAG_ENV.datingIndex]: "false",
      [LEGACY_RETIREMENT_FLAG_ENV.characterAvatar]: undefined,
    };
    const state = resolveLegacyRetirementState(environment, allFeatures);

    expect(state.datingIndexRetired).toBe(false);
    expect(state.characterAvatarQuarantined).toBe(false);
  });

  it("protects relationship, ownership and historical data from contraction", () => {
    const state = resolveLegacyRetirementState(retirementEnvironment, allFeatures);

    expect(state.dating.protectedData).toEqual(
      expect.arrayContaining(["interests", "matches", "messages", "couple_commitments"]),
    );
    expect(state.characterAvatar.protectedData).toEqual(
      expect.arrayContaining(["user_avatar_inventory", "user_avatar_equipped", "avatar_items"]),
    );
    expect(LEGACY_RETIREMENT_INVARIANTS).toMatchObject({
      physicalDeletionAllowed: false,
      schemaContractionAllowed: false,
      assetDeletionAllowed: false,
      ownershipDeletionAllowed: false,
      historicalDataPreserved: true,
      rollbackRequired: true,
    });
  });
});
