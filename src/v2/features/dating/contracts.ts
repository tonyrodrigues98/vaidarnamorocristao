export type DatingModeState =
  | "inactive"
  | "active"
  | "paused"
  | "legacy-confirmation"
  | "committed"
  | "restricted";

export type DatingInterestState = "none" | "sent" | "received" | "matched";
export type DatingReportReason =
  | "inappropriate_profile"
  | "false_identity"
  | "harassment"
  | "other";

export interface DatingMembership {
  readonly state: DatingModeState;
  readonly receiveAnonymous: boolean;
}

export interface DatingDiscoveryCursor {
  readonly unseenPriority: 0 | 1;
  readonly sameStatePriority: 0 | 1;
  readonly createdAt: string;
  readonly id: string;
}

export interface DatingCandidate {
  readonly id: string;
  readonly displayName: string;
  readonly age: number;
  readonly city: string;
  readonly state: string;
  readonly church: string;
  readonly bio: string;
  readonly photoUrl: string | null;
  readonly verified: boolean;
  readonly desiredQuality: string | null;
  readonly seeking: string | null;
  readonly pace: string | null;
  readonly explanation: "mesmo_estado_e_recente" | "recente";
  readonly interestState: DatingInterestState;
}

export interface DatingDiscoveryPage {
  readonly items: readonly DatingCandidate[];
  readonly nextCursor: DatingDiscoveryCursor | null;
  readonly hasMore: boolean;
  readonly eligibilityRule: "legacy-opposite-sex-v1";
}

export interface DatingInterestResult {
  readonly state: "sent" | "matched";
  readonly matchId: string | null;
}

export interface DatingRepository {
  loadMembership(userId: string): Promise<DatingMembership>;
  loadDiscovery(userId: string, cursor: DatingDiscoveryCursor | null): Promise<DatingDiscoveryPage>;
  expressInterest(userId: string, candidateId: string): Promise<DatingInterestResult>;
  pause(userId: string): Promise<DatingMembership>;
  deactivate(userId: string): Promise<DatingMembership>;
  block(userId: string, candidateId: string): Promise<void>;
  report(userId: string, candidateId: string, reason: DatingReportReason): Promise<void>;
}

export const DATING_ELIGIBILITY_RULE = Object.freeze({
  id: "legacy-opposite-sex-v1" as const,
  summary:
    "Preserva a regra atual de sexo oposto e as preferências de idade/localização do observador.",
  bilateralPreferenceChangeRequiresProductDecision: true,
});

export function isDatingModeState(value: unknown): value is DatingModeState {
  return (
    value === "inactive" ||
    value === "active" ||
    value === "paused" ||
    value === "legacy-confirmation" ||
    value === "committed" ||
    value === "restricted"
  );
}

export function isDatingInterestState(value: unknown): value is DatingInterestState {
  return value === "none" || value === "sent" || value === "received" || value === "matched";
}

export function isDatingReportReason(value: unknown): value is DatingReportReason {
  return (
    value === "inappropriate_profile" ||
    value === "false_identity" ||
    value === "harassment" ||
    value === "other"
  );
}

export function parseDatingCursor(value: unknown): DatingDiscoveryCursor | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    (row.unseenPriority !== 0 && row.unseenPriority !== 1) ||
    (row.sameStatePriority !== 0 && row.sameStatePriority !== 1) ||
    typeof row.createdAt !== "string" ||
    !Number.isFinite(Date.parse(row.createdAt)) ||
    typeof row.id !== "string" ||
    !/^[0-9a-f-]{8,64}$/i.test(row.id)
  ) {
    return null;
  }
  return {
    unseenPriority: row.unseenPriority,
    sameStatePriority: row.sameStatePriority,
    createdAt: row.createdAt,
    id: row.id,
  };
}

export function safeDatingMediaUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
