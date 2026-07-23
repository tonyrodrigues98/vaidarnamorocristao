import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Finding = {
  id: string;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  state: string;
  headEvidence: string[];
  productionGate: string;
  provingTests: string[];
  localChange: string;
  rollbackOrForwardFix: string;
  migrationEvidence: string[];
};

const manifest = JSON.parse(
  readFileSync(resolve("docs/reestruturacao-v2/security-baseline/findings.json"), "utf8"),
) as { findings: Finding[] };
const closure = readFileSync(resolve("docs/reestruturacao-v2/26_SECURITY_CLOSURE_V2.md"), "utf8");
const normalizedClosure = closure.replace(/\s+/g, " ");

describe("V2-008 security closure", () => {
  it("retains exactly one stable finding for every SEG-001 through SEG-020", () => {
    expect(manifest.findings).toHaveLength(20);
    expect(manifest.findings.map((finding) => finding.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => `SEG-${String(index + 1).padStart(3, "0")}`),
    );
  });

  it("leaves no P0 or P1 as an uncontained confirmed-in-head observation", () => {
    const critical = manifest.findings.filter((finding) => ["P0", "P1"].includes(finding.priority));
    expect(critical).toHaveLength(16);
    expect(critical.every((finding) => finding.state !== "confirmed_in_head")).toBe(true);
    expect(
      critical.every((finding) =>
        ["locally_contained", "locally_mitigated", "production_verification_required"].includes(
          finding.state,
        ),
      ),
    ).toBe(true);
  });

  it("requires evidence, a production gate, tests, a local action and rollback for every P0/P1", () => {
    for (const finding of manifest.findings.filter((item) =>
      ["P0", "P1"].includes(item.priority),
    )) {
      expect(finding.headEvidence.length, finding.id).toBeGreaterThan(0);
      expect(finding.productionGate.trim(), finding.id).not.toBe("");
      expect(finding.provingTests.length, finding.id).toBeGreaterThan(0);
      expect(finding.localChange.trim(), finding.id).not.toBe("");
      expect(finding.rollbackOrForwardFix.trim(), finding.id).not.toBe("");
    }
  });

  it("keeps production-dependent findings explicit instead of asserting published safety", () => {
    const productionGates = manifest.findings.filter(
      (finding) => finding.state === "production_verification_required",
    );
    expect(productionGates.map((finding) => finding.id)).toEqual([
      "SEG-002",
      "SEG-003",
      "SEG-004",
      "SEG-005",
      "SEG-006",
      "SEG-009",
      "SEG-015",
      "SEG-016",
    ]);
    expect(closure).toContain("Não significa que o Supabase ou o domínio publicado");
  });

  it("references only migrations that exist and remain declared as not applied", () => {
    const migrationNames = [
      "20260723000001_v2_trusted_reward_capabilities.sql",
      "20260723000002_v2_atomic_push_dispatch.sql",
      "20260723000003_v2_photo_repair_audit.sql",
    ];
    for (const name of migrationNames) {
      expect(existsSync(resolve("supabase/migrations", name)), name).toBe(true);
      expect(closure).toContain(name);
    }
    expect(normalizedClosure).toContain("Nenhuma migration foi executada");
  });

  it("keeps mutable and production tests behind disposable-environment gates", () => {
    expect(closure).toContain("Supabase descartável");
    expect(normalizedClosure).toContain(
      "permanecem excluídos por dependerem de Supabase descartável",
    );
    expect(closure).not.toMatch(/migration (?:foi|está) aplicada/i);
  });

  it("documents fail-safe operational order and data-preserving rollback", () => {
    expect(closure).toContain("flags fechadas durante schema rollout");
    expect(closure).toContain("nunca revertem saldo/XP legítimo");
    expect(closure).toContain("nunca privatização abrupta");
    expect(closure).toContain("eventos de auditoria são preservados");
  });

  it("advances only to the documented next lot", () => {
    expect(closure).toContain("V2-009 — Perfis Modulares e Identidade Pública");
    expect(closure).not.toContain("V2-010 —");
  });
});
