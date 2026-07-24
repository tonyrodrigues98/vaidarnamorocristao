import { describe, expect, it } from "vitest";
import {
  EXTERNAL_RELEASE_GATES,
  LOCAL_RELEASE_GATES,
  RELEASE_INVARIANTS,
  assessReleaseReadiness,
  decideRollout,
  type ReleaseGate,
} from "../src/v2/platform/release-readiness";

const makeGates = (externalStatus: ReleaseGate["status"] = "BLOCKED_EXTERNAL"): ReleaseGate[] => [
  ...LOCAL_RELEASE_GATES.map(
    (id): ReleaseGate => ({
      id,
      scope: "local",
      status: "PASS",
      evidence: `local:${id}`,
      ownerRole: "engineering",
    }),
  ),
  ...EXTERNAL_RELEASE_GATES.map(
    (id): ReleaseGate => ({
      id,
      scope: "external",
      status: externalStatus,
      evidence: `external:${id}`,
      ownerRole: "operations",
    }),
  ),
];

const healthyRollout = {
  currentCohortPercent: 1,
  securityIncidents: 0,
  integrityFailures: 0,
  unexplainedFinancialDivergences: 0,
  authFailureRateWithinSlo: true,
  errorRateWithinSlo: true,
  latencyWithinSlo: true,
  rollbackTested: true,
} as const;

describe("V2 release readiness", () => {
  it("separates technical review from staging and production readiness", () => {
    const readiness = assessReleaseReadiness(makeGates());

    expect(readiness.technicalReviewReady).toBe(true);
    expect(readiness.stagingReady).toBe(false);
    expect(readiness.productionReady).toBe(false);
    expect(readiness.blockedGates).toEqual(EXTERNAL_RELEASE_GATES);
  });

  it("fails review when a local gate does not pass", () => {
    const gates = makeGates();
    gates[1] = { ...gates[1], status: "FAIL" };
    const readiness = assessReleaseReadiness(gates);

    expect(readiness.technicalReviewReady).toBe(false);
    expect(readiness.failedGates).toEqual(["typecheck"]);
  });

  it("detects every missing gate instead of assuming success", () => {
    const gates = makeGates().filter((gate) => gate.id !== "realtime-e2e");
    const readiness = assessReleaseReadiness(gates);

    expect(readiness.technicalReviewReady).toBe(false);
    expect(readiness.missingGates).toEqual(["realtime-e2e"]);
  });

  it("can calculate production readiness without granting release authority", () => {
    const readiness = assessReleaseReadiness(makeGates("PASS"));

    expect(readiness.stagingReady).toBe(true);
    expect(readiness.productionReady).toBe(true);
    expect(readiness.releaseAuthorized).toBe(false);
  });

  it("rolls back on any security, integrity or financial divergence", () => {
    expect(decideRollout({ ...healthyRollout, securityIncidents: 1 })).toBe("ROLLBACK");
    expect(decideRollout({ ...healthyRollout, integrityFailures: 1 })).toBe("ROLLBACK");
    expect(decideRollout({ ...healthyRollout, unexplainedFinancialDivergences: 1 })).toBe(
      "ROLLBACK",
    );
  });

  it("holds when an SLO or rollback proof is missing", () => {
    expect(decideRollout({ ...healthyRollout, latencyWithinSlo: false })).toBe("HOLD");
    expect(decideRollout({ ...healthyRollout, rollbackTested: false })).toBe("HOLD");
    expect(decideRollout({ ...healthyRollout, currentCohortPercent: 101 })).toBe("HOLD");
  });

  it("advances only a healthy and bounded cohort", () => {
    expect(decideRollout(healthyRollout)).toBe("ADVANCE");
    expect(decideRollout({ ...healthyRollout, currentCohortPercent: 100 })).toBe("ADVANCE");
  });

  it("forbids automated operational actions in the program", () => {
    expect(RELEASE_INVARIANTS).toEqual({
      automaticMergeAllowed: false,
      automaticDeployAllowed: false,
      automaticMigrationAllowed: false,
      productionFlagActivationAllowed: false,
      destructiveContractionAllowed: false,
      secretsMayBePersisted: false,
    });
  });
});
