import type { FeatureFlagEnvironment, V2FeatureFlags } from "@/v2/platform/feature-flags";

export const LEGACY_RETIREMENT_FLAG_ENV = Object.freeze({
  datingIndex: "VITE_FF_V2_RETIRE_LEGACY_DATING_INDEX",
  datingParity: "VITE_FF_V2_LEGACY_DATING_PARITY_CONFIRMED",
  datingTelemetry: "VITE_FF_V2_LEGACY_DATING_TELEMETRY_CONFIRMED",
  datingData: "VITE_FF_V2_LEGACY_DATING_DATA_RECONCILED",
  characterAvatar: "VITE_FF_V2_QUARANTINE_CHARACTER_AVATAR",
  characterAvatarParity: "VITE_FF_V2_CHARACTER_AVATAR_PARITY_CONFIRMED",
  characterAvatarInventory: "VITE_FF_V2_CHARACTER_AVATAR_INVENTORY_CONFIRMED",
  characterAvatarTelemetry: "VITE_FF_V2_CHARACTER_AVATAR_TELEMETRY_CONFIRMED",
  characterAvatarCompensation: "VITE_FF_V2_CHARACTER_AVATAR_COMPENSATION_APPROVED",
} as const);

export type LegacyRetirementRequirement =
  | "app-shell"
  | "replacement"
  | "parity"
  | "telemetry"
  | "data-reconciled"
  | "inventory"
  | "compensation";

export interface LegacyRetirementAssessment {
  readonly surface: "dating-index" | "character-avatar";
  readonly ready: boolean;
  readonly missing: readonly LegacyRetirementRequirement[];
  readonly rollbackRoute: string;
  readonly protectedData: readonly string[];
}

export interface LegacyRetirementState {
  readonly datingIndexRetired: boolean;
  readonly characterAvatarQuarantined: boolean;
  readonly dating: LegacyRetirementAssessment;
  readonly characterAvatar: LegacyRetirementAssessment;
}

function exactTrue(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

export function resolveLegacyRetirementState(
  environment: FeatureFlagEnvironment,
  featureFlags: Pick<V2FeatureFlags, "appShell" | "dating" | "profile" | "customization">,
): LegacyRetirementState {
  const datingChecks: Readonly<Record<LegacyRetirementRequirement, boolean>> = {
    "app-shell": featureFlags.appShell,
    replacement: featureFlags.dating,
    parity: exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.datingParity]),
    telemetry: exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.datingTelemetry]),
    "data-reconciled": exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.datingData]),
    inventory: true,
    compensation: true,
  };
  const avatarChecks: Readonly<Record<LegacyRetirementRequirement, boolean>> = {
    "app-shell": featureFlags.appShell,
    replacement: featureFlags.profile && featureFlags.customization,
    parity: exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.characterAvatarParity]),
    telemetry: exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.characterAvatarTelemetry]),
    "data-reconciled": true,
    inventory: exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.characterAvatarInventory]),
    compensation: exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.characterAvatarCompensation]),
  };
  const missingDating = (Object.entries(datingChecks) as [LegacyRetirementRequirement, boolean][])
    .filter(([, met]) => !met)
    .map(([requirement]) => requirement);
  const missingAvatar = (Object.entries(avatarChecks) as [LegacyRetirementRequirement, boolean][])
    .filter(([, met]) => !met)
    .map(([requirement]) => requirement);
  const datingReady =
    exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.datingIndex]) && missingDating.length === 0;
  const avatarReady =
    exactTrue(environment[LEGACY_RETIREMENT_FLAG_ENV.characterAvatar]) &&
    missingAvatar.length === 0;

  return Object.freeze({
    datingIndexRetired: datingReady,
    characterAvatarQuarantined: avatarReady,
    dating: Object.freeze({
      surface: "dating-index",
      ready: datingReady,
      missing: Object.freeze(missingDating),
      rollbackRoute: "/pretendentes",
      protectedData: Object.freeze([
        "interests",
        "matches",
        "messages",
        "dating_memberships",
        "dating_preferences",
        "anonymous_messages",
        "couple_commitments",
      ]),
    }),
    characterAvatar: Object.freeze({
      surface: "character-avatar",
      ready: avatarReady,
      missing: Object.freeze(missingAvatar),
      rollbackRoute: "/avatar",
      protectedData: Object.freeze([
        "user_avatar_base",
        "user_avatar_inventory",
        "user_avatar_equipped",
        "user_avatar_looks",
        "avatar_items",
        "avatar-items",
        "avatar-looks",
      ]),
    }),
  });
}

export type LegacyRouteDisposition =
  | { readonly kind: "legacy"; readonly destination: null }
  | { readonly kind: "redirect"; readonly destination: "/v2/pretendentes" }
  | { readonly kind: "quarantine"; readonly destination: "/v2/perfil" };

export function resolveLegacyRouteDisposition(
  pathname: string,
  state: LegacyRetirementState,
): LegacyRouteDisposition {
  if ((pathname === "/pretendentes" || pathname === "/pretendentes/") && state.datingIndexRetired) {
    return { kind: "redirect", destination: "/v2/pretendentes" };
  }
  if (
    state.characterAvatarQuarantined &&
    (pathname === "/avatar" || pathname.startsWith("/avatar/") || pathname === "/admin/avatar")
  ) {
    return { kind: "quarantine", destination: "/v2/perfil" };
  }
  return { kind: "legacy", destination: null };
}

export const LEGACY_RETIREMENT_INVARIANTS = Object.freeze({
  physicalDeletionAllowed: false,
  schemaContractionAllowed: false,
  assetDeletionAllowed: false,
  ownershipDeletionAllowed: false,
  historicalDataPreserved: true,
  rollbackRequired: true,
});
