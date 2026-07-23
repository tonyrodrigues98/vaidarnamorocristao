import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// @ts-expect-error The read-only auditor is intentionally authored as a Node ESM script.
import {
  classifyNotificationNavigationPolicy,
  classifyPetCacheIdentity,
} from "../scripts/audit-legacy.mjs";

const projectRoot = process.cwd();
const serviceWorker = readFileSync(join(projectRoot, "public", "sw.js"), "utf8");
const manifest = JSON.parse(
  readFileSync(join(projectRoot, "public", "manifest.webmanifest"), "utf8"),
) as {
  start_url: string;
  shortcuts: Array<{ url: string }>;
};
const routeInventory = JSON.parse(
  readFileSync(
    join(projectRoot, "docs", "reestruturacao-v2", "audit", "route-inventory.json"),
    "utf8",
  ),
) as { routes: Array<{ pathname: string }> };

function routeExists(pathname: string): boolean {
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname : `${pathname}/`;
  return routeInventory.routes.some(
    (route) =>
      route.pathname === pathname ||
      route.pathname === normalized ||
      route.pathname.startsWith(`${pathname}/$`),
  );
}

describe("legacy PWA characterization", () => {
  it("keeps manifest entry points resolvable by the current route tree", () => {
    expect(routeExists(manifest.start_url)).toBe(true);
    for (const shortcut of manifest.shortcuts) {
      expect(routeExists(shortcut.url), shortcut.url).toBe(true);
    }
  });

  it("uses network-first navigation with an offline document fallback", () => {
    expect(serviceWorker).toContain('request.mode === "navigate"');
    expect(serviceWorker).toContain('fetch(request).catch(() => caches.match("/offline.html"))');
  });

  it("does not precache authenticated HTML pages", () => {
    const staticAssetsMatch = serviceWorker.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/);
    expect(staticAssetsMatch?.[1]).toBeDefined();
    expect(staticAssetsMatch?.[1]).not.toMatch(
      /\/(admin|conversas|perfil|pretendentes|v2)(?:["'/])/,
    );
  });

  it("detects unsafe and partitioned authenticated pet cache fixtures", () => {
    const unsafeFixture = `
      if (/(sign|public|authenticated)\\/pets\\//.test(url.pathname)) {
        return caches.match(new Request(url.origin + url.pathname));
      }
    `;
    const partitionedFixture = `
      if (/(sign|public|authenticated)\\/pets\\//.test(url.pathname)) {
        const cachePartition = userId;
        return caches.match(new Request(url.origin + "/" + cachePartition + url.pathname));
      }
    `;

    expect(classifyPetCacheIdentity(unsafeFixture)).toBe("risk-unpartitioned");
    expect(classifyPetCacheIdentity(partitionedFixture)).toBe("partitioned");
    expect(classifyPetCacheIdentity("caches.match('/icon-192.png')")).toBe("not-applicable");
  });

  it("detects unsafe and same-origin notification navigation fixtures", () => {
    const unsafeFixture = `
      const url = new URL(targetUrl, self.location.origin);
      clients.openWindow(url.href);
    `;
    const safeFixture = `
      const url = new URL(targetUrl, self.location.origin);
      if (url.origin !== self.location.origin) return;
      clients.openWindow(url.href);
    `;

    expect(classifyNotificationNavigationPolicy(unsafeFixture)).toBe("risk-no-same-origin-policy");
    expect(classifyNotificationNavigationPolicy(safeFixture)).toBe("same-origin-enforced");
    expect(classifyNotificationNavigationPolicy("clients.focus()")).toBe("not-applicable");
  });
});
