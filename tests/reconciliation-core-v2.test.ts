import { describe, expect, it } from "vitest";
import {
  CONTRACTION_EVIDENCE_KEYS,
  assessContractionReadiness,
  createSemanticChecksum,
  createSemanticPayload,
  evaluateReconciliation,
  planAvatarCompensation,
  type ContractionEvidence,
} from "../src/v2/platform/reconciliation";

const completeEvidence = Object.freeze(
  Object.fromEntries(CONTRACTION_EVIDENCE_KEYS.map((key) => [key, true])),
) as ContractionEvidence;

describe("V2 reconciliation core", () => {
  it("creates an order-independent semantic payload with explicit fields", () => {
    const a = createSemanticPayload(
      [
        { id: "2", owner: "b", ignored: "x" },
        { id: "1", owner: "a", ignored: "y" },
      ],
      ["owner", "id"],
    );
    const b = createSemanticPayload(
      [
        { ignored: "changed", owner: "a", id: "1" },
        { owner: "b", id: "2" },
      ],
      ["id", "owner"],
    );

    expect(a).toBe(b);
    expect(a).not.toContain("ignored");
  });

  it("creates SHA-256 digests without returning record content", async () => {
    const checksum = await createSemanticChecksum(
      [{ id: "stable", balance: 10 }],
      ["id", "balance"],
    );

    expect(checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(checksum).not.toContain("stable");
  });

  it("changes the checksum when semantic ownership changes", async () => {
    const before = await createSemanticChecksum([{ id: "item", owner: "a" }], ["id", "owner"]);
    const after = await createSemanticChecksum([{ id: "item", owner: "b" }], ["id", "owner"]);

    expect(after).not.toBe(before);
  });

  it("passes only equal counts, checksums and relationship invariants", () => {
    expect(
      evaluateReconciliation({
        domain: "economy-inventory",
        sourceCount: 2,
        targetCount: 2,
        sourceChecksum: "sha256:same",
        targetChecksum: "sha256:same",
        orphanCount: 0,
        invalidRelationshipCount: 0,
      }),
    ).toEqual({ domain: "economy-inventory", status: "PASS", reasons: [] });
  });

  it("fails mismatches and never treats equal row counts as sufficient", () => {
    const result = evaluateReconciliation({
      domain: "dating-messaging-purpose",
      sourceCount: 10,
      targetCount: 10,
      sourceChecksum: "sha256:source",
      targetChecksum: "sha256:target",
      orphanCount: 0,
      invalidRelationshipCount: 0,
    });

    expect(result.status).toBe("FAIL");
    expect(result.reasons).toContain("semantic-checksum-mismatch");
  });

  it("keeps missing semantic evidence in review", () => {
    const result = evaluateReconciliation({
      domain: "storage",
      sourceCount: 4,
      targetCount: 4,
      orphanCount: 0,
      invalidRelationshipCount: 0,
    });

    expect(result).toMatchObject({ status: "REVIEW", reasons: ["checksum-missing"] });
  });

  it("accepts only explicitly approved expected differences without integrity defects", () => {
    const expected = evaluateReconciliation({
      domain: "identity-profile",
      sourceCount: 4,
      targetCount: 3,
      sourceChecksum: "sha256:a",
      targetChecksum: "sha256:b",
      orphanCount: 0,
      invalidRelationshipCount: 0,
      expectedDifference: { approved: true, reasonCode: "documented-system-account" },
    });
    const orphaned = evaluateReconciliation({
      domain: "identity-profile",
      sourceCount: 4,
      targetCount: 3,
      sourceChecksum: "sha256:a",
      targetChecksum: "sha256:b",
      orphanCount: 1,
      invalidRelationshipCount: 0,
      expectedDifference: { approved: true, reasonCode: "documented-system-account" },
    });

    expect(expected.status).toBe("EXPECTED_DIFF");
    expect(orphaned.status).toBe("FAIL");
  });

  it("fails contraction closed when a single operational proof is missing", () => {
    const evidence = { ...completeEvidence, "restore-rehearsed": false };
    const readiness = assessContractionReadiness(evidence, [
      { domain: "identity-profile", status: "PASS", reasons: [] },
    ]);

    expect(readiness.eligible).toBe(false);
    expect(readiness.missingEvidence).toEqual(["restore-rehearsed"]);
    expect(readiness.physicalDeletionAllowed).toBe(false);
  });

  it("requires every domain to be resolved before eligibility", () => {
    const readiness = assessContractionReadiness(completeEvidence, [
      { domain: "identity-profile", status: "PASS", reasons: [] },
      { domain: "storage", status: "REVIEW", reasons: ["checksum-missing"] },
      { domain: "economy-inventory", status: "FAIL", reasons: ["count-mismatch"] },
    ]);

    expect(readiness.eligible).toBe(false);
    expect(readiness.reviewDomains).toEqual(["storage"]);
    expect(readiness.failedDomains).toEqual(["economy-inventory"]);
  });

  it("can prove readiness without ever authorizing deletion in this stage", () => {
    const readiness = assessContractionReadiness(completeEvidence, [
      { domain: "identity-profile", status: "PASS", reasons: [] },
      { domain: "storage", status: "EXPECTED_DIFF", reasons: ["approved-retention-exclusion"] },
    ]);

    expect(readiness.eligible).toBe(true);
    expect(readiness.physicalDeletionAllowed).toBe(false);
  });

  it("keeps avatar compensation a non-mutating dry-run", () => {
    const pending = planAvatarCompensation({
      ownerCount: 0,
      exclusiveOwnershipCount: 0,
      historicalSpendMinorUnits: null,
      selectedPolicy: null,
      approvedByProductOwner: false,
    });
    const modeled = planAvatarCompensation({
      ownerCount: 12,
      exclusiveOwnershipCount: 18,
      historicalSpendMinorUnits: 5000,
      selectedPolicy: "hybrid",
      approvedByProductOwner: true,
    });

    expect(pending.ready).toBe(false);
    expect(pending.blockers).toEqual(
      expect.arrayContaining([
        "historical-cost-unavailable",
        "policy-not-selected",
        "product-owner-approval-missing",
      ]),
    );
    expect(modeled).toMatchObject({ ready: true, grantCount: 0, mutationAllowed: false });
  });
});
