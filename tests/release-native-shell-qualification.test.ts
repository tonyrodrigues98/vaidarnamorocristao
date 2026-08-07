import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

describe("native shell release qualification", () => {
  it("preserves the five canonical primary destinations in order", () => {
    const source = read("src/config/native-primary-navigation.ts");
    const labels = ["Início", "Comunidade", "Explorar", "Conversas", "Perfil"];
    const positions = labels.map((label) => source.indexOf(`label: "${label}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(source).not.toContain('label: "Namoro"');
  });

  it("suppresses incompatible chrome before legacy implementations mount", () => {
    expect(read("src/components/layout/Header.tsx")).toContain("nativeActive || adminActive");
    expect(read("src/components/mobile/MobileAppHeader.tsx")).toContain("if (active) return null");
    expect(read("src/components/admin/AdminTopNav.tsx")).toContain("if (active) return null");
    expect(read("src/components/admin-shell/AdminShellFrame.tsx")).not.toContain(
      "NativeBottomNavigation",
    );
  });

  it("keeps focused messaging outside the normal shell", () => {
    const registry = read("src/config/app-destinations.ts");
    expect(registry).toContain('shell: "focused"');
    expect(read("src/config/surface-shell-classification.ts")).toContain(
      '"Focused Messaging Shell"',
    );
  });

  it("keeps public, auth, onboarding and API surfaces isolated", () => {
    const coverage = read("src/config/surface-shell-classification.ts");
    for (const shell of ["Public Shell", "Auth Shell", "Onboarding Shell", "API/server"]) {
      expect(coverage).toContain(shell);
    }
  });

  it("keeps private content out of the public service-worker cache", () => {
    const sw = read("public/sw.js");
    expect(sw).toContain("isSensitivePath");
    expect(sw).toContain("isSafeStaticRequest");
    expect(sw).toContain('caches.match("/offline.html")');
    expect(sw).not.toMatch(/cache\.put\([^\n]*Authorization/i);
  });

  it("keeps shell components free from data mutations", () => {
    for (const directory of ["native-shell", "admin-shell"]) {
      const files = [
        ...(directory === "native-shell"
          ? ["NativeShellFrame.tsx", "NativeAdaptiveNavigation.tsx", "NativeTopBar.tsx"]
          : ["AdminShellFrame.tsx", "AdminSidebar.tsx", "AdminTopBar.tsx"]),
      ];
      for (const file of files) {
        expect(read(`src/components/${directory}/${file}`)).not.toMatch(
          /supabase|\.from\(|\.rpc\(|\.channel\(/,
        );
      }
    }
  });
});
