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

export const nativeShellFeatureEnabled = resolveNativeShellFeatureFlag();

export const nativeShellInitialDestinationIds = ["app-home"] as const;

type NativeShellInitialDestinationId = (typeof nativeShellInitialDestinationIds)[number];

const nativeShellInitialDestinationIdSet: ReadonlySet<string> =
  new Set<NativeShellInitialDestinationId>(nativeShellInitialDestinationIds);

export function isNativeShellEligibleDestination(behavior: DestinationBehavior): boolean {
  return (
    nativeShellInitialDestinationIdSet.has(behavior.destinationId) &&
    behavior.shell === "app" &&
    behavior.access === "authenticated" &&
    behavior.status === "active"
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
