import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const primaryScreens = [
  "InicioScreen.tsx",
  "ComunidadeScreen.tsx",
  "ExplorarScreen.tsx",
  "ConversasScreen.tsx",
  "PerfilScreen.tsx",
] as const;

const primaryRoutes = [
  "src/routes/inicio.tsx",
  "src/routes/comunidade.tsx",
  "src/routes/explorar.tsx",
  "src/routes/conversas/index.tsx",
  "src/routes/perfil.tsx",
] as const;

const rejectedVisualImports = [
  "@/components/redesign-total/",
  "@/components/redesign-zero/",
  "@/components/layout/Header",
  "@/components/mobile/MobileAppHeader",
  "@/v2/",
] as const;

describe("Prototype 01 canonical presentation boundary", () => {
  it("keeps the five primary screens inside the transplanted source tree", () => {
    for (const screen of primaryScreens) {
      const source = readFileSync(`src/prototype-01/screens/${screen}`, "utf8");
      expect(source).toMatch(/className="(?:screen|[^"]*screen)/);
      for (const rejectedImport of rejectedVisualImports) {
        expect(source).not.toContain(rejectedImport);
      }
    }
  });

  it("binds every primary route to its canonical screen without rejected visuals", () => {
    primaryRoutes.forEach((route, index) => {
      const source = readFileSync(route, "utf8");
      expect(source).toContain(primaryScreens[index].replace(".tsx", ""));
    });
  });

  it("keeps shells and presentation components free of data operations", () => {
    const presentationFiles = [
      "src/prototype-01/shell/Prototype01ShellFrame.tsx",
      "src/prototype-01/components/Prototype01SecondaryHeader.tsx",
      "src/prototype-01/Prototype01RuntimeProvider.tsx",
    ];

    for (const file of presentationFiles) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/supabase|useQuery|useMutation|\.channel\(|fetch\(/i);
    }
  });

  it("uses one independent feature flag with an isolated review default", () => {
    const source = readFileSync("src/config/prototype-01-feature.ts", "utf8");
    expect(source).toContain("VITE_FF_PROTOTYPE01_UI");
    expect(source).toContain("PROTOTYPE_01_REVIEW_DEFAULT = true");
    expect(source).toContain("if (configured === undefined)");
    expect(source).not.toContain("VITE_FF_TOTAL_REDESIGN");
  });
});
