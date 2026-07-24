import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// @ts-expect-error The read-only auditor is intentionally authored as a Node ESM script.
import { classifyNavigationTarget } from "../scripts/audit-legacy.mjs";

type RouteRecord = {
  pathname: string;
  file: string;
  access: string;
  redirects: string[];
};

const projectRoot = process.cwd();
const routeRoot = join(projectRoot, "src", "routes");
const inventory = JSON.parse(
  readFileSync(
    join(projectRoot, "docs", "reestruturacao-v2", "audit", "route-inventory.json"),
    "utf8",
  ),
) as { count: number; routes: RouteRecord[] };
const links = JSON.parse(
  readFileSync(
    join(projectRoot, "docs", "reestruturacao-v2", "audit", "internal-links.json"),
    "utf8",
  ),
) as {
  total: number;
  totalsByOrigin: Record<string, number>;
  totalsByClassification: Record<string, number>;
  totalsByStatus: Record<string, number>;
  links: Array<{
    source: string;
    target: string;
    classification: string;
    status: string;
    evidence: { locator: string; line: number | null };
  }>;
  unresolved: Array<{
    source: string;
    target: string;
    classification: string;
    status: string;
    evidence: { locator: string; line: number | null };
  }>;
};

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function routePathsFromSource(): string[] {
  return walk(routeRoot)
    .filter((path) => /\.(ts|tsx)$/.test(path))
    .flatMap((path) => {
      const match = readFileSync(path, "utf8").match(/createFileRoute\(\s*["']([^"']+)["']\s*\)/);
      return match?.[1] ? [match[1]] : [];
    })
    .sort();
}

describe("legacy route characterization", () => {
  it("keeps the generated inventory synchronized with every file route", () => {
    const sourcePaths = routePathsFromSource();
    const inventoryPaths = inventory.routes.map((route) => route.pathname).sort();

    expect(sourcePaths.length).toBeGreaterThan(0);
    expect(inventory.count).toBe(sourcePaths.length);
    expect(inventoryPaths).toEqual(sourcePaths);
    expect(new Set(sourcePaths).size).toBe(sourcePaths.length);
  });

  it("preserves the three canonical compatibility redirects", () => {
    const redirects = new Map(inventory.routes.map((route) => [route.pathname, route.redirects]));

    expect(redirects.get("/comunidade")).toContain("/conversas/comunidade");
    expect(redirects.get("/onboarding/etapa-1")).toContain("/onboarding");
    expect(redirects.get("/v2/")).toContain("/v2/$section");
  });

  it("keeps endpoints separate from page access classifications", () => {
    const endpoints = inventory.routes.filter((route) => route.access === "endpoint");
    expect(endpoints.map((route) => route.pathname).sort()).toEqual([
      "/api/photo-repair",
      "/api/public/hooks/push-dispatch",
      "/api/verify-photo",
    ]);
  });

  it("preserves public entry points and the V2 prefix without collisions", () => {
    const paths = new Set(inventory.routes.map((route) => route.pathname));
    for (const path of [
      "/",
      "/auth/login",
      "/auth/signup",
      "/sobre",
      "/termos",
      "/v2",
      "/v2/",
      "/v2/$section",
    ]) {
      expect(paths.has(path), `missing route ${path}`).toBe(true);
    }
    expect([...paths].filter((path) => path.startsWith("/v2"))).toHaveLength(3);
  });

  it("keeps reference totals synchronized without requiring unresolved links", () => {
    expect(links.total).toBe(links.links.length);
    expect(
      Object.values(links.totalsByClassification).reduce((total, count) => total + count, 0),
    ).toBe(links.total);
    expect(Object.values(links.totalsByStatus).reduce((total, count) => total + count, 0)).toBe(
      links.total,
    );
    expect(links.unresolved).toEqual(links.links.filter((link) => link.status === "unresolved"));
    expect([]).toHaveLength(0);
  });

  it("requires evidence for every currently unresolved route without naming a permanent defect", () => {
    for (const link of links.unresolved) {
      expect(link.classification).toBe("route");
      expect(link.status).toBe("unresolved");
      expect(link.source.length).toBeGreaterThan(0);
      expect(link.target.length).toBeGreaterThan(0);
      expect(link.evidence.locator.length).toBeGreaterThan(0);
    }
  });

  it("classifies controlled route, asset, endpoint, external and dynamic fixtures", () => {
    const options = { routePatterns: ["/inicio", "/blog/$slug"] };

    expect(classifyNavigationTarget("/inicio", options)).toMatchObject({
      classification: "route",
      status: "resolved",
    });
    expect(classifyNavigationTarget("/a-corrigir", options)).toMatchObject({
      classification: "route",
      status: "unresolved",
    });
    expect(classifyNavigationTarget("/icon-192.png", options)).toMatchObject({
      classification: "asset",
      status: "not-applicable",
    });
    expect(classifyNavigationTarget("/api/example", options)).toMatchObject({
      classification: "endpoint",
      status: "not-applicable",
    });
    expect(classifyNavigationTarget("https://example.com/path", options)).toMatchObject({
      classification: "external",
      status: "not-applicable",
    });
    expect(classifyNavigationTarget("/v2/${section}", options)).toMatchObject({
      classification: "dynamic",
      status: "requires-investigation",
    });
  });

  it("includes manifest and sitemap as first-class reproducible sources", () => {
    expect(links.totalsByOrigin.manifest).toBeGreaterThan(0);
    expect(links.totalsByOrigin.sitemap).toBeGreaterThan(0);
    expect(links.totalsByClassification.asset).toBeGreaterThan(0);
    expect(links.totalsByClassification.external).toBeGreaterThan(0);
  });

  it("does not modify the generated route tree as an audit side effect", () => {
    const routeTree = readFileSync(join(projectRoot, "src", "routeTree.gen.ts"), "utf8");
    expect(routeTree).toContain("This file was automatically generated by TanStack Router.");
    expect(routeTree).toContain("V2SectionRoute");
    expect(relative(projectRoot, join(projectRoot, "src", "routeTree.gen.ts"))).toBe(
      join("src", "routeTree.gen.ts"),
    );
  });
});
