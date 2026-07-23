import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SECURITY_FINDING_IDS,
  SECURITY_PRIORITIES,
  validateSecurityEvidenceManifest,
} from "../src/v2/platform/trust-security/security-evidence";

const manifest = JSON.parse(
  readFileSync(resolve("docs/reestruturacao-v2/security-baseline/findings.json"), "utf8"),
);

describe("V2 security evidence manifest", () => {
  it("contains one evidence record for every SEG-001 through SEG-020", () => {
    expect(validateSecurityEvidenceManifest(manifest)).toEqual([]);
    expect(manifest.findings.map((finding: { id: string }) => finding.id)).toEqual([
      ...SECURITY_FINDING_IDS,
    ]);
  });

  it("defines P0 through P4 without requiring a fabricated finding for each level", () => {
    expect(Object.keys(manifest.priorityDefinitions)).toEqual([...SECURITY_PRIORITIES]);
    expect(
      manifest.findings.every((finding: { priority: string }) => /^P[0-4]$/.test(finding.priority)),
    ).toBe(true);
  });

  it("keeps published state unclaimed until an authenticated snapshot exists", () => {
    expect(manifest.productionSnapshot).toBe("not_captured");
    expect(JSON.stringify(manifest)).not.toContain("confirmed_in_production");
    expect(
      manifest.findings
        .filter(
          (finding: { state: string }) => finding.state === "production_verification_required",
        )
        .every((finding: { productionGate: string | null }) => Boolean(finding.productionGate)),
    ).toBe(true);
  });

  it("records proof and a recovery strategy for every finding", () => {
    for (const finding of manifest.findings) {
      expect(
        finding.headEvidence.length +
          finding.typesEvidence.length +
          finding.migrationEvidence.length,
      ).toBeGreaterThan(0);
      expect(finding.provingTests).toBeInstanceOf(Array);
      expect(finding.localChange).toBeTruthy();
      expect(finding.rollbackOrForwardFix).toBeTruthy();
    }
  });
});
