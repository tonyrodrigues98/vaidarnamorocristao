import { describe, expect, it } from "vitest";
import type { AppRole } from "../src/lib/roles";
import {
  createResolvingIdentity,
  createUnauthenticatedIdentity,
  resolveIdentityAccess,
  type IdentityAccessInput,
  type IdentityProfileRecord,
} from "../src/v2/platform/identity";
import { getV2RuntimeNavigation } from "../src/v2/integration/route-registry";

const approvedProfile: IdentityProfileRecord = {
  status: "approved",
  deactivatedAt: null,
  deletionRequestedAt: null,
};

function identity(overrides: Partial<IdentityAccessInput> = {}) {
  return resolveIdentityAccess({
    authenticated: true,
    resolution: "ready",
    roles: ["user"],
    profile: approvedProfile,
    terms: {
      accepted: true,
      acceptedAt: "2026-05-03T10:00:00.000Z",
      acceptedVersion: "2026-05-03",
      currentVersion: "2026-05-03",
    },
    ...overrides,
  });
}

describe("V2-009 canonical identity and capabilities", () => {
  it("keeps public access open and every private capability closed without a session", () => {
    const snapshot = createUnauthenticatedIdentity();
    expect(snapshot.accountStatus).toBe("unauthenticated");
    expect(snapshot.capabilities).toEqual([]);
    expect(snapshot.canEnter("public")).toBe(true);
    expect(snapshot.canEnter("account")).toBe(false);
    expect(snapshot.canEnter("community")).toBe(false);
    expect(snapshot.canEnter("dating")).toBe(false);
    expect(snapshot.canEnter("admin")).toBe(false);
  });

  it("does not grant capabilities while identity facts are resolving", () => {
    const snapshot = createResolvingIdentity();
    expect(snapshot.accountStatus).toBe("resolving");
    expect(snapshot.resolution).toBe("resolving");
    expect(snapshot.capabilities).toEqual(["account:manage"]);
    expect(snapshot.canEnter("community")).toBe(false);
    expect(snapshot.canEnter("dating")).toBe(false);
  });

  it.each([
    ["missing profile", null, "onboarding-required", true, false],
    [
      "pending profile",
      { ...approvedProfile, status: "pending" as const },
      "pending-review",
      true,
      false,
    ],
    ["approved profile", approvedProfile, "approved", true, true],
    [
      "rejected profile",
      { ...approvedProfile, status: "rejected" as const },
      "rejected",
      true,
      false,
    ],
    ["banned profile", { ...approvedProfile, status: "banned" as const }, "banned", false, false],
  ] as const)(
    "classifies %s without treating authentication as approval",
    (_label, profile, accountStatus, canOnboard, canEnterCommunity) => {
      const snapshot = identity({ profile });
      expect(snapshot.accountStatus).toBe(accountStatus);
      expect(snapshot.canEnter("onboarding")).toBe(canOnboard);
      expect(snapshot.canEnter("community")).toBe(canEnterCommunity);
    },
  );

  it("gives account lifecycle restrictions precedence over profile approval", () => {
    const deactivated = identity({
      profile: { ...approvedProfile, deactivatedAt: "2026-07-23T10:00:00.000Z" },
    });
    const deletionPending = identity({
      profile: {
        ...approvedProfile,
        deactivatedAt: "2026-07-23T10:00:00.000Z",
        deletionRequestedAt: "2026-07-24T10:00:00.000Z",
      },
    });

    expect(deactivated.accountStatus).toBe("deactivated");
    expect(deactivated.isRestricted).toBe(true);
    expect(deactivated.canEnter("community")).toBe(false);
    expect(deletionPending.accountStatus).toBe("deletion-pending");
    expect(deletionPending.canEnter("account")).toBe(true);
    expect(deletionPending.canEnter("profile")).toBe(false);
  });

  it("fails closed when role or profile facts cannot be resolved", () => {
    const snapshot = identity({ resolution: "recoverable-error", profile: undefined });
    expect(snapshot.accountStatus).toBe("unknown");
    expect(snapshot.isRestricted).toBe(true);
    expect(snapshot.canEnter("community")).toBe(false);
    expect(snapshot.canEnter("admin")).toBe(false);
  });

  it.each([
    [["user"], "user"],
    [["moderador", "user"], "moderador"],
    [["admin", "moderador"], "admin"],
    [["super_admin", "admin"], "super_admin"],
  ] as const)("selects the canonical primary role for %j", (roles, expected) => {
    expect(identity({ roles: roles as readonly AppRole[] }).primaryRole).toBe(expected);
  });

  it("keeps administrative authorization separate from authentication", () => {
    expect(identity().canEnter("admin")).toBe(false);
    expect(identity({ roles: ["admin"] }).canEnter("admin")).toBe(true);
    expect(identity({ roles: ["moderador"] }).canEnter("admin")).toBe(false);
    expect(identity({ roles: ["moderador"] }).canEnter("moderation")).toBe(true);
  });

  it("preserves the staff approval compatibility rule without bypassing restrictions", () => {
    const staffPending = identity({
      roles: ["apresentador"],
      profile: { ...approvedProfile, status: "pending" },
    });
    const staffBanned = identity({
      roles: ["admin"],
      profile: { ...approvedProfile, status: "banned" },
    });

    expect(staffPending.isApproved).toBe(true);
    expect(staffPending.canEnter("community")).toBe(true);
    expect(staffBanned.isApproved).toBe(true);
    expect(staffBanned.isRestricted).toBe(true);
    expect(staffBanned.canEnter("community")).toBe(false);
    expect(staffBanned.canEnter("admin")).toBe(false);
  });

  it("never enables Dating by inference or by approval alone", () => {
    expect(identity().datingState).toBe("inactive");
    expect(identity().canEnter("dating")).toBe(false);
    expect(identity({ datingState: "unknown" }).canEnter("dating")).toBe(false);
    expect(identity({ datingState: "paused" }).canEnter("dating")).toBe(false);
    expect(identity({ datingState: "committed" }).canEnter("dating")).toBe(false);
    expect(identity({ datingState: "legacy-active-pending-confirmation" }).canEnter("dating")).toBe(
      true,
    );
    expect(identity({ datingState: "active" }).canEnter("dating")).toBe(true);
    expect(
      identity({
        datingState: "active",
        profile: { ...approvedProfile, status: "rejected" },
      }).canEnter("dating"),
    ).toBe(false);
  });

  it("reports terms independently from account approval", () => {
    expect(identity().termsStatus).toBe("current");
    expect(identity({ terms: null }).termsStatus).toBe("missing");
    expect(
      identity({
        terms: {
          accepted: false,
          acceptedAt: null,
          acceptedVersion: "2025-01-01",
          currentVersion: "2026-05-03",
        },
      }).termsStatus,
    ).toBe("outdated");
    expect(identity({ terms: undefined }).termsStatus).toBe("unknown");
    expect(identity({ terms: undefined }).canEnter("community")).toBe(true);
  });

  it("removes romantic navigation unless the explicit capability is present", () => {
    const inactive = identity();
    const active = identity({ datingState: "active" });
    const inactiveNavigation = getV2RuntimeNavigation(inactive.canEnter);
    const activeNavigation = getV2RuntimeNavigation(active.canEnter);

    expect(inactiveNavigation.secondary.map((item) => item.id)).not.toContain("dating");
    expect(activeNavigation.secondary.map((item) => item.id)).toContain("dating");
    expect(inactiveNavigation.secondary.map((item) => item.id)).toContain("settings");
  });

  it("returns immutable, serializable facts without session or personal identifiers", () => {
    const snapshot = identity({ roles: ["admin", "user"], datingState: "active" });
    const serialized = JSON.stringify(snapshot);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.capabilities)).toBe(true);
    expect(snapshot.capabilities.every(Boolean)).toBe(true);
    expect(serialized).not.toMatch(/access_token|refresh_token|email|phone|user[_-]?id/i);
  });
});
