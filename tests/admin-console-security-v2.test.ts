import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { adminRepositoryBoundaries, parseAdminConsole } from "../src/v2/features/admin/repository";
import { resolveV2FeatureFlags } from "../src/v2/platform/feature-flags";

const migration = readFileSync(
  new URL("../supabase/migrations/20260723000016_v2_admin_console_metrics.sql", import.meta.url),
  "utf8",
);

describe("V2-021 Admin authorization and audit", () => {
  it("keeps the Admin feature flag closed and exact", () => {
    expect(resolveV2FeatureFlags({}).admin).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_ADMIN: "TRUE" }).admin).toBe(false);
    expect(resolveV2FeatureFlags({ VITE_FF_V2_ADMIN: "true" }).admin).toBe(true);
  });

  it("enforces staff roles in the server-side dashboard function", () => {
    expect(migration).toMatch(/public\.has_role\(_uid, 'super_admin'\)/i);
    expect(migration).toMatch(/public\.has_role\(_uid, 'admin'\)/i);
    expect(migration).toMatch(/public\.has_role\(_uid, 'moderador'\)/i);
    expect(migration).toMatch(/public\.has_role\(_uid, 'apresentador'\)/i);
    expect(migration).toMatch(/admin_console_forbidden/i);
  });

  it("requires reason, request id, idempotency and minimal audit digests", () => {
    expect(migration).toMatch(/request_id uuid NOT NULL UNIQUE/i);
    expect(migration).toMatch(/idempotency_key uuid NOT NULL UNIQUE/i);
    expect(migration).toMatch(
      /reason text NOT NULL CHECK \(char_length\(reason\) BETWEEN 8 AND 1000\)/i,
    );
    expect(migration).toMatch(
      /CHECK \(before_digest IS NULL OR before_digest ~ '\^\[0-9a-f\]\{64\}\$'\)/i,
    );
    expect(migration).not.toMatch(/before_payload|after_payload|message_content|session_token/i);
  });

  it("returns actionable health counts instead of private rows or vanity metrics", () => {
    for (const metric of [
      "Cadastros aguardando aprovação",
      "Casos de moderação abertos",
      "Tickets que exigem resposta",
      "Comandos econômicos com falha",
      "Entregas push com falha",
      "Mídias com processamento falho",
    ]) {
      expect(migration).toContain(metric);
    }
    expect(migration).not.toMatch(/jsonb_agg\(/i);
    expect(migration).not.toMatch(
      /'(full_name|email|phone|message_content|raw_balance|session_token)'/i,
    );
  });

  it("does not grant command insertion to the browser", () => {
    expect(migration).toMatch(
      /REVOKE ALL ON TABLE[\s\S]+admin_command_requests_v2[\s\S]+FROM PUBLIC, anon, authenticated/i,
    );
    expect(migration).not.toMatch(/GRANT INSERT ON TABLE[\s\S]+TO authenticated/i);
  });

  it("parses a bounded dashboard contract", () => {
    const parsed = parseAdminConsole({
      server_now: "2026-07-23T12:00:00Z",
      metrics: [
        {
          id: "support-open",
          label: "Tickets",
          value: 4,
          status: "attention",
          action_module: "support",
          users: [{ email: "hidden@example.com" }],
        },
      ],
      recent_audit_count: 3,
      raw_balances: [100],
    });
    expect(parsed.metrics[0]).toEqual({
      id: "support-open",
      label: "Tickets",
      value: 4,
      status: "attention",
      actionModule: "support",
    });
    expect(JSON.stringify(parsed)).not.toMatch(/email|balance/i);
  });

  it("keeps browser boundaries closed", () => {
    expect(adminRepositoryBoundaries).toEqual({
      rawUserRowsExposed: false,
      privateContentExposed: false,
      balancesExposed: false,
      serviceRoleInBrowser: false,
      commandsImplementedInPresentation: false,
    });
  });
});
