import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260723000007_v2_conversation_core.sql"),
  "utf8",
);
const repository = fs.readFileSync(
  path.join(root, "src/v2/features/conversations/repository.ts"),
  "utf8",
);

describe("V2-012 conversation security boundaries", () => {
  it("keeps romantic threads server-gated by active dating membership", () => {
    expect(migration).toContain("v2_dating_messages_enabled");
    expect(migration).toContain("v2_can_access_legacy_match");
    expect(migration).toMatch(/dating_memberships membership[\s\S]*membership\.status = 'active'/);
    expect(migration).toMatch(/legacy_romantic[\s\S]*v2_can_access_legacy_match/);
    expect(migration).toContain("membership.status = 'paused_by_commitment'");
    expect(migration).toContain("commitment.status = 'active'");
  });

  it("keeps social requests independent from matches", () => {
    const requestFunction = migration.slice(
      migration.indexOf("create_social_conversation_request_v2"),
      migration.indexOf("respond_conversation_request_v2"),
    );
    expect(requestFunction).toContain("community_privacy_settings");
    expect(requestFunction).toContain("social_relationships");
    expect(requestFunction).not.toContain("public.matches");
    expect(requestFunction).not.toContain("dating_memberships");
  });

  it("makes retries idempotent across canonical and legacy stores", () => {
    expect(migration).toContain("client_message_id uuid");
    expect(migration).toContain("messages_sender_client_message_unique");
    expect(migration).toContain("global_messages_sender_client_message_unique");
    expect(
      migration.match(/ON CONFLICT \(sender_id, client_message_id\)/g)?.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("does not use the non-idempotent legacy global send adapter", () => {
    const sendFunction = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.send_conversation_message_v2"),
      migration.indexOf("CREATE OR REPLACE FUNCTION public.mark_conversation_read_v2"),
    );
    expect(sendFunction).not.toContain("send_community_global_message_v2");
    expect(sendFunction).toContain("_recent_count >= 8");
  });

  it("uses stable cursor ordering for every supported message source", () => {
    expect(
      migration.match(/ORDER BY message\.created_at DESC, message\.id DESC/g)?.length,
    ).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("(message.created_at, message.id) <");
    expect(migration).toContain("'nextCursor'");
  });

  it("keeps canonical tables behind RLS and authenticated RPCs", () => {
    expect(migration.match(/ENABLE ROW LEVEL SECURITY/g)?.length).toBeGreaterThanOrEqual(6);
    expect(migration).toContain("REVOKE ALL ON TABLE public.conversation_messages_v2");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.send_conversation_message_v2");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.respond_conversation_request_v2");
  });

  it("keeps attachments private and participant-scoped", () => {
    expect(migration).toMatch(/'conversation-attachments',\s*'conversation-attachments',\s*false/);
    expect(migration).toContain("conversation attachments participant read");
    expect(migration).toContain("v2_is_conversation_participant");
  });

  it("is additive and does not create operational jobs", () => {
    expect(migration).not.toMatch(/\b(DROP TABLE|TRUNCATE|DROP COLUMN)\b/i);
    expect(migration).not.toMatch(/\bcron\./i);
    expect(migration).not.toMatch(/\bnet\.http/i);
  });

  it("does not expose privileged browser credentials", () => {
    expect(repository).not.toMatch(/service_role|SUPABASE_SERVICE_ROLE_KEY|PUSH_DISPATCH_SECRET/);
    expect(repository).not.toContain("getSession");
    expect(repository).not.toContain("access_token");
  });
});
