import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260723000008_v2_modular_profiles.sql"),
  "utf8",
);

describe("V2-013 modular profile security boundaries", () => {
  it("filters every visitor through approved identity, blocks and server audiences", () => {
    expect(migration).toContain("v2_community_user_is_approved(_viewer)");
    expect(migration).toContain("v2_community_users_blocked(_viewer, _profile_user_id)");
    expect(migration).toContain("v2_can_view_profile_audience");
    expect(migration).toContain("_audience = 'connections'");
    expect(migration).toContain("_audience = 'private'");
    expect(migration).toMatch(
      /'bio', CASE[\s\S]*visible_modules module WHERE module\.module_type = 'about'/,
    );
    expect(migration).toMatch(
      /'church', CASE[\s\S]*visible_modules module WHERE module\.module_type = 'faith'/,
    );
  });

  it("does not grant direct module-table access to the browser", () => {
    expect(migration).toContain("ALTER TABLE public.profile_modules_v2 ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.profile_modules_v2 FROM anon, authenticated",
    );
    expect(migration).toContain("profile modules owner read");
    const audienceGrant =
      migration.match(
        /GRANT EXECUTE ON FUNCTION public\.v2_can_view_profile_audience\(uuid, text, uuid\)[\s\S]*?;/,
      )?.[0] ?? "";
    expect(audienceGrant).toContain("TO service_role");
    expect(audienceGrant).not.toContain("authenticated");
  });

  it("keeps equipped appearance authoritative to owned inventory", () => {
    expect(migration).toContain("user_profile_backgrounds owned_background");
    expect(migration).toContain("user_decorations owned_frame");
    expect(migration).toContain("user_decorations owned_aura");
    expect(migration).toContain("user_name_gradients owned_gradient");
    expect(migration).toContain("owned_frame.user_id = profile.id");
    expect(migration).toContain("owned_aura.user_id = profile.id");
  });

  it("limits public gallery data to verified photos before aggregation", () => {
    expect(migration).toMatch(/FROM \(\s*SELECT photo\.id[\s\S]*LIMIT 12\s*\) gallery_row/);
    expect(migration).toContain("photo.ai_verified OR _owner");
  });

  it("shows pet data only from the existing pet model and its visibility", () => {
    expect(migration).toContain("FROM public.user_pets_v2 pet");
    expect(migration).toContain("pet.is_equipped");
    expect(migration).toContain("pet.visibility = 'public'");
    expect(migration).not.toMatch(/user_pets_v2[\s\S]*\bDELETE\b/i);
  });

  it("never exposes romantic preferences through the community payload", () => {
    expect(migration).not.toMatch(/dating_preferences|gender_preference|preferred_age/i);
    expect(migration).toMatch(
      /module\.module_type <> 'relationship'[\s\S]*_owner[\s\S]*dating_memberships/,
    );
    expect(migration).toContain("Romantic preferences are never returned.");
  });

  it("uses optimistic concurrency and collision-free final ordering", () => {
    expect(migration).toContain("_current_updated_at IS DISTINCT FROM _expected_updated_at");
    expect(migration).toContain("profile_modules_conflict");
    expect(migration).toContain("SET sort_order = sort_order + 11");
    expect(migration).toContain("item.sort_order NOT BETWEEN 0 AND 10");
    expect(migration).toContain("_module_count NOT IN (10, 11)");
    expect(migration).toContain("max(item.sort_order) <> _module_count - 1");
  });

  it("is additive and creates no operational integration", () => {
    expect(migration).not.toMatch(/\b(DROP TABLE|DROP COLUMN|TRUNCATE)\b/i);
    expect(migration).not.toMatch(/\bcron\.|\bnet\.http|\bservice_role\b.*Bearer/i);
    expect(migration).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
