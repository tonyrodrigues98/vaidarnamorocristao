import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260723000005_v2_social_home_links_status.sql", import.meta.url),
  "utf8",
);

describe("V2-010 social and Status security contract", () => {
  it("keeps community relationships independent from romantic matches", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.social_relationships");
    expect(migration).toContain("This table never uses matches");
    expect(migration).not.toMatch(/REFERENCES\s+public\.matches/i);
  });

  it("enforces bidirectional global blocks before audience access", () => {
    expect(migration).toContain("public.v2_community_users_blocked(_owner_id, _viewer_id)");
    expect(migration).toContain("(b.blocker_id = _left AND b.blocked_id = _right)");
    expect(migration).toContain("(b.blocker_id = _right AND b.blocked_id = _left)");
  });

  it("limits relationship requests server-side", () => {
    expect(migration).toContain("requested_at >= now() - interval '24 hours'");
    expect(migration).toContain("IF _daily_count >= 20");
    expect(migration).toContain("relationship_rate_limited");
  });

  it("makes feed pagination deterministic", () => {
    expect(migration).toContain("ORDER BY p.created_at DESC, p.id DESC");
    expect(migration).toContain("(p.created_at, p.id) < (_cursor_created_at, _cursor_id)");
    expect(migration).toContain("_page_size integer");
  });

  it("caps Status lifetime and hides incomplete uploads", () => {
    expect(migration).toContain("expires_at <= created_at + interval '24 hours'");
    expect(migration).toContain("expires_at > now()");
    expect(migration).toContain("upload_pending = false");
  });

  it("keeps Status media private and audience-aware", () => {
    expect(migration).toMatch(/'community-status-media',\s*'community-status-media',\s*false,/s);
    expect(migration).toContain('CREATE POLICY "community status media audience read"');
    expect(migration).toContain("public.v2_can_view_community_audience");
  });

  it("revokes direct anonymous access and exposes only authenticated commands", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.publish_community_post(text, text) FROM PUBLIC, anon",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.publish_community_status(text, text, boolean) TO authenticated",
    );
    expect(migration).not.toMatch(
      /GRANT\s+(INSERT|UPDATE|DELETE).+community_posts.+authenticated/i,
    );
  });

  it("does not execute a cleanup job or mutate legacy posts", () => {
    expect(migration).not.toMatch(/cron\.(schedule|alter_job)/i);
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.daily_posts/i);
    expect(migration).not.toMatch(/DROP\s+TABLE/i);
  });
});
