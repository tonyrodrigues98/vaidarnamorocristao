import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function stripSqlComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

describe("V2 reconciliation boundaries", () => {
  it("keeps the inventory SQL strictly read-only and outside migrations", () => {
    const sql = stripSqlComments(
      read("docs/reestruturacao-v2/audit/V2_024_READONLY_INVENTORY.sql"),
    );
    const statements = sql
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    expect(statements.length).toBeGreaterThan(8);
    for (const statement of statements) {
      expect(statement).toMatch(/^(BEGIN TRANSACTION READ ONLY|SET LOCAL|SELECT|ROLLBACK)\b/i);
    }
    expect(sql).not.toMatch(
      /\b(INSERT|UPDATE|DELETE|UPSERT|ALTER|DROP|TRUNCATE|CREATE|GRANT|REVOKE|CALL|DO)\b/i,
    );
    expect(readdirSync(join(root, "supabase", "migrations"))).not.toContain(
      "V2_024_READONLY_INVENTORY.sql",
    );
  });

  it("does not read row content, secrets or object paths", () => {
    const sql = stripSqlComments(
      read("docs/reestruturacao-v2/audit/V2_024_READONLY_INVENTORY.sql"),
    );

    expect(sql).not.toMatch(/\b(auth\.users|storage\.objects|vault\.|decrypted_secret)\b/i);
    expect(sql).not.toMatch(/\b(email|phone|message_body|object_path|owner_id)\b/i);
  });

  it("keeps the library detached from Supabase, router and environment state", () => {
    const directory = join(root, "src", "v2", "platform", "reconciliation");
    const source = readdirSync(directory)
      .map((file) => readFileSync(join(directory, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/@\/integrations\/supabase|@supabase|@tanstack\/react-router/);
    expect(source).not.toMatch(/import\.meta\.env|process\.env|service_role/i);
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/);
  });

  it("contains no mutation or deletion API", () => {
    const source = read("src/v2/platform/reconciliation/contracts.ts");

    expect(source).not.toMatch(
      /\b(apply|execute|delete|drop|truncate|grant|credit|debit)\w*\s*\(/i,
    );
    expect(source).toContain("mutationAllowed: false");
    expect(source).toContain("physicalDeletionAllowed: false");
  });

  it("keeps package, lockfile and generated route tree outside the stage", () => {
    const documentation = read("docs/reestruturacao-v2/audit/contraction-readiness.json");

    expect(documentation).not.toContain("package.json");
    expect(documentation).not.toContain("bun.lock");
    expect(documentation).not.toContain("routeTree.gen.ts");
  });
});
