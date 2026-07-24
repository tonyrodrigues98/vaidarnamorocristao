export const V2_FEATURE_FLAG_ENV = {
  appShell: "VITE_FF_V2_APP_SHELL",
  community: "VITE_FF_V2_COMMUNITY",
  dating: "VITE_FF_V2_DATING",
  messaging: "VITE_FF_V2_MESSAGING",
  profile: "VITE_FF_V2_PROFILE",
  economy: "VITE_FF_V2_ECONOMY",
  customization: "VITE_FF_V2_CUSTOMIZATION",
  pets: "VITE_FF_V2_PETS",
  content: "VITE_FF_V2_CONTENT",
  admin: "VITE_FF_V2_ADMIN",
  cinema: "VITE_FF_V2_CINEMA",
  trust: "VITE_FF_V2_TRUST_CENTER",
} as const;

export type V2FeatureFlag = keyof typeof V2_FEATURE_FLAG_ENV;
export type V2FeatureFlags = Readonly<Record<V2FeatureFlag, boolean>>;
export type FeatureFlagEnvironment = Readonly<Record<string, string | boolean | undefined>>;

export function parseFeatureFlag(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

export function resolveV2FeatureFlags(environment: FeatureFlagEnvironment = import.meta.env) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(V2_FEATURE_FLAG_ENV).map(([flag, environmentName]) => [
        flag,
        parseFeatureFlag(environment[environmentName]),
      ]),
    ),
  ) as V2FeatureFlags;
}

/**
 * V2 is the production experience after the approved all-user launch.
 * Explicit public build flags can still disable an individual module for an
 * emergency roll-forward, while missing flags keep the released V2 enabled.
 */
const V2_RELEASE_DEFAULTS = Object.freeze(
  Object.fromEntries(
    Object.values(V2_FEATURE_FLAG_ENV).map((environmentName) => [environmentName, "true"]),
  ),
) as FeatureFlagEnvironment;

export const v2FeatureFlags = resolveV2FeatureFlags({
  ...V2_RELEASE_DEFAULTS,
  ...import.meta.env,
});
