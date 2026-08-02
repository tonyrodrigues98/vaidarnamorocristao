import type { DestinationBehavior } from "@/config/app-destinations";

export const NATIVE_SHELL_FEATURE_ENV = "VITE_FF_NATIVE_SHELL";

export type NativeShellFeatureEnvironment = Readonly<Record<string, string | boolean | undefined>>;

export function parseNativeShellFeatureFlag(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

export function resolveNativeShellFeatureFlag(
  environment: NativeShellFeatureEnvironment = import.meta.env,
): boolean {
  return parseNativeShellFeatureFlag(environment[NATIVE_SHELL_FEATURE_ENV]);
}

// Ephemeral acceptance-preview override. This branch must never be merged.
export const nativeShellFeatureEnabled = true;

export const nativeShellPrimaryDestinationIds = [
  "app-home",
  "compatibility-community",
  "app-explore",
  "app-conversations",
  "app-profile",
] as const;

export const nativeShellInitialDestinationIds = nativeShellPrimaryDestinationIds;

export const nativeShellSecondaryDestinationIds = [
  "app-account",
  "app-notifications",
  "app-store",
  "app-pet",
  "app-pet-arcade",
  "app-dating",
  "app-dating-profile",
  "app-interests",
  "app-matches",
  "app-anonymous-notes",
  "app-verification",
  "app-blocked-users",
  "app-dashboard",
  "app-purpose",
  "support-root",
  "support-help",
  "support-ticket",
  "public-manual",
  "public-terms",
  "app-devotional",
  "app-news",
  "app-prayers",
  "app-bible-quiz",
  "app-avatar",
  "app-avatar-create",
  "app-boxes",
  "app-achievements",
  "app-gifts",
] as const;

type NativeShellPrimaryDestinationId = (typeof nativeShellPrimaryDestinationIds)[number];

const nativeShellPrimaryDestinationIdSet: ReadonlySet<string> =
  new Set<NativeShellPrimaryDestinationId>(nativeShellPrimaryDestinationIds);

type NativeShellSecondaryDestinationId = (typeof nativeShellSecondaryDestinationIds)[number];

const nativeShellSecondaryDestinationIdSet: ReadonlySet<string> =
  new Set<NativeShellSecondaryDestinationId>(nativeShellSecondaryDestinationIds);

export function isNativeShellEligibleDestination(behavior: DestinationBehavior): boolean {
  return (
    nativeShellPrimaryDestinationIdSet.has(behavior.destinationId) ||
    nativeShellSecondaryDestinationIdSet.has(behavior.destinationId)
  );
}

export type NativeShellRuntimeDecision = {
  featureEnabled: boolean;
  behavior: DestinationBehavior;
  loading: boolean;
  authenticated: boolean;
};

export function shouldRenderNativeShell({
  featureEnabled,
  behavior,
  loading,
  authenticated,
}: NativeShellRuntimeDecision): boolean {
  return featureEnabled && authenticated && !loading && isNativeShellEligibleDestination(behavior);
}

const nativeRootDestinationPaths: ReadonlySet<string> = new Set(["/comunidade", "/explorar"]);

export function shouldExposeNativeRootDestination(
  pathname: string,
  featureEnabled: boolean,
): boolean {
  if (!featureEnabled) return false;
  const normalizedPath = pathname.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  return nativeRootDestinationPaths.has(normalizedPath);
}
