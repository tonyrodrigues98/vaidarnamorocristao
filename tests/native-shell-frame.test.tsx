import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  NATIVE_SHELL_MAIN_ID,
  NativeShellFrame,
} from "../src/components/native-shell/NativeShellFrame";
import { ThemeProvider } from "../src/lib/theme";

function renderFrame(props: Partial<React.ComponentProps<typeof NativeShellFrame>> = {}) {
  return renderToStaticMarkup(
    <ThemeProvider>
      <NativeShellFrame {...props}>
        <section>Conteúdo existente</section>
      </NativeShellFrame>
    </ThemeProvider>,
  );
}

describe("NativeShellFrame", () => {
  it("renders the isolated scaffold contract with the resolved theme", () => {
    const markup = renderFrame();

    expect(markup).toContain("data-vdn-native-shell");
    expect(markup).toContain('data-theme="light"');
    expect(markup).toContain('data-theme-preference="system"');
    expect(markup).toContain('data-reference-status="partially-frozen"');
    expect(markup).toContain('data-native-shell-version="scaffold-1"');
    expect(markup).toContain(`id="${NATIVE_SHELL_MAIN_ID}"`);
    expect(markup).toContain("data-native-shell-content");
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain("Conteúdo existente");
  });

  it("keeps the route responsible for the only main landmark", () => {
    const markup = renderToStaticMarkup(
      <ThemeProvider>
        <NativeShellFrame activePrimaryTab="home" keyboardOpen>
          <main>Rota</main>
        </NativeShellFrame>
      </ThemeProvider>,
    );

    expect(markup.match(/<main/g)).toHaveLength(1);
    expect(markup).toContain('data-active-primary-tab="home"');
    expect(markup).toContain('data-keyboard-open="true"');
    expect(markup).toMatch(
      new RegExp(`<div[^>]+id="${NATIVE_SHELL_MAIN_ID}"[^>]+data-native-shell-content`),
    );
  });

  it("does not render absent slot regions", () => {
    const markup = renderFrame();

    expect(markup).not.toContain("vdn-native-shell-frame__primary-navigation");
    expect(markup).not.toContain("vdn-native-shell-frame__top-bar");
    expect(markup).not.toContain("vdn-native-shell-frame__context-panel");
    expect(markup).not.toContain("vdn-native-shell-frame__bottom-navigation");
    expect(markup).not.toContain("vdn-native-shell-frame__overlay-host");
  });

  it("renders every supplied slot with semantic regions", () => {
    const markup = renderFrame({
      primaryNavigation: <span>Principal</span>,
      topBar: <span>Topo</span>,
      contextPanel: <span>Contexto</span>,
      bottomNavigation: <span>Inferior</span>,
      overlayHost: <span>Overlay</span>,
    });

    expect(markup).toContain("<nav");
    expect(markup).toContain("<header");
    expect(markup).toContain("<aside");
    expect(markup).toContain("Principal");
    expect(markup).toContain("Topo");
    expect(markup).toContain("Contexto");
    expect(markup).toContain("Inferior");
    expect(markup).toContain("Overlay");
  });

  it("has a stable main identity and no pathname-based remount key", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/components/native-shell/NativeShellFrame.tsx", "utf8"),
    );

    expect(NATIVE_SHELL_MAIN_ID).toBe("vdn-native-shell-main");
    expect(source).not.toMatch(/\bkey\s*=/);
    expect(source).not.toMatch(/pathname|useLocation|useAuth|supabase/i);
  });
});
