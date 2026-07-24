export type LegacyRetirementEventName =
  | "legacy-route-used"
  | "legacy-route-redirected"
  | "quarantine-shown"
  | "rollback-requested";

export interface LegacyRetirementEvent {
  readonly name: LegacyRetirementEventName;
  readonly surface: "dating-index" | "character-avatar";
  readonly routeFamily: "dating" | "avatar";
  readonly occurredAt: number;
}

export const LEGACY_RETIREMENT_EVENT = "vdn:v2:legacy-retirement";

export function createLegacyRetirementEvent(
  input: Omit<LegacyRetirementEvent, "occurredAt">,
  now = Date.now(),
): LegacyRetirementEvent {
  return Object.freeze({ ...input, occurredAt: now });
}

export function emitLegacyRetirementEvent(event: LegacyRetirementEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LEGACY_RETIREMENT_EVENT, { detail: event }));
}

export const LEGACY_RETIREMENT_TELEMETRY_BOUNDARIES = Object.freeze({
  networkSinkConfigured: false,
  userIdIncluded: false,
  emailIncluded: false,
  profileIncluded: false,
  routeParametersIncluded: false,
});
