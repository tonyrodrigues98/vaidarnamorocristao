import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("release validation contracts", () => {
  it("keeps the disposable workflow branch-scoped and secret-free", () => {
    const workflow = read(".github/workflows/release-validation.yml");
    expect(workflow).toContain("validation/release-readiness-points-4-9");
    expect(workflow).toContain("supabase start");
    expect(workflow).not.toMatch(/secrets\.[A-Z0-9_]+/);
    expect(workflow).not.toContain("supabase link");
    expect(workflow).not.toContain("supabase db push");
  });

  it("refuses any non-local Supabase or database destination", () => {
    const runner = read("scripts/release-validation/run-disposable-validation.sh");
    const seed = read("scripts/release-validation/seed-synthetic.mjs");
    expect(runner).toContain("Refusing non-local Supabase URL");
    expect(runner).toContain("Refusing non-local database URL");
    expect(seed).toContain("Refusing to seed a non-local Supabase URL");
  });

  it("covers exactly the 16 V2 migrations without changing them", () => {
    const migrations = readdirSync(join(root, "supabase", "migrations")).filter((name) =>
      /^202607230000(?:0[1-9]|1[0-6])_v2_.*\.sql$/.test(name),
    );
    const analyzer = read("scripts/release-validation/analyze-migrations.mjs");
    expect(migrations).toHaveLength(16);
    for (const migration of migrations) expect(analyzer).toContain(migration);
  });

  it("runs all four migration scenarios plus real backup restoration", () => {
    const runner = read("scripts/release-validation/run-disposable-validation.sh");
    expect(runner).toContain("scenario=A");
    expect(runner).toContain("scenario=B");
    expect(runner).toContain("scenario=C");
    expect(runner).toContain("scenario=D");
    expect(runner).toMatch(
      /scenario-c-forced-failure\.log[\s\S]*trap 'report_failure \$LINENO \$\?' ERR/,
    );
    expect(runner).toContain("pg_dump");
    expect(runner).toContain("pg_restore");
    expect(runner).not.toContain("--no-privileges");
    expect(runner).not.toContain("--no-owner");
    expect(runner).toContain("CREATE DATABASE postgres");
    expect(runner).toContain("DB_CONTAINER_ID");
    expect(runner).toContain('docker exec "$DB_CONTAINER_ID"');
    expect(runner).toContain("ALTER DATABASE postgres RENAME TO source_validation");
    expect(runner).toContain("psql --username supabase_admin --dbname template1");
    expect(runner).toContain("pg_restore --username supabase_admin --dbname postgres");
    expect(runner).toContain("CREATE DATABASE postgres OWNER postgres");
    expect(runner).toContain("post-restore-smoke.log");
    expect(runner).toContain("$SUPABASE_URL/auth/v1/health");
    expect(runner).toContain("within 90 seconds");
    expect(runner).toContain("Restore diagnostic");
    expect(runner).toContain("exit 77");
    expect(runner).toContain("cmp");
  });

  it("records every external Supabase suite independently for actionable failures", () => {
    const runner = read("scripts/release-validation/run-disposable-validation.sh");
    for (const test of [
      "starter-bundle.test.ts",
      "messages-rls.test.ts",
      "moderation-rls.test.ts",
      "chat-e2e.test.ts",
      "realtime-infrastructure.test.ts",
      "realtime-messages.test.ts",
      "push-dispatch-atomic-rls.test.ts",
      "trusted-capabilities-rls.test.ts",
    ]) {
      expect(runner).toContain(test);
    }
    expect(runner).toContain("external-tests.csv");
    expect(runner).toContain("external_failure_count");
    expect(runner).toContain("exit 75");
    expect(runner).toContain("Disposable release validation summary");
  });

  it("uses only synthetic identities and never production-like domains", () => {
    const seed = read("scripts/release-validation/seed-synthetic.mjs");
    expect(seed).toContain("@example.invalid");
    expect(seed).toContain("containsPersonalData: false");
    expect(seed).not.toMatch(/@gmail\.com|@hotmail\.com|@outlook\.com/i);
  });

  it("keeps evidence sanitized and temporary", () => {
    const workflow = read(".github/workflows/release-validation.yml");
    const runner = read("scripts/release-validation/run-disposable-validation.sh");
    expect(workflow).toContain("retention-days: 14");
    expect(runner).not.toMatch(/echo\s+["']?\$(?:SERVICE_ROLE_KEY|ANON_KEY)/);
    expect(runner).not.toMatch(/cat\s+.*(?:\\.env|status.*env)/);
  });

  it("keeps clean installs safe when the presence policy is recreated", () => {
    const migration = read(
      "supabase/migrations/20260611194736_603a6156-78e2-4928-b919-c27790bca30b.sql",
    );
    const dropIndex = migration.indexOf('DROP POLICY IF EXISTS "authenticated read presence"');
    const createIndex = migration.indexOf('CREATE POLICY "authenticated read presence"');

    expect(dropIndex).toBeGreaterThanOrEqual(0);
    expect(createIndex).toBeGreaterThan(dropIndex);
  });

  it("qualifies pgcrypto digest calls in the legacy arcade bootstrap", () => {
    for (const migration of [
      "20260622113924_f94a29af-e4dd-4a8b-a640-304904290044.sql",
      "20260622120000_pet_arcade.sql",
      "20260622150000_pet_arcade_expansion.sql",
    ]) {
      const sql = read(`supabase/migrations/${migration}`);
      expect(sql).not.toMatch(/(?<!\.)\bdigest\s*\(/);
      expect(sql).toContain("extensions.digest(");
    }
  });

  it("repairs the missing published relationship contract only on clean bootstraps", () => {
    const migration = read(
      "supabase/migrations/20260722999999_release_validation_bootstrap_compatibility.sql",
    );
    const runner = read("scripts/release-validation/run-disposable-validation.sh");

    expect(migration).toContain("IF to_regclass('public.relationship_commitments') IS NULL THEN");
    expect(migration).toContain("CREATE TABLE public.relationship_commitments");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain(
      "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role",
    );
    expect(migration).not.toContain(
      "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated",
    );
    expect(migration).toContain("GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated");
    expect(migration).toContain(
      "GRANT SELECT, INSERT ON TABLE public.global_messages TO authenticated",
    );
    expect(migration).toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO authenticated",
    );
    expect(migration).toContain("relationship participants read bootstrap");
    expect(migration).not.toContain("DROP TABLE");
    expect(runner).toContain('BOOTSTRAP_REPAIR="$ROOT/supabase/migrations/');
  });

  it("keeps the Cinema session row and scalar duration in valid separate selects", () => {
    const migration = read("supabase/migrations/20260723000014_v2_cinema_watch_party.sql");

    expect(migration).not.toMatch(/SELECT session,\s*media\.duration_ms\s+INTO _session,/);
    expect(migration).toContain("SELECT session.*\n  INTO _session");
    expect(migration).toContain("SELECT media.duration_ms\n  INTO _duration_ms");
  });

  it("creates external-test users with the same current terms acceptance as signup", () => {
    const helpers = read("tests/helpers.ts");
    const messagesRls = read("tests/messages-rls.test.ts");
    const signup = read("src/routes/auth/signup.tsx");

    expect(helpers).toContain('.from("terms_acceptances")');
    expect(helpers).toContain('version: "2026-05-03"');
    expect(messagesRls).toContain('.from("terms_acceptances")');
    expect(messagesRls).toContain('version: "2026-05-03"');
    expect(signup).toContain("CURRENT_TERMS_VERSION");
  });

  it("keeps restricted-word moderation deterministic without production seed data", () => {
    const messagesRls = read("tests/messages-rls.test.ts");
    expect(messagesRls).toContain('restrictedTestWord = "vdn_test_blocked_term"');
    expect(messagesRls).toContain('.from("restricted_words")');
    expect(messagesRls).not.toContain("seu pinto é grande");
  });

  it("waits for Realtime with a bounded deadline instead of a flaky fixed sleep", () => {
    const probe = read("tests/realtime-infrastructure.test.ts");
    const realtime = read("tests/realtime-messages.test.ts");
    expect(probe).toContain("attemptedMarkers");
    expect(probe).toContain("Date.now() < deadline");
    expect(probe).toContain("received.some");
    expect(realtime).toContain("const deadline = Date.now() + 20000");
    expect(realtime).toContain("Date.now() < deadline");
    expect(realtime).toContain("recvC.some");
  });
});
