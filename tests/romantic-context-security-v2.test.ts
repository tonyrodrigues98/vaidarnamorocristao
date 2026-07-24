import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase", "migrations", "20260723000010_v2_purpose_anonymous_contextual_gifts.sql"),
  "utf8",
);
const runtime = readFileSync(
  join(root, "src", "v2", "integration", "V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const registry = readFileSync(join(root, "src", "v2", "integration", "route-registry.ts"), "utf8");

describe("V2-015 server-authoritative romantic contexts", () => {
  it("uses an explicit, append-only purpose state machine", () => {
    expect(migration).toContain("_action NOT IN ('accept', 'reject', 'cancel', 'end', 'archive')");
    expect(migration).toContain("relationship_commitment_events_v2");
    expect(migration).toContain("_event_type := 'accepted'");
    expect(migration).toContain("_event_type := 'archived'");
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bTRUNCATE\b/i);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
  });

  it("serializes purpose requests, verifies both participants and makes them idempotent", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("relationship_commitments_request_key_v2");
    expect(migration).toContain("request_idempotency_key = _idempotency_key");
    expect(migration).toContain("v2_dating_users_eligible(_uid, _partner)");
    expect(migration).toContain("_commitment.requested_by = _uid");
  });

  it("pauses only dating when accepted and never reactivates it when ended", () => {
    const acceptBlock = migration.slice(
      migration.indexOf("IF _action = 'accept'"),
      migration.indexOf("ELSIF _action IN ('reject', 'cancel')"),
    );
    const endBlock =
      migration.match(
        /ELSIF _action = 'end' THEN([\s\S]*?)\n {2}ELSE\n {4}IF _commitment\.status <> 'ended'/,
      )?.[1] ?? "";
    expect(acceptBlock).toContain("UPDATE public.dating_memberships");
    expect(acceptBlock).toContain("status = 'paused_by_commitment'");
    expect(acceptBlock).not.toMatch(/community|messages\s+SET|profiles\s+SET/i);
    expect(endBlock).not.toContain("UPDATE public.dating_memberships");
    expect(endBlock).toContain("do not reactivate dating_memberships");
  });

  it("makes anonymous participation strict opt-in for active dating members", () => {
    expect(migration).toContain("membership.status = 'active'");
    expect(migration).toContain("membership.receive_anonymous");
    expect(migration).toContain("setting.accept_anonymous");
    expect(migration).toContain("coalesce(setting.accept_anonymous, false)");
    expect(migration).toContain("VALUES (_uid, _accept, now())");
    expect(migration).toContain("ALTER COLUMN accept_anonymous SET DEFAULT false");
    expect(migration).not.toMatch(/coalesce\(setting\.accept_anonymous,\s*true\)/i);
  });

  it("keeps legacy antispam, moderation, hints and history behind stricter wrappers", () => {
    expect(migration).toContain("public.send_anonymous_message(_receiver_id, _content)");
    expect(migration).toContain("public.anon_check_restricted");
    expect(migration).toContain("public.request_anonymous_hint(_message_id)");
    expect(migration).toContain("public.send_anonymous_hint_text");
    expect(migration).toContain("hint_count");
    expect(migration).toContain("public.report_anonymous_message");
  });

  it("requires bilateral eligibility before anonymous identity can be revealed", () => {
    const revealBlock = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.request_anonymous_reveal_v2"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.ignore_anonymous_message_v2"),
    );
    expect(revealBlock).toContain(
      "v2_dating_users_eligible(_message.sender_id, _message.receiver_id)",
    );
    expect(revealBlock).toContain(
      "v2_dating_users_eligible(_message.receiver_id, _message.sender_id)",
    );
    expect(revealBlock).toContain("public.request_anonymous_reveal(_message_id)");
  });

  it("wraps the existing gift economy with context and request idempotency", () => {
    expect(migration).toContain("contextual_gift_commands_v2");
    expect(migration).toContain("PRIMARY KEY (sender_id, idempotency_key)");
    expect(migration).toContain("public.send_virtual_gift(_receiver_id, _gift_id, _message)");
    expect(migration).toContain("command.context_ref_id IS NOT DISTINCT FROM _context_ref_id");
    expect(migration).toContain("commitment.status = 'active'");
    expect(migration).toContain("public.v2_community_users_blocked(_uid, _receiver_id)");
  });

  it("does not blindly reclassify historical gifts or expose anonymous entry points", () => {
    expect(migration).not.toMatch(
      /UPDATE\s+public\.gift_transactions[\s\S]{0,180}WHERE\s+context\s+IS\s+NULL/i,
    );
    expect(migration).not.toMatch(/GRANT EXECUTE[\s\S]{0,180}\bTO anon\b/);
    expect(migration).toContain("REVOKE ALL ON TABLE public.contextual_gift_commands_v2");
  });

  it("mounts purpose and notes only through the dating capability and canonical flag", () => {
    expect(runtime).toContain("v2FeatureFlags.dating");
    expect(runtime).toContain("<V2RomanticContextFeature");
    expect(registry).toMatch(/slug: "proposito"[\s\S]*requiredDomain: "dating"/);
    expect(registry).toMatch(/slug: "recados"[\s\S]*requiredDomain: "dating"/);
    expect(runtime).not.toContain("service_role");
  });
});
