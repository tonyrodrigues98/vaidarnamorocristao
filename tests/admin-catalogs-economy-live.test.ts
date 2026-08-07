import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { adminDestinations } from "../src/config/admin-destinations";

const read = (file: string) => readFileSync(file, "utf8");

describe("admin catalogs, economy, pets and live contracts", () => {
  it("keeps all ten specialist routes in the role-aware registry", () => {
    const paths = new Set(adminDestinations.map((item) => item.path));
    for (const path of [
      "/admin/presentes",
      "/admin/stickers",
      "/admin/fundos",
      "/admin/molduras",
      "/admin/auras",
      "/admin/gradientes-nome",
      "/admin/avatar",
      "/admin/pets",
      "/admin/economia",
      "/admin/equipe-live",
    ]) {
      expect(paths.has(path)).toBe(true);
    }
  });

  it("preserves avatar catalog storage and its five-megabyte limit", () => {
    const source = read("src/routes/admin/avatar.tsx");
    expect(source).toContain('supabase.from("avatar_categories")');
    expect(source).toContain('supabase.from("avatar_items")');
    expect(source).toContain('storage.from("avatar-items")');
    expect(source).toContain("5 * 1024 * 1024");
  });

  it("preserves gifts, stickers and visual catalog ownership", () => {
    expect(read("src/routes/admin/presentes.tsx")).toContain('.from("gift-images")');
    expect(read("src/routes/admin/stickers.tsx")).toContain('.from("stickers")');
    expect(read("src/routes/admin/fundos.tsx")).toContain("AdminFundosPage");
    expect(read("src/routes/admin/molduras.tsx")).toContain("DecorationAdminPage");
    expect(read("src/routes/admin/auras.tsx")).toContain("DecorationAdminPage");
    expect(read("src/routes/admin/gradientes-nome.tsx")).toContain("NameGradientsAdminPage");
  });

  it("preserves pet, economy and live domain owners", () => {
    expect(read("src/routes/admin/pets.tsx")).toContain("PetsAdmin");
    expect(read("src/routes/admin/economia.tsx")).toContain("admin_economy_summary");
    expect(read("src/routes/admin/equipe-live.tsx")).toContain("LiveTeamAdminPage");
  });

  it("keeps the admin shell free of catalog backend access", () => {
    for (const file of ["AdminShellFrame.tsx", "AdminPage.tsx", "AdminShellContent.tsx"]) {
      expect(read(`src/components/admin-shell/${file}`)).not.toMatch(
        /supabase|\.from\(|\.rpc\(|\.channel\(/,
      );
    }
  });
});
