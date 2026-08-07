import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import { shouldRenderNativeShell } from "../src/config/native-shell-feature";

function decide(
  pathname: string,
  {
    featureEnabled = true,
    loading = false,
    authenticated = true,
  }: Partial<{
    featureEnabled: boolean;
    loading: boolean;
    authenticated: boolean;
  }> = {},
) {
  return shouldRenderNativeShell({
    featureEnabled,
    behavior: getDestinationBehavior(pathname),
    loading,
    authenticated,
  });
}

describe("NativeShellRuntimeBoundary decision", () => {
  it("keeps the legacy shell when the flag is off", () => {
    expect(decide("/inicio", { featureEnabled: false })).toBe(false);
  });

  it.each(["/inicio", "/comunidade", "/explorar", "/conversas", "/perfil"])(
    "uses the scaffold for authenticated primary root %s",
    (pathname) => {
      expect(decide(pathname)).toBe(true);
      expect(decide(pathname, { featureEnabled: false })).toBe(false);
      expect(decide(pathname, { loading: true })).toBe(false);
      expect(decide(pathname, { authenticated: false })).toBe(false);
    },
  );

  it("uses the contextual native shell for authenticated account settings", () => {
    expect(decide("/conta")).toBe(true);
    expect(decide("/conta", { featureEnabled: false })).toBe(false);
    expect(getDestinationBehavior("/conta").futureTab).toBe("profile");
  });

  it.each([
    "/conversas/abc",
    "/conversas/comunidade",
    "/admin",
    "/",
    "/api/public/runtime-config",
    "/rota-inexistente",
  ])("keeps the legacy path for %s", (pathname) => {
    expect(decide(pathname)).toBe(false);
  });

  it.each(["/pretendentes", "/pretendentes/teste", "/interesses", "/matches", "/recados"])(
    "uses the contextual native shell for dating destination %s",
    (pathname) => {
      expect(decide(pathname)).toBe(true);
      expect(decide(pathname, { featureEnabled: false })).toBe(false);
    },
  );

  it("renders mutually exclusive shell branches without redirects or persistence", () => {
    const source = readFileSync(
      "src/components/native-shell/NativeShellRuntimeBoundary.tsx",
      "utf8",
    );

    expect(source).toContain("if (useNativeShell && activeTab)");
    expect(source).toContain("<NativeShellFrame");
    expect(source).toContain("<NativeShellRuntimeProvider active activeTab={activeTab}>");
    expect(source).toContain("<NativeAdaptiveNavigation");
    expect(source).toContain("<NativeTopBar");
    expect(source).toContain("<NativeBottomNavigation");
    expect(source).toContain("<MobileAppShell>");
    expect(source).not.toMatch(/Navigate|redirect|localStorage|sessionStorage|URLSearchParams/);
  });

  it("provides both adaptive and bottom navigation only in the native branch", () => {
    const source = readFileSync(
      "src/components/native-shell/NativeShellRuntimeBoundary.tsx",
      "utf8",
    );
    const nativeBranch = source.slice(
      source.indexOf("if (useNativeShell && activeTab)"),
      source.indexOf("return <MobileAppShell>"),
    );
    const legacyBranch = source.slice(source.indexOf("return <MobileAppShell>"));

    expect(nativeBranch).toContain("primaryNavigation=");
    expect(nativeBranch).toContain("topBar=");
    expect(nativeBranch).toContain("bottomNavigation=");
    expect(legacyBranch).not.toContain("NativeAdaptiveNavigation");
    expect(legacyBranch).not.toContain("NativeBottomNavigation");
    expect(legacyBranch).not.toContain("NativeTopBar");
  });

  it("centralizes viewport listeners and derives the user label without a query", () => {
    const source = readFileSync(
      "src/components/native-shell/NativeShellRuntimeBoundary.tsx",
      "utf8",
    );

    expect(source.match(/useNativeViewportState\(/g)).toHaveLength(1);
    expect(source).toContain("user?.email ?? user?.id ??");
    expect(source).not.toMatch(
      /visualViewport|addEventListener|requestAnimationFrame|supabase|\.from\(|\.channel\(/,
    );
  });
});

describe("root integration contract", () => {
  const root = readFileSync("src/routes/__root.tsx", "utf8");

  it("mounts one native boundary in the former MobileAppShell position", () => {
    expect(root.match(/<NativeShellRuntimeBoundary>/g)).toHaveLength(1);
    expect(root.match(/<\/NativeShellRuntimeBoundary>/g)).toHaveLength(1);
    expect(root).not.toContain("<MobileAppShell>");
  });

  it.each([
    "QueryClientProvider",
    "ThemeProvider",
    "SupabaseRuntimeBoundary",
    "AuthProvider",
    "RouteAwareBoundary",
    "AuthenticatedProviderBoundary",
    "PresenceProvider",
    "NotificationsBridge",
    "BanGuard",
    "Toaster",
    "NetworkStatusBanner",
    "InstallPromptBanner",
    "RouteProtectionBoundary",
  ])("preserves provider or runtime contract %s", (contract) => {
    expect(root).toContain(contract);
  });

  it("does not introduce a retired shell import", () => {
    expect(root).not.toMatch(/@\/app-shell|AppShellRuntime/);
  });
});
