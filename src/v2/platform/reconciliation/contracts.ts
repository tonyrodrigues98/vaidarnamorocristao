export const RECONCILIATION_DOMAINS = Object.freeze([
  "identity-profile",
  "dating-messaging-purpose",
  "economy-inventory",
  "pets-games",
  "storage",
  "character-avatar",
] as const);

export type ReconciliationDomain = (typeof RECONCILIATION_DOMAINS)[number];
export type ReconciliationStatus = "PASS" | "EXPECTED_DIFF" | "REVIEW" | "FAIL";

export interface ExpectedDifference {
  readonly approved: boolean;
  readonly reasonCode: string;
}

export interface ReconciliationMeasurement {
  readonly domain: ReconciliationDomain;
  readonly sourceCount: number;
  readonly targetCount: number;
  readonly sourceChecksum?: string;
  readonly targetChecksum?: string;
  readonly orphanCount: number;
  readonly invalidRelationshipCount: number;
  readonly expectedDifference?: ExpectedDifference;
}

export interface ReconciliationResult {
  readonly domain: ReconciliationDomain;
  readonly status: ReconciliationStatus;
  readonly reasons: readonly string[];
}

export const CONTRACTION_EVIDENCE_KEYS = Object.freeze([
  "production-snapshot-captured",
  "published-schema-reconciled",
  "backup-verified",
  "restore-rehearsed",
  "logical-retirement-active",
  "zero-use-window-observed",
  "parity-confirmed",
  "owners-reconciled",
  "retention-satisfied",
  "readers-removed",
  "writers-removed",
  "explicit-destructive-approval",
] as const);

export type ContractionEvidenceKey = (typeof CONTRACTION_EVIDENCE_KEYS)[number];
export type ContractionEvidence = Readonly<Record<ContractionEvidenceKey, boolean>>;

export interface ContractionReadiness {
  readonly eligible: boolean;
  readonly missingEvidence: readonly ContractionEvidenceKey[];
  readonly failedDomains: readonly ReconciliationDomain[];
  readonly reviewDomains: readonly ReconciliationDomain[];
  readonly physicalDeletionAllowed: false;
}

export function evaluateReconciliation(
  measurement: ReconciliationMeasurement,
): ReconciliationResult {
  const reasons: string[] = [];
  if (measurement.orphanCount > 0) reasons.push("orphans-detected");
  if (measurement.invalidRelationshipCount > 0) reasons.push("invalid-relationships");
  if (measurement.sourceCount !== measurement.targetCount) reasons.push("count-mismatch");

  const hasSourceChecksum = Boolean(measurement.sourceChecksum);
  const hasTargetChecksum = Boolean(measurement.targetChecksum);
  if (!hasSourceChecksum || !hasTargetChecksum) reasons.push("checksum-missing");
  else if (measurement.sourceChecksum !== measurement.targetChecksum) {
    reasons.push("semantic-checksum-mismatch");
  }

  if (reasons.length === 0) {
    return Object.freeze({ domain: measurement.domain, status: "PASS", reasons: [] });
  }

  const onlyExpectedDifference =
    measurement.expectedDifference?.approved === true &&
    reasons.every(
      (reason) => reason === "count-mismatch" || reason === "semantic-checksum-mismatch",
    );
  if (onlyExpectedDifference) {
    return Object.freeze({
      domain: measurement.domain,
      status: "EXPECTED_DIFF",
      reasons: Object.freeze([...reasons, measurement.expectedDifference!.reasonCode]),
    });
  }

  const status: ReconciliationStatus =
    reasons.length === 1 && reasons[0] === "checksum-missing" ? "REVIEW" : "FAIL";
  return Object.freeze({
    domain: measurement.domain,
    status,
    reasons: Object.freeze(reasons),
  });
}

export function assessContractionReadiness(
  evidence: ContractionEvidence,
  results: readonly ReconciliationResult[],
): ContractionReadiness {
  const missingEvidence = CONTRACTION_EVIDENCE_KEYS.filter((key) => !evidence[key]);
  const failedDomains = results
    .filter((result) => result.status === "FAIL")
    .map((result) => result.domain);
  const reviewDomains = results
    .filter((result) => result.status === "REVIEW")
    .map((result) => result.domain);

  return Object.freeze({
    eligible:
      missingEvidence.length === 0 && failedDomains.length === 0 && reviewDomains.length === 0,
    missingEvidence: Object.freeze(missingEvidence),
    failedDomains: Object.freeze(failedDomains),
    reviewDomains: Object.freeze(reviewDomains),
    physicalDeletionAllowed: false,
  });
}

export interface AvatarCompensationInputs {
  readonly ownerCount: number;
  readonly exclusiveOwnershipCount: number;
  readonly historicalSpendMinorUnits: number | null;
  readonly selectedPolicy: "none" | "coins" | "replacement-items" | "hybrid" | null;
  readonly approvedByProductOwner: boolean;
}

export interface AvatarCompensationDryRun {
  readonly mode: "dry-run";
  readonly ready: boolean;
  readonly grantCount: 0;
  readonly mutationAllowed: false;
  readonly blockers: readonly string[];
}

export function planAvatarCompensation(input: AvatarCompensationInputs): AvatarCompensationDryRun {
  const blockers: string[] = [];
  if (input.ownerCount < 0 || input.exclusiveOwnershipCount < 0) blockers.push("invalid-counts");
  if (input.historicalSpendMinorUnits === null) blockers.push("historical-cost-unavailable");
  if (input.selectedPolicy === null || input.selectedPolicy === "none") {
    blockers.push("policy-not-selected");
  }
  if (!input.approvedByProductOwner) blockers.push("product-owner-approval-missing");

  return Object.freeze({
    mode: "dry-run",
    ready: blockers.length === 0,
    grantCount: 0,
    mutationAllowed: false,
    blockers: Object.freeze(blockers),
  });
}
