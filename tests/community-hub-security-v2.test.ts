import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260723000006_v2_community_spaces_events.sql"),
  "utf8",
);
const repository = fs.readFileSync(
  path.join(root, "src/v2/features/community/repository.ts"),
  "utf8",
);

describe("V2-011 community security boundaries", () => {
  it("owns memberships locally without owning dating, balances or sanctions", () => {
    expect(migration).toContain("community_space_members");
    expect(migration).not.toMatch(/\b(matches|interests|dating_memberships)\b/);
    expect(migration).not.toMatch(/\b(user_coins|coin_transactions|inventory)\b/);
  });

  it("keeps all mutations behind authenticated server-authoritative RPCs", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("REVOKE ALL ON TABLE public.community_spaces");
    expect(migration).toContain("request_community_space_membership");
    expect(migration).toContain("respond_community_space_membership");
    expect(migration).toContain("set_community_event_attendance");
    expect(migration).toContain("GRANT EXECUTE");
  });

  it("applies global blocking to discovery, messages and presence", () => {
    expect(migration.match(/v2_community_users_blocked/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration).toContain("gm.sender_id");
    expect(migration).toContain("presence_last_seen");
  });

  it("uses explicit local roles and never treats visual labels as authorization", () => {
    expect(migration).toContain("role IN ('owner', 'moderator')");
    expect(migration).toContain("v2_can_manage_community_space");
    expect(migration).toContain("community_space_audit_log");
  });

  it("preserves global_messages and adds only a controlled adapter", () => {
    expect(migration).toContain("INSERT INTO public.global_messages");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("TRUNCATE");
    expect(repository).toContain('table: "global_messages"');
    expect(repository).toContain("removeChannel");
  });

  it("does not expose privileged credentials or create browser authority", () => {
    expect(repository).not.toContain("service_role");
    expect(repository).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(repository).not.toContain("VITE_");
    expect(repository).not.toContain("getSession");
  });
});
