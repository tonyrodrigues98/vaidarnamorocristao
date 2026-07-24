import { v2FeatureFlags } from "@/v2/platform/feature-flags";
import { resolveLegacyRetirementState } from "./contracts";

export const legacyRetirementState = resolveLegacyRetirementState(import.meta.env, v2FeatureFlags);

export function shouldShowLegacyDatingNavigation(): boolean {
  return !legacyRetirementState.datingIndexRetired;
}
