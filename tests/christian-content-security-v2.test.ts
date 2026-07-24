import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveIdentityAccess } from "../src/v2/platform/identity";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase", "migrations", "20260723000013_v2_christian_content_verbo.sql"),
  "utf8",
);
const runtime = readFileSync(
  join(root, "src", "v2", "integration", "V2ShellRuntimeRoute.tsx"),
  "utf8",
);
const registry = readFileSync(join(root, "src", "v2", "integration", "route-registry.ts"), "utf8");
const reader = readFileSync(
  join(root, "src", "v2", "features", "content", "V2VerboReader.tsx"),
  "utf8",
);

describe("V2-018 editorial, privacy and licensing authority", () => {
  it("preflights legacy content without deleting or rewriting it", () => {
    expect(migration).toContain("public.daily_posts");
    expect(migration).toContain("public.prayer_requests");
    expect(migration).toContain("public.bible_quiz_questions");
    expect(migration).not.toMatch(
      /\bDELETE\s+FROM\s+public\.(daily_posts|prayer_requests|bible_quiz_questions)\b/i,
    );
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|COLUMN)\b/i);
    expect(migration).not.toMatch(/\bTRUNCATE\b/i);
  });

  it("requires approved license and editorial status before enabling a source", () => {
    expect(migration).toContain(
      "CHECK (NOT enabled OR (license_status = 'approved' AND editorial_status = 'approved'))",
    );
    expect(migration).toMatch(/version\.enabled[\s\S]*source\.license_status = 'approved'/);
    expect(migration).toContain("copyright_notice text NOT NULL");
  });

  it("keeps notes, bookmarks, studies and progress owner-only", () => {
    expect(migration).toContain("owner manages verbo notes");
    expect(migration).toContain("owner manages verbo bookmarks");
    expect(migration).toContain("owner manages verbo progress");
    expect(migration).toContain("owner manages verbo studies");
    expect(migration.match(/user_id = auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(10);
  });

  it("uses optimistic concurrency for notes and never shares them through the hub", () => {
    expect(migration).toContain("_expected_version");
    expect(migration).toContain("note_conflict");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("version = version + 1");
    expect(migration).not.toContain("community_post_id");
  });

  it("keeps challenges private, explanatory and free of spirituality ranking", () => {
    expect(migration).toContain("explanation text NOT NULL");
    expect(migration).toContain("reference text NOT NULL");
    expect(migration).toContain("Private learning progress; never a public spirituality ranking.");
    expect(migration).not.toMatch(/leaderboard|public_score|faith_rank/i);
  });

  it("mounts Verbo through an exact flag and dedicated capability", () => {
    expect(runtime).toContain('v2FeatureFlags.content && route?.slug === "verbo"');
    expect(registry).toMatch(/slug: "verbo"[\s\S]*requiredDomain: "content"/);
    const identity = resolveIdentityAccess({
      authenticated: true,
      resolution: "ready",
      profile: { status: "approved", deactivatedAt: null, deletionRequestedAt: null },
      terms: null,
    });
    expect(identity.canEnter("content")).toBe(true);
    expect(identity.capabilities).toContain("content:use");
  });

  it("does not use the unlicensed remote Bible API in the V2 reader", () => {
    expect(reader).not.toContain("bible-api.com");
    expect(reader).not.toMatch(/\bfetch\s*\(/);
    expect(reader).toContain("aguardando licença");
  });

  it("keeps conversational AI, offline download and social progress closed by default", () => {
    expect(migration).toContain("'conversational_exploration', false");
    expect(migration).toContain("'offline_download', false");
    expect(migration).toContain("'social_progress', false");
    expect(migration).not.toMatch(/OPENAI|ANTHROPIC|sk-proj/i);
  });
});
