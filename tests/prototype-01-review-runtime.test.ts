import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const primaryRoutes = [
  ["/inicio", "src/routes/inicio.tsx", "Prototype01InicioScreen", "NativeInicioView"],
  ["/comunidade", "src/routes/comunidade.tsx", "Prototype01ComunidadeScreen", null],
  ["/explorar", "src/routes/explorar.tsx", "Prototype01ExplorarScreen", null],
  [
    "/conversas",
    "src/routes/conversas/index.tsx",
    "Prototype01ConversasScreen",
    "NativeConversationsView",
  ],
  ["/perfil", "src/routes/perfil.tsx", "Prototype01PerfilScreen", null],
] as const;

describe("Prototype 01 isolated review runtime", () => {
  it("marks the literal transplanted shell and metadata channel", () => {
    const shell = readFileSync("src/prototype-01/shell/Prototype01ShellFrame.tsx", "utf8");
    const root = readFileSync("src/routes/__root.tsx", "utf8");

    expect(shell).toContain('data-prototype-01-ui="active"');
    expect(shell).toContain('data-prototype-01-source="literal-transplant"');
    expect(root).toContain('name: "vdn-ui-channel"');
    expect(root).toContain('content: "prototype-01-literal-transplant"');
  });

  it("mounts the transplanted shell before the native or legacy fallback", () => {
    const boundary = readFileSync(
      "src/components/native-shell/NativeShellRuntimeBoundary.tsx",
      "utf8",
    );
    const prototypeBranch = boundary.indexOf("if (usePrototype01Shell && activeTab)");
    const nativeBranch = boundary.indexOf("if (useNativeShell && activeTab)");

    expect(prototypeBranch).toBeGreaterThan(-1);
    expect(nativeBranch).toBeGreaterThan(prototypeBranch);
    expect(boundary.slice(prototypeBranch, nativeBranch)).toContain("<Prototype01ShellFrame");
    expect(boundary.slice(prototypeBranch, nativeBranch)).not.toContain("<NativeShellFrame");
    expect(boundary.slice(prototypeBranch, nativeBranch)).not.toContain("<MobileAppShell");
  });

  it.each(primaryRoutes)(
    "selects the canonical source screen for %s",
    (_path, file, screen, fallback) => {
      const source = readFileSync(file, "utf8");
      const prototypeBranch = source.indexOf("if (prototype01Active)");

      expect(prototypeBranch).toBeGreaterThan(-1);
      expect(source.slice(prototypeBranch)).toContain(`<${screen}`);
      if (fallback) {
        expect(source.indexOf(`<${screen}`, prototypeBranch)).toBeLessThan(
          source.indexOf(`<${fallback}`, prototypeBranch),
        );
      }
    },
  );

  it("keeps rejected shells and headers out of the active Prototype 01 branch", () => {
    const boundary = readFileSync(
      "src/components/native-shell/NativeShellRuntimeBoundary.tsx",
      "utf8",
    );
    const start = boundary.indexOf("if (usePrototype01Shell && activeTab)");
    const end = boundary.indexOf("if (useNativeShell && activeTab)");
    const activeBranch = boundary.slice(start, end);

    expect(activeBranch).not.toMatch(
      /NativeShellFrame|NativeInicioView|Header|MobileAppHeader|redesign-total|visual-zero/,
    );
  });
});
