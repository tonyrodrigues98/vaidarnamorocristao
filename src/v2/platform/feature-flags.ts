export const V2_FEATURE_FLAG_ENV = {
  appShell: "VITE_FF_V2_APP_SHELL",
  community: "VITE_FF_V2_COMMUNITY",
  dating: "VITE_FF_V2_DATING",
  messaging: "VITE_FF_V2_MESSAGING",
  profile: "VITE_FF_V2_PROFILE",
  economy: "VITE_FF_V2_ECONOMY",
  customization: "VITE_FF_V2_CUSTOMIZATION",
  pets: "VITE_FF_V2_PETS",
  admin: "VITE_FF_V2_ADMIN",
  cinema: "VITE_FF_V2_CINEMA",
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
 * All V2 experiences are closed unless their public, non-secret build flag is
 * explicitly set to the exact value "true".
 */
export const v2FeatureFlags = resolveV2FeatureFlags();
