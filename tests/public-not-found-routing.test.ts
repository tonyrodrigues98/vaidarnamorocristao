import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { isGlobalRouterNotFound } from "../src/config/router-not-found";
import { classifyRoute } from "../src/v2/app/routing/route-access";

describe("public global not-found handling", () => {
  it("distinguishes a genuinely unmatched URL from valid route matches", () => {
    expect(isGlobalRouterNotFound([{ globalNotFound: true }])).toBe(true);
    expect(isGlobalRouterNotFound([{ globalNotFound: false }, {}])).toBe(false);
  });

  it("does not weaken valid protected or dynamic route classification", () => {
    expect(classifyRoute("/inicio")).toBe("authenticated");
    expect(classifyRoute("/admin/presentes")).toBe("administrative");
    expect(classifyRoute("/conversas/desconhecido")).toBe("authenticated");
    expect(classifyRoute("/pretendentes/desconhecido")).toBe("authenticated");
    expect(classifyRoute("/blog/desconhecido")).toBe("public");
    expect(classifyRoute("/v2/desconhecido")).toBe("authenticated");
    expect(classifyRoute("/api/desconhecido")).toBe("server-endpoint");
  });

  it("renders the root 404 outside private runtime and authorization boundaries", () => {
    const root = readFileSync("src/routes/__root.tsx", "utf8");
    expect(root).toContain("select: (state) => isGlobalRouterNotFound(state.matches)");
    expect(root).toMatch(/globalNotFound\s*\?\s*\(\s*<Outlet\s*\/>/);
    expect(root).toContain("<SupabaseRuntimeBoundary>");
    expect(root).toContain("<RouteProtectionBoundary>");
    expect(root).toContain("<AdminRouteAccessBoundary>");
  });

  it("keeps a branded Portuguese PublicShell 404 with accessible actions", () => {
    const root = readFileSync("src/routes/__root.tsx", "utf8");
    expect(root).toContain("<PublicShell>");
    expect(root).toContain("brand.assets.icon192");
    expect(root).toContain("Página não encontrada");
    expect(root).toContain("Voltar ao início");
    expect(root).toContain('to="/auth/login"');
    expect(root).toContain("min-h-11");
    expect(root).not.toContain("Page not found");
  });
});
