export {
  LEGACY_RETIREMENT_FLAG_ENV,
  LEGACY_RETIREMENT_INVARIANTS,
  resolveLegacyRetirementState,
  resolveLegacyRouteDisposition,
  type LegacyRetirementAssessment,
  type LegacyRetirementRequirement,
  type LegacyRetirementState,
  type LegacyRouteDisposition,
} from "./contracts";
export { LegacyQuarantineNotice, type LegacyQuarantineNoticeProps } from "./LegacyQuarantineNotice";
export { legacyRetirementState, shouldShowLegacyDatingNavigation } from "./runtime";
export {
  LEGACY_RETIREMENT_EVENT,
  LEGACY_RETIREMENT_TELEMETRY_BOUNDARIES,
  createLegacyRetirementEvent,
  emitLegacyRetirementEvent,
  type LegacyRetirementEvent,
  type LegacyRetirementEventName,
} from "./telemetry";
