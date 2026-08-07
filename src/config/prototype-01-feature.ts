import type { DestinationBehavior } from "@/config/app-destinations";
import { isNativeShellEligibleDestination } from "@/config/native-shell-feature";

export const PROTOTYPE_01_FEATURE_ENV = "VITE_FF_PROTOTYPE01_UI";

export type Prototype01FeatureEnvironment = Readonly<Record<string, string | boolean | undefined>>;

export function parsePrototype01FeatureFlag(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

export function resolvePrototype01FeatureFlag(
  environment: Prototype01FeatureEnvironment = import.meta.env,
): boolean {
  return parsePrototype01FeatureFlag(environment[PROTOTYPE_01_FEATURE_ENV]);
}

export const prototype01FeatureEnabled = resolvePrototype01FeatureFlag();

export type Prototype01RuntimeDecision = {
  featureEnabled: boolean;
  behavior: DestinationBehavior;
  loading: boolean;
  authenticated: boolean;
};

export function shouldRenderPrototype01Shell({
  featureEnabled,
  behavior,
  loading,
  authenticated,
}: Prototype01RuntimeDecision): boolean {
  return featureEnabled && authenticated && !loading && isNativeShellEligibleDestination(behavior);
}
