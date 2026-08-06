import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getDestinationBehavior } from "../src/config/app-destinations";
import {
  getNativeSecondaryDestinationChrome,
  nativeSecondaryDestinations,
} from "../src/config/native-secondary-destinations";
import { getNativeDestinationTitle } from "../src/config/native-top-bar";

describe("native account center", () => {
  it("inherits Profile without adding a primary destination", () => {
    const behavior = getDestinationBehavior("/conta");
    const chrome = getNativeSecondaryDestinationChrome(behavior.destinationId);

    expect(behavior.futureTab).toBe("profile");
    expect(chrome).toEqual({
      destinationId: "app-account",
      title: "Configurações",
      parentTab: "profile",
      parentPath: "/perfil",
    });
    expect(getNativeDestinationTitle(behavior.destinationId, "profile")).toBe("Configurações");
    expect(nativeSecondaryDestinations).toContainEqual(chrome);
  });

  it("keeps state and effects in ContaPage and the native view presentational", () => {
    const route = readFileSync("src/routes/conta.tsx", "utf8");
    const view = readFileSync("src/components/settings/native/NativeAccountView.tsx", "utf8");

    expect(route.match(/useAuth\(\)/g)).toHaveLength(1);
    expect(route.match(/useTheme\(\)/g)).toHaveLength(1);
    expect(route.match(/useNetworkStatus\(\)/g)).toHaveLength(1);
    expect(route).toContain("nativeShellActive");
    expect(route).toContain("<NativeAccountView");
    expect(route.match(/<AccountDangerZone \/>/g)).toHaveLength(1);
    expect(view).not.toMatch(/supabase|useAuth|useTheme|useNetworkStatus|\.from\(|\.rpc\(/);
  });

  it("preserves real settings actions and staff-only administration", () => {
    const view = readFileSync("src/components/settings/native/NativeAccountView.tsx", "utf8");

    for (const path of [
      "/perfil",
      "/verificacao",
      "/bloqueados",
      "/notificacoes",
      "/suporte",
      "/manual",
      "/termos",
      "/admin",
    ]) {
      expect(view).toContain(`to="${path}"`);
    }
    expect(view).toContain("isStaff ?");
    expect(view).toContain("themeControl");
    expect(view).toContain("dangerZone");
    expect(view).toContain('signingOut ? "Saindo..."');
  });
});
