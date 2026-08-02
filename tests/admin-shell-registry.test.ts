import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  adminDestinations,
  canRoleAccessAdminDestination,
  getAdminDestination,
  getAdminNavigationForRole,
  isAdminShellRole,
} from "../src/config/admin-destinations";

describe("role-aware admin shell registry", () => {
  it("registers exactly 13 unique exact destinations", () => {
    expect(adminDestinations).toHaveLength(13);
    expect(new Set(adminDestinations.map((item) => item.id)).size).toBe(13);
    expect(new Set(adminDestinations.map((item) => item.path)).size).toBe(13);
    expect(adminDestinations.every((item) => item.match === "exact")).toBe(true);
  });

  it("matches normalized routes without capturing unknown admin paths", () => {
    expect(getAdminDestination("/admin/")?.id).toBe("admin-overview");
    expect(getAdminDestination("/admin/verificacoes")?.title).toBe("Verificações");
    expect(getAdminDestination("/admin/desconhecido")).toBeUndefined();
  });

  it("mirrors the current role guards without widening specialist tools", () => {
    expect(getAdminNavigationForRole("user")).toEqual([]);
    expect(getAdminNavigationForRole("moderador").map((item) => item.id)).toEqual([
      "admin-overview",
      "admin-gifts",
    ]);
    expect(getAdminNavigationForRole("apresentador").map((item) => item.id)).toEqual([
      "admin-overview",
      "admin-gifts",
    ]);
    expect(getAdminNavigationForRole("admin").some((item) => item.id === "admin-avatar")).toBe(
      false,
    );
    expect(getAdminNavigationForRole("super_admin")).toHaveLength(13);
    expect(isAdminShellRole("user")).toBe(false);
  });

  it("keeps direct guards authoritative", () => {
    const avatar = getAdminDestination("/admin/avatar")!;
    expect(canRoleAccessAdminDestination("super_admin", avatar)).toBe(true);
    expect(canRoleAccessAdminDestination("admin", avatar)).toBe(false);
  });

  it("keeps shell components free from backend and V2 visual imports", () => {
    for (const file of [
      "AdminShellRuntimeContext.tsx",
      "AdminShellRuntimeBoundary.tsx",
      "AdminShellFrame.tsx",
      "AdminSidebar.tsx",
      "AdminTopBar.tsx",
      "AdminMobileDrawer.tsx",
      "AdminShellContent.tsx",
    ]) {
      const source = readFileSync(`src/components/admin-shell/${file}`, "utf8");
      expect(source).not.toMatch(/supabase|\.from\(|\.rpc\(|\.channel\(|@\/v2/);
    }
  });

  it("suppresses legacy chrome before its hooks mount", () => {
    const header = readFileSync("src/components/layout/Header.tsx", "utf8");
    const topNav = readFileSync("src/components/admin/AdminTopNav.tsx", "utf8");
    expect(header).toContain("nativeActive || adminActive");
    expect(topNav).toContain("if (active) return null");
    expect(topNav).toContain("LegacyAdminTopNav");
  });

  it("provides responsive shell chrome without user bottom navigation", () => {
    const css = readFileSync("src/styles/admin-shell.css", "utf8");
    expect(css).toContain("--vdn-admin-rail: 72px");
    expect(css).toContain("--vdn-admin-sidebar: 272px");
    expect(css).toContain("[data-vdn-admin-shell]");
    expect(css).not.toMatch(/(^|\s)(html|body|:root|\.dark)(?=[\s,{])/m);
    expect(readFileSync("src/components/admin-shell/AdminShellFrame.tsx", "utf8")).not.toContain(
      "NativeBottomNavigation",
    );
  });
});
