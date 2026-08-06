import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  adminDestinations,
  canRoleAccessAdminDestination,
  getAdminDestination,
  getAdminNavigationForRole,
} from "../src/config/admin-destinations";
import { getAdminReturnTo, resolveAdminRouteAccess } from "../src/config/admin-route-access";
import type { AppRole } from "../src/lib/roles";

const roles: AppRole[] = ["user", "moderador", "apresentador", "admin", "super_admin"];

describe("route-level administrative authorization", () => {
  it("uses the same role matrix for direct access and navigation", () => {
    for (const destination of adminDestinations) {
      for (const role of roles) {
        const direct = resolveAdminRouteAccess({
          destination,
          status: "authenticated",
          rolesLoaded: true,
          role,
        });
        const declared = canRoleAccessAdminDestination(role, destination);
        const visible = getAdminNavigationForRole(role).includes(destination);
        expect(direct === "mount").toBe(declared);
        expect(visible).toBe(declared);
      }
    }
  });

  it("waits for auth and roles without mounting protected children", () => {
    const destination = getAdminDestination("/admin")!;
    expect(
      resolveAdminRouteAccess({
        destination,
        status: "initializing",
        rolesLoaded: false,
        role: "user",
      }),
    ).toBe("wait");
    expect(
      resolveAdminRouteAccess({
        destination,
        status: "authenticated",
        rolesLoaded: false,
        role: "super_admin",
      }),
    ).toBe("wait");
  });

  it("redirects visitors and restricts unknown or unauthorized direct URLs", () => {
    const destination = getAdminDestination("/admin/economia")!;
    expect(
      resolveAdminRouteAccess({
        destination,
        status: "unauthenticated",
        rolesLoaded: true,
        role: "user",
      }),
    ).toBe("redirect-login");
    expect(
      resolveAdminRouteAccess({
        destination,
        status: "authenticated",
        rolesLoaded: true,
        role: "user",
      }),
    ).toBe("restricted");
    expect(
      resolveAdminRouteAccess({
        destination: undefined,
        status: "authenticated",
        rolesLoaded: true,
        role: "super_admin",
      }),
    ).toBe("restricted");
  });

  it("normalizes trailing slashes and preserves safe query/hash returnTo", () => {
    expect(getAdminDestination("/admin/fotos/")?.id).toBe("admin-photos");
    expect(getAdminReturnTo("/admin/fotos", "?tab=queue", "#item")).toBe(
      "/admin/fotos?tab=queue#item",
    );
    expect(getAdminReturnTo("//evil.example", "", "")).toBe("/inicio");
  });

  it("restricts gift administration to the roles authorized by RLS", () => {
    const gifts = getAdminDestination("/admin/presentes")!;
    expect(gifts.allowedRoles).toEqual(["super_admin", "admin"]);
    expect(canRoleAccessAdminDestination("moderador", gifts)).toBe(false);
    expect(canRoleAccessAdminDestination("apresentador", gifts)).toBe(false);
  });

  it("registers every generated admin route exactly once", () => {
    const routeTree = readFileSync("src/routeTree.gen.ts", "utf8");
    const generated = [...routeTree.matchAll(/fullPath: '([^']+)'/g)]
      .map((match) => match[1].replace(/\/$/, ""))
      .filter((path) => path === "/admin" || path.startsWith("/admin/"));
    expect(new Set(generated)).toEqual(new Set(adminDestinations.map((item) => item.path)));
  });

  it("keeps the boundary independent of feature flags and backend clients", () => {
    const source = readFileSync("src/components/admin-shell/AdminRouteAccessBoundary.tsx", "utf8");
    expect(source).not.toMatch(
      /VITE_FF_NATIVE_SHELL|nativeShellFeature|supabase|\.from\(|\.rpc\(|\.channel\(/,
    );
    expect(source).toContain("replace");
    expect(source).toContain("Acesso restrito");
  });
});
