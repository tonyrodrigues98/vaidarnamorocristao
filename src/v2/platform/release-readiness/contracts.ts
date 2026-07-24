export const LOCAL_RELEASE_GATES = Object.freeze([
  "frozen-install",
  "typecheck",
  "safe-tests",
  "focused-lint",
  "focused-format",
  "client-ssr-build",
  "quality-budget",
  "credential-scan",
  "routes-links-imports-cycles",
  "diff-integrity",
] as const);

export const EXTERNAL_RELEASE_GATES = Object.freeze([
  "disposable-supabase-rls-rpc",
  "migration-rehearsal",
  "published-schema-reconciliation",
  "realtime-e2e",
  "backup-restore-rehearsal",
  "device-visual-a11y",
  "jobs-endpoints-secrets",
  "observability-alerts-owners",
  "cinema-legal-media",
  "product-decisions",
] as const);

export type LocalReleaseGateId = (typeof LOCAL_RELEASE_GATES)[number];
export type ExternalReleaseGateId = (typeof EXTERNAL_RELEASE_GATES)[number];
export type ReleaseGateId = LocalReleaseGateId | ExternalReleaseGateId;
export type ReleaseGateStatus = "PASS" | "BLOCKED_EXTERNAL" | "NOT_RUN" | "FAIL";
export type ReleaseGateScope = "local" | "external";

export interface ReleaseGate {
  readonly id: ReleaseGateId;
  readonly scope: ReleaseGateScope;
  readonly status: ReleaseGateStatus;
  readonly evidence: string;
  readonly ownerRole: string;
}

export interface ReleaseReadinessAssessment {
  readonly technicalReviewReady: boolean;
  readonly stagingReady: boolean;
  readonly productionReady: boolean;
  readonly releaseAuthorized: false;
  readonly failedGates: readonly ReleaseGateId[];
  readonly blockedGates: readonly ReleaseGateId[];
  readonly missingGates: readonly ReleaseGateId[];
}

export function assessReleaseReadiness(gates: readonly ReleaseGate[]): ReleaseReadinessAssessment {
  const byId = new Map(gates.map((gate) => [gate.id, gate]));
  const missingGates = [...LOCAL_RELEASE_GATES, ...EXTERNAL_RELEASE_GATES].filter(
    (id) => !byId.has(id),
  );
  const failedGates = gates.filter((gate) => gate.status === "FAIL").map((gate) => gate.id);
  const blockedGates = gates
    .filter((gate) => gate.status === "BLOCKED_EXTERNAL" || gate.status === "NOT_RUN")
    .map((gate) => gate.id);
  const localPass = LOCAL_RELEASE_GATES.every((id) => byId.get(id)?.status === "PASS");
  const externalPass = EXTERNAL_RELEASE_GATES.every((id) => byId.get(id)?.status === "PASS");

  return Object.freeze({
    technicalReviewReady: localPass && failedGates.length === 0 && missingGates.length === 0,
    stagingReady:
      localPass && externalPass && failedGates.length === 0 && missingGates.length === 0,
    productionReady:
      localPass && externalPass && failedGates.length === 0 && missingGates.length === 0,
    releaseAuthorized: false,
    failedGates: Object.freeze(failedGates),
    blockedGates: Object.freeze(blockedGates),
    missingGates: Object.freeze(missingGates),
  });
}

export interface RolloutDecisionInput {
  readonly currentCohortPercent: number;
  readonly securityIncidents: number;
  readonly integrityFailures: number;
  readonly unexplainedFinancialDivergences: number;
  readonly authFailureRateWithinSlo: boolean;
  readonly errorRateWithinSlo: boolean;
  readonly latencyWithinSlo: boolean;
  readonly rollbackTested: boolean;
}

export type RolloutDecision = "ADVANCE" | "HOLD" | "ROLLBACK";

export function decideRollout(input: RolloutDecisionInput): RolloutDecision {
  if (
    input.securityIncidents > 0 ||
    input.integrityFailures > 0 ||
    input.unexplainedFinancialDivergences > 0
  ) {
    return "ROLLBACK";
  }
  if (
    !input.authFailureRateWithinSlo ||
    !input.errorRateWithinSlo ||
    !input.latencyWithinSlo ||
    !input.rollbackTested
  ) {
    return "HOLD";
  }
  if (input.currentCohortPercent < 0 || input.currentCohortPercent > 100) return "HOLD";
  return "ADVANCE";
}

export const RELEASE_INVARIANTS = Object.freeze({
  automaticMergeAllowed: false,
  automaticDeployAllowed: false,
  automaticMigrationAllowed: false,
  productionFlagActivationAllowed: false,
  destructiveContractionAllowed: false,
  secretsMayBePersisted: false,
});
