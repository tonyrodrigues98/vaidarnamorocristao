export const SECURITY_FINDING_IDS = [
  "SEG-001",
  "SEG-002",
  "SEG-003",
  "SEG-004",
  "SEG-005",
  "SEG-006",
  "SEG-007",
  "SEG-008",
  "SEG-009",
  "SEG-010",
  "SEG-011",
  "SEG-012",
  "SEG-013",
  "SEG-014",
  "SEG-015",
  "SEG-016",
  "SEG-017",
  "SEG-018",
  "SEG-019",
  "SEG-020",
] as const;

export const SECURITY_PRIORITIES = ["P0", "P1", "P2", "P3", "P4"] as const;

export const SECURITY_EVIDENCE_STATES = [
  "locally_contained",
  "locally_mitigated",
  "confirmed_in_head",
  "confirmed_in_history",
  "production_verification_required",
] as const;

export type SecurityFindingId = (typeof SECURITY_FINDING_IDS)[number];
export type SecurityPriority = (typeof SECURITY_PRIORITIES)[number];
export type SecurityEvidenceState = (typeof SECURITY_EVIDENCE_STATES)[number];

export type SecurityFindingEvidence = {
  id: SecurityFindingId;
  priority: SecurityPriority;
  title: string;
  state: SecurityEvidenceState;
  headEvidence: string[];
  typesEvidence: string[];
  migrationEvidence: string[];
  productionGate: string | null;
  provingTests: string[];
  localChange: string;
  rollbackOrForwardFix: string;
};

export type SecurityEvidenceManifest = {
  schemaVersion: 1;
  auditedSourceCommit: string;
  productionSnapshot: "not_captured";
  priorityDefinitions: Record<SecurityPriority, string>;
  findings: SecurityFindingEvidence[];
};

export function validateSecurityEvidenceManifest(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object") return ["manifest must be an object"];
  const manifest = value as Partial<SecurityEvidenceManifest>;

  if (manifest.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (manifest.productionSnapshot !== "not_captured") {
    errors.push("productionSnapshot must remain not_captured without authenticated evidence");
  }
  for (const priority of SECURITY_PRIORITIES) {
    if (!manifest.priorityDefinitions?.[priority]) {
      errors.push(`missing priority definition: ${priority}`);
    }
  }
  if (!Array.isArray(manifest.findings)) return [...errors, "findings must be an array"];

  const ids = new Set<string>();
  for (const finding of manifest.findings) {
    if (!finding || typeof finding !== "object") {
      errors.push("every finding must be an object");
      continue;
    }
    const item = finding as Partial<SecurityFindingEvidence>;
    const id = item.id;
    if (!id || !SECURITY_FINDING_IDS.includes(id as SecurityFindingId)) {
      errors.push(`unknown finding id: ${String(id)}`);
    } else if (ids.has(id)) {
      errors.push(`duplicate finding id: ${id}`);
    } else {
      ids.add(id);
    }
    if (!SECURITY_PRIORITIES.includes(item.priority as SecurityPriority)) {
      errors.push(`invalid priority for ${String(item.id)}`);
    }
    if (!SECURITY_EVIDENCE_STATES.includes(item.state as SecurityEvidenceState)) {
      errors.push(`invalid state for ${String(item.id)}`);
    }
    for (const field of [
      "headEvidence",
      "typesEvidence",
      "migrationEvidence",
      "provingTests",
    ] as const) {
      if (!Array.isArray(item[field])) errors.push(`${String(item.id)}.${field} must be an array`);
    }
    if (!item.localChange) errors.push(`${String(item.id)}.localChange is required`);
    if (!item.rollbackOrForwardFix) {
      errors.push(`${String(item.id)}.rollbackOrForwardFix is required`);
    }
  }

  for (const id of SECURITY_FINDING_IDS) {
    if (!ids.has(id)) errors.push(`missing finding: ${id}`);
  }
  return errors;
}
