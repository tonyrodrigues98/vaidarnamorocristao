import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("theme-aware brand identity", () => {
  it("keeps both supplied wordmarks in one theme-aware component", () => {
    const source = read("src/components/brand/BrandLogo.tsx");
    const styles = read("src/components/brand/brand-logo.css");

    expect(source).toContain("orha-wordmark-light.png");
    expect(source).toContain("orha-wordmark-dark.png");
    expect(source).toContain("data-vdn-brand-logo");
    expect(styles).toContain(".dark .vdn-brand-logo__image--light");
    expect(styles).toContain(".dark .vdn-brand-logo__image--dark");
  });

  it("uses the shared lockup across every active shell", () => {
    for (const path of [
      "src/components/PublicNav.tsx",
      "src/components/auth/AuthBrand.tsx",
      "src/components/shells/AuthShell.tsx",
      "src/components/native-shell/NativeTopBar.tsx",
      "src/components/native-shell/NativeAdaptiveNavigation.tsx",
      "src/components/admin-shell/AdminSidebar.tsx",
      "src/components/admin-shell/AdminTopBar.tsx",
      "src/prototype-01/shell/Prototype01ShellFrame.tsx",
      "src/prototype-01/screens/InicioScreen.tsx",
      "src/routes/__root.tsx",
    ]) {
      expect(read(path), path).toContain("<BrandLogo");
    }
  });
});
