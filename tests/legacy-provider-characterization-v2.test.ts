import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const rootRoute = readFileSync(join(projectRoot, "src", "routes", "__root.tsx"), "utf8");
const auth = readFileSync(join(projectRoot, "src", "lib", "auth.tsx"), "utf8");
const presence = readFileSync(join(projectRoot, "src", "lib", "presence.tsx"), "utf8");
const notifications = readFileSync(
  join(projectRoot, "src", "lib", "useRealtimeNotifications.tsx"),
  "utf8",
);
const providerInventory = JSON.parse(
  readFileSync(join(projectRoot, "docs", "reestruturacao-v2", "audit", "providers.json"), "utf8"),
) as {
  mounts: Array<{
    provider: string;
    sourceSignals: {
      fetch: boolean;
      query: boolean;
      rpc: boolean;
      realtime: boolean;
      subscriptions: boolean;
      networkActivity: boolean;
      listeners: boolean;
      timers: boolean;
    };
  }>;
};

describe("legacy provider characterization", () => {
  it("keeps the root provider order explicit", () => {
    const orderedTokens = [
      "<QueryClientProvider",
      "<ThemeProvider>",
      "<AuthProvider>",
      "<V2AwareRouteBoundary",
      "<AuthenticatedProviderBoundary>",
      "<MobileAppShell>",
    ];
    let cursor = -1;
    for (const token of orderedTokens) {
      const next = rootRoute.indexOf(token);
      expect(next, `missing ${token}`).toBeGreaterThan(cursor);
      cursor = next;
    }
  });

  it("mounts private legacy providers only behind the authenticated boundary", () => {
    expect(rootRoute).toContain("shouldMountPrivateProviders(status, !!user)");
    expect(rootRoute).toContain("<PresenceProvider>");
    expect(rootRoute).toContain("<NotificationsBridge />");
    expect(rootRoute).toContain("<BanGuard />");
  });

  it("keeps V2 routes outside legacy private providers", () => {
    expect(rootRoute).toContain("{isV2Route ? <Outlet /> : children}");
  });

  it("characterizes one auth subscription and its cleanup contract", () => {
    expect(auth.match(/onAuthStateChange\(/g)).toHaveLength(1);
    expect(auth).toContain("subscription.unsubscribe()");
    expect(auth).toContain("createAuthSessionCoordinator");
  });

  it("records global presence network and timer costs as legacy to review", () => {
    expect(presence).toContain('.channel("global-presence"');
    expect(presence).toContain('.rpc("touch_my_activity")');
    expect(presence).toContain("60_000");
    expect(presence).toContain("clearInterval");

    const record = providerInventory.mounts.find(
      (provider) => provider.provider === "PresenceProvider",
    );
    expect(record?.sourceSignals).toMatchObject({
      rpc: true,
      realtime: true,
      networkActivity: true,
      timers: true,
    });
  });

  it("records the authenticated notification bridge realtime cost", () => {
    expect(notifications).toMatch(/supabase\s*\.channel\(/);
    expect(notifications).toContain("postgres_changes");
    expect(notifications).toContain("removeChannel");
  });
});
