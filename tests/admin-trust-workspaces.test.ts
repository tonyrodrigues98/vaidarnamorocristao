import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("admin trust and moderation workspaces", () => {
  it("keeps the overview operations in their route-owned data layer", () => {
    const source = read("src/routes/admin/index.tsx");
    for (const contract of [
      "availableTabs",
      "AdminTopNav",
      "RestrictedWordsPanel",
      "FlagsPanel",
      "InterestsPanel",
      "BannedAppealsPanel",
    ]) {
      expect(source).toContain(contract);
    }
  });

  it("preserves private verification review and its five-minute signed URLs", () => {
    const source = read("src/routes/admin/verificacoes.tsx");
    expect(source).toContain('.from("verification_requests")');
    expect(source).toContain("createSignedUrl(path, 60 * 5)");
    expect(source).toContain('"more_info"');
    expect(source).toContain("verified_at:");
    expect(source).toContain("verified_by:");
  });

  it("preserves every photo moderation workspace and one-hour signed URLs", () => {
    const source = read("src/routes/admin/fotos.tsx");
    for (const tab of ['"queue"', '"history"', '"settings"', '"repairs"']) {
      expect(source).toContain(tab);
    }
    expect(source).toContain("createSignedUrl(it.storage_path, 60 * 60)");
    expect(source).toContain('issue: "heic_heif_salvo"');
    expect(source).toContain('fetch("/api/photo-repair"');
  });

  it("keeps the shared presentation primitive backend-free", () => {
    const source = read("src/components/admin-shell/AdminPage.tsx");
    expect(read("src/components/admin-shell/AdminShellContent.tsx")).toContain("AdminPage");
    expect(source).not.toMatch(/supabase|\.from\(|\.rpc\(|\.channel\(|@\/v2/);
  });
});
