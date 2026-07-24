import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { V2_FEATURE_FLAG_ENV } from "../src/v2/platform/feature-flags";
import { LEGACY_RETIREMENT_FLAG_ENV } from "../src/v2/platform/legacy-retirement/contracts";
import { EXTERNAL_RELEASE_GATES, LOCAL_RELEASE_GATES } from "../src/v2/platform/release-readiness";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const parse = <T>(path: string): T => JSON.parse(read(path)) as T;

describe("V2 release artifacts", () => {
  it("matches the canonical domain and retirement feature flags", () => {
    const inventory = parse<{
      featureFlags: { domainFlags: string[]; retirementEvidenceFlags: string[]; default: boolean };
    }>("docs/reestruturacao-v2/audit/release-inventory.json");

    expect(inventory.featureFlags.domainFlags).toEqual(Object.values(V2_FEATURE_FLAG_ENV));
    expect(inventory.featureFlags.retirementEvidenceFlags).toEqual(
      Object.values(LEGACY_RETIREMENT_FLAG_ENV),
    );
    expect(inventory.featureFlags.default).toBe(false);
  });

  it("lists exactly the 16 versioned and unapplied V2 migrations", () => {
    const inventory = parse<{ migrations: { state: string; files: string[] } }>(
      "docs/reestruturacao-v2/audit/release-inventory.json",
    );
    const versioned = readdirSync(join(root, "supabase", "migrations"))
      .filter((file) => /^202607230000(?:0[1-9]|1[0-6])_v2_.*\.sql$/.test(file))
      .sort();

    expect(inventory.migrations.state).toBe("versioned-not-applied");
    expect(inventory.migrations.files).toEqual(versioned);
    expect(versioned).toHaveLength(16);
  });

  it("keeps all local gates passing and every external gate visibly blocked", () => {
    const readiness = parse<{
      technicalReviewReady: boolean;
      stagingReady: boolean;
      productionReady: boolean;
      releaseAuthorized: boolean;
      localGates: Array<{ id: string; status: string }>;
      externalGates: Array<{ id: string; status: string }>;
    }>("docs/reestruturacao-v2/audit/release-readiness.json");

    expect(readiness.localGates.map((gate) => gate.id)).toEqual(LOCAL_RELEASE_GATES);
    expect(readiness.localGates.every((gate) => gate.status === "PASS")).toBe(true);
    expect(readiness.externalGates.map((gate) => gate.id)).toEqual(EXTERNAL_RELEASE_GATES);
    expect(readiness.externalGates.every((gate) => gate.status === "BLOCKED_EXTERNAL")).toBe(true);
    expect(readiness).toMatchObject({
      technicalReviewReady: true,
      stagingReady: false,
      productionReady: false,
      releaseAuthorized: false,
    });
  });

  it("records the continuous Draft PR stack without claiming the current PR exists early", () => {
    const stack = parse<{
      pullRequests: Array<{ number: number | null; stage: string; status: string }>;
    }>("docs/reestruturacao-v2/audit/draft-pr-stack.json");
    const existing = stack.pullRequests.filter((entry) => entry.number !== null);
    const current = stack.pullRequests.at(-1);

    expect(existing.map((entry) => entry.number)).toEqual(
      Array.from({ length: 26 }, (_, index) => index + 7),
    );
    expect(existing.every((entry) => entry.status === "draft")).toBe(true);
    expect(current).toEqual({
      number: null,
      stage: "V2-025",
      head: "current-branch-before-final-commit",
      status: "pending-draft-pr",
    });
  });

  it("covers every parity system and refuses to claim universal parity", () => {
    const matrix = read("docs/reestruturacao-v2/47_FINAL_PARITY_MATRIX.md");
    const systems = [
      "Auth/Conta",
      "Onboarding",
      "Início/Dashboard",
      "Comunidade",
      "Conversas",
      "Perfil",
      "Namoro",
      "Propósito/recados",
      "Economia/Loja/inventário",
      "Pets/jogos",
      "Conteúdo/Verbo",
      "Cinema",
      "Notificações/moderação/suporte",
      "Admin",
      "PWA",
    ];

    for (const system of systems) {
      expect(matrix).toMatch(new RegExp(`\\| ${system.replace("/", "\\/")}\\s+\\|`));
    }
    expect(matrix).toContain("Paridade não provada");
    expect(matrix).not.toContain("| Pronto para produção |");
  });

  it("contains no credential value or operational mutation claim", () => {
    const artifacts = [
      "docs/reestruturacao-v2/audit/release-readiness.json",
      "docs/reestruturacao-v2/audit/release-inventory.json",
      "docs/reestruturacao-v2/audit/draft-pr-stack.json",
    ]
      .map(read)
      .join("\n");

    expect(artifacts).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]+/);
    expect(artifacts).not.toMatch(/"(secret|token|password|key)"\s*:\s*"[^"]+"/i);
    expect(artifacts).toContain('"deployPerformed": false');
    expect(artifacts).toContain('"migrationApplied": false');
  });
});
