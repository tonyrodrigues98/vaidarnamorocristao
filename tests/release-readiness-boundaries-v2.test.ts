import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RELEASE_INVARIANTS } from "../src/v2/platform/release-readiness";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("V2 release boundaries", () => {
  it("keeps readiness code pure and detached from runtime infrastructure", () => {
    const source = read("src/v2/platform/release-readiness/contracts.ts");

    expect(source).not.toMatch(/@supabase|@tanstack|import\.meta\.env|process\.env/);
    expect(source).not.toMatch(/\b(fetch|WebSocket|XMLHttpRequest)\s*\(/);
    expect(source).not.toMatch(/\b(deploy|merge|migrate|delete|drop)\w*\s*\(/i);
  });

  it("contains no executable deploy, migration or destructive command in the runbook", () => {
    const runbook = read("docs/reestruturacao-v2/46_RELEASE_ROLLOUT_RUNBOOK.md");

    expect(runbook).not.toMatch(
      /(?:^|\n)\s*(?:supabase\s+db\s+push|wrangler\s+deploy|git\s+push\s+origin\s+main|DROP\s+TABLE|TRUNCATE\s+)/im,
    );
    expect(runbook).toContain("Este runbook prepara o rollout, mas não o executa.");
    expect(runbook).toContain("Contração física não faz parte deste rollout.");
  });

  it("requires a human decision after all calculable gates", () => {
    const source = read("src/v2/platform/release-readiness/contracts.ts");

    expect(source).toContain("releaseAuthorized: false");
    expect(RELEASE_INVARIANTS.automaticMergeAllowed).toBe(false);
    expect(RELEASE_INVARIANTS.automaticDeployAllowed).toBe(false);
  });

  it("does not weaken server authorization or expose session data", () => {
    const documents = [
      "docs/reestruturacao-v2/45_RELEASE_READINESS.md",
      "docs/reestruturacao-v2/46_RELEASE_ROLLOUT_RUNBOOK.md",
      "docs/reestruturacao-v2/47_FINAL_PARITY_MATRIX.md",
    ]
      .map(read)
      .join("\n");

    expect(documents).toContain("autorização de frontend não substitui RLS/RPC");
    expect(documents).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{24,}/);
    expect(documents).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY\s*=/);
  });

  it("keeps production and physical contraction explicitly closed", () => {
    const readiness = read("docs/reestruturacao-v2/audit/release-readiness.json");
    const contraction = read("docs/reestruturacao-v2/audit/contraction-readiness.json");

    expect(readiness).toContain('"productionReady": false');
    expect(readiness).toContain('"releaseAuthorized": false');
    expect(contraction).toContain('"physicalDeletionAllowed": false');
    expect(contraction).toContain('"safeForPhysicalRemoval": []');
  });
});
