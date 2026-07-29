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

  it("uses the scaffold only for an authenticated, resolved app home", () => {
    expect(decide("/inicio")).toBe(true);
    expect(decide("/inicio", { loading: true })).toBe(false);
    expect(decide("/inicio", { authenticated: false })).toBe(false);
  });

  it.each(["/perfil", "/conversas/abc", "/admin", "/"])(
    "keeps the legacy path for %s",
    (pathname) => {
      expect(decide(pathname)).toBe(false);
    },
  );

  it("renders mutually exclusive shell branches without redirects or persistence", () => {
    const source = readFileSync(
      "src/components/native-shell/NativeShellRuntimeBoundary.tsx",
      "utf8",
    );

    expect(source).toContain("if (useNativeShell)");
    expect(source).toContain("<NativeShellFrame>");
    expect(source).toContain("<MobileAppShell>");
    expect(source).not.toMatch(/Navigate|redirect|localStorage|sessionStorage|URLSearchParams/);
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
    "V2AwareRouteBoundary",
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

  it("does not introduce a visual V2 shell import", () => {
    expect(root).not.toMatch(/@\/v2\/app-shell|V2AppShell/);
  });
});
