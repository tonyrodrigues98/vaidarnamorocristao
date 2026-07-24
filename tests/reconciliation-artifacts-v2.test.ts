import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONTRACTION_EVIDENCE_KEYS,
  RECONCILIATION_DOMAINS,
} from "../src/v2/platform/reconciliation";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const parse = <T>(path: string): T => JSON.parse(read(path)) as T;

describe("V2 reconciliation artifacts", () => {
  it("covers every protected reconciliation domain without PII", () => {
    const manifest = parse<{
      containsPii: boolean;
      publishedSnapshotCaptured: boolean;
      domains: Array<{ id: string; protectedSources: string[]; semanticKeys: string[] }>;
    }>("docs/reestruturacao-v2/audit/reconciliation-manifest.json");

    expect(manifest.containsPii).toBe(false);
    expect(manifest.publishedSnapshotCaptured).toBe(false);
    expect(manifest.domains.map((domain) => domain.id)).toEqual(RECONCILIATION_DOMAINS);
    expect(manifest.domains.every((domain) => domain.protectedSources.length > 0)).toBe(true);
    expect(manifest.domains.every((domain) => domain.semanticKeys.length > 0)).toBe(true);
    expect(JSON.stringify(manifest)).not.toMatch(
      /\b(email|phone|full_name|message_body|decrypted_secret|access_token|refresh_token)\b/i,
    );
  });

  it("records every missing evidence item and zero removable targets", () => {
    const readiness = parse<{
      eligible: boolean;
      physicalDeletionAllowed: boolean;
      missingEvidence: string[];
      safeForPhysicalRemoval: unknown[];
    }>("docs/reestruturacao-v2/audit/contraction-readiness.json");

    expect(readiness.eligible).toBe(false);
    expect(readiness.physicalDeletionAllowed).toBe(false);
    expect(readiness.missingEvidence).toEqual(CONTRACTION_EVIDENCE_KEYS);
    expect(readiness.safeForPhysicalRemoval).toEqual([]);
  });

  it("keeps every domain in review until the published snapshot exists", () => {
    const readiness = parse<{
      domainStatus: Array<{ domain: string; status: string }>;
    }>("docs/reestruturacao-v2/audit/contraction-readiness.json");

    expect(readiness.domainStatus.map((entry) => entry.domain)).toEqual(RECONCILIATION_DOMAINS);
    expect(readiness.domainStatus.every((entry) => entry.status === "REVIEW")).toBe(true);
  });

  it("keeps destructive SQL and compensation unapplied", () => {
    const readiness = parse<{
      destructiveSqlPrepared: boolean;
      destructiveSqlApplied: boolean;
      compensationApplied: boolean;
    }>("docs/reestruturacao-v2/audit/contraction-readiness.json");

    expect(readiness).toMatchObject({
      destructiveSqlPrepared: false,
      destructiveSqlApplied: false,
      compensationApplied: false,
    });
  });
});
