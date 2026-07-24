import { pickPrimaryRole, type AppRole } from "@/lib/roles";

export type IdentityResolutionStatus = "idle" | "resolving" | "ready" | "recoverable-error";

export type AccountStatus =
  | "unauthenticated"
  | "resolving"
  | "unknown"
  | "onboarding-required"
  | "pending-review"
  | "approved"
  | "rejected"
  | "banned"
  | "deactivated"
  | "deletion-pending";

export type TermsConsentStatus = "unknown" | "missing" | "outdated" | "current";

export type DatingAccessState =
  | "inactive"
  | "active"
  | "legacy-active-pending-confirmation"
  | "paused"
  | "committed"
  | "restricted"
  | "unknown";

export type PlatformDomain =
  | "public"
  | "account"
  | "onboarding"
  | "community"
  | "profile"
  | "messaging"
  | "dating"
  | "economy"
  | "pets"
  | "content"
  | "cinema"
  | "admin"
  | "moderation"
  | "support";

export type PlatformCapability =
  | "account:manage"
  | "onboarding:complete"
  | "community:enter"
  | "profile:view"
  | "profile:manage"
  | "messaging:use"
  | "dating:enter"
  | "economy:use"
  | "pets:use"
  | "content:use"
  | "cinema:use"
  | "admin:enter"
  | "moderation:enter"
  | "support:enter";

export interface IdentityProfileRecord {
  readonly status: "pending" | "approved" | "rejected" | "banned";
  readonly deactivatedAt: string | null;
  readonly deletionRequestedAt: string | null;
}

export interface TermsConsentRecord {
  readonly accepted: boolean;
  readonly currentVersion: string | null;
  readonly acceptedVersion: string | null;
  readonly acceptedAt: string | null;
}

export interface IdentityAccessInput {
  readonly authenticated: boolean;
  readonly resolution: IdentityResolutionStatus;
  readonly roles?: readonly AppRole[];
  readonly isSupportAgent?: boolean;
  readonly profile?: IdentityProfileRecord | null;
  readonly terms?: TermsConsentRecord | null;
  /**
   * Must come from an explicit, persisted romantic opt-in. Omitting this value
   * deliberately keeps Dating closed.
   */
  readonly datingState?: DatingAccessState;
}

export interface IdentityAccessSnapshot {
  readonly resolution: IdentityResolutionStatus;
  readonly accountStatus: AccountStatus;
  readonly primaryRole: AppRole;
  readonly capabilities: readonly PlatformCapability[];
  readonly termsStatus: TermsConsentStatus;
  readonly datingState: DatingAccessState;
  readonly isApproved: boolean;
  readonly isRestricted: boolean;
  readonly canEnter: (domain: PlatformDomain) => boolean;
}

const STAFF_ROLES = new Set<AppRole>(["super_admin", "admin", "apresentador", "moderador"]);
const ADMIN_ROLES = new Set<AppRole>(["super_admin", "admin"]);
const MODERATION_ROLES = new Set<AppRole>(["super_admin", "admin", "moderador"]);

const DOMAIN_CAPABILITY: Readonly<Partial<Record<PlatformDomain, PlatformCapability>>> = {
  account: "account:manage",
  onboarding: "onboarding:complete",
  community: "community:enter",
  profile: "profile:view",
  messaging: "messaging:use",
  dating: "dating:enter",
  economy: "economy:use",
  pets: "pets:use",
  content: "content:use",
  cinema: "cinema:use",
  admin: "admin:enter",
  moderation: "moderation:enter",
  support: "support:enter",
};

const HARD_RESTRICTIONS = new Set<AccountStatus>([
  "unknown",
  "rejected",
  "banned",
  "deactivated",
  "deletion-pending",
]);

function resolveAccountStatus(input: IdentityAccessInput): AccountStatus {
  if (!input.authenticated) return "unauthenticated";
  if (input.resolution === "idle" || input.resolution === "resolving") return "resolving";
  if (input.resolution === "recoverable-error" || input.profile === undefined) return "unknown";
  if (input.profile === null) return "onboarding-required";
  if (input.profile.deletionRequestedAt) return "deletion-pending";
  if (input.profile.deactivatedAt) return "deactivated";

  switch (input.profile.status) {
    case "pending":
      return "pending-review";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "banned":
      return "banned";
  }
}

function resolveTermsStatus(input: IdentityAccessInput): TermsConsentStatus {
  if (!input.authenticated || input.resolution !== "ready" || input.terms === undefined) {
    return "unknown";
  }
  if (!input.terms || !input.terms.acceptedVersion) return "missing";
  if (
    input.terms.accepted &&
    input.terms.currentVersion &&
    input.terms.acceptedVersion === input.terms.currentVersion
  ) {
    return "current";
  }
  return "outdated";
}

function buildCapabilities({
  input,
  accountStatus,
  primaryRole,
  isApproved,
  isRestricted,
}: {
  input: IdentityAccessInput;
  accountStatus: AccountStatus;
  primaryRole: AppRole;
  isApproved: boolean;
  isRestricted: boolean;
}): PlatformCapability[] {
  if (!input.authenticated) return [];

  const capabilities = new Set<PlatformCapability>(["account:manage"]);
  const mayEditIdentity =
    input.resolution === "ready" &&
    !["unknown", "banned", "deactivated", "deletion-pending"].includes(accountStatus);
  const isOperationallyActive = !isRestricted && accountStatus !== "resolving";

  if (mayEditIdentity) {
    capabilities.add("onboarding:complete");
    capabilities.add("profile:view");
    capabilities.add("profile:manage");
  }

  if (isApproved && isOperationallyActive) {
    capabilities.add("community:enter");
    capabilities.add("messaging:use");
    capabilities.add("economy:use");
    capabilities.add("pets:use");
    capabilities.add("content:use");
    capabilities.add("cinema:use");
    if (
      input.datingState === "active" ||
      input.datingState === "legacy-active-pending-confirmation"
    ) {
      capabilities.add("dating:enter");
    }
  }

  if (ADMIN_ROLES.has(primaryRole) && isOperationallyActive) {
    capabilities.add("admin:enter");
  }
  if (MODERATION_ROLES.has(primaryRole) && isOperationallyActive) {
    capabilities.add("moderation:enter");
  }
  if ((input.isSupportAgent || STAFF_ROLES.has(primaryRole)) && isOperationallyActive) {
    capabilities.add("support:enter");
  }

  return [...capabilities].sort();
}

export function resolveIdentityAccess(input: IdentityAccessInput): IdentityAccessSnapshot {
  const roles = [...new Set(input.roles ?? [])];
  const primaryRole = pickPrimaryRole(roles);
  const accountStatus = resolveAccountStatus(input);
  const isStaff = STAFF_ROLES.has(primaryRole);
  const isApproved = accountStatus === "approved" || isStaff;
  const isRestricted = HARD_RESTRICTIONS.has(accountStatus);
  const datingState = input.datingState ?? "inactive";
  const capabilities = Object.freeze(
    buildCapabilities({ input, accountStatus, primaryRole, isApproved, isRestricted }),
  );
  const capabilitySet = new Set(capabilities);

  return Object.freeze({
    resolution: input.resolution,
    accountStatus,
    primaryRole,
    capabilities,
    termsStatus: resolveTermsStatus(input),
    datingState,
    isApproved,
    isRestricted,
    canEnter(domain: PlatformDomain) {
      if (domain === "public") return true;
      const capability = DOMAIN_CAPABILITY[domain];
      return capability ? capabilitySet.has(capability) : false;
    },
  });
}

export function createUnauthenticatedIdentity(): IdentityAccessSnapshot {
  return resolveIdentityAccess({
    authenticated: false,
    resolution: "idle",
    datingState: "inactive",
  });
}

export function createResolvingIdentity(): IdentityAccessSnapshot {
  return resolveIdentityAccess({
    authenticated: true,
    resolution: "resolving",
    datingState: "inactive",
  });
}
