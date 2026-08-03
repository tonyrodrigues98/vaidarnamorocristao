export const TOTAL_REDESIGN_FEATURE_ENV = "VITE_FF_TOTAL_REDESIGN";

export type TotalRedesignEnvironment = Readonly<Record<string, string | boolean | undefined>>;

export function parseTotalRedesignFeatureFlag(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

export function resolveTotalRedesignFeatureFlag(
  environment: TotalRedesignEnvironment = import.meta.env,
): boolean {
  return parseTotalRedesignFeatureFlag(environment[TOTAL_REDESIGN_FEATURE_ENV]);
}

export const totalRedesignFeatureEnabled = resolveTotalRedesignFeatureFlag();

export function shouldActivateTotalRedesign(
  nativeShellActive: boolean,
  featureEnabled: boolean,
): boolean {
  return nativeShellActive && featureEnabled;
}
