import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prototype 01 scrolling and focused chat viewport", () => {
  it("gives the active prototype tab a single touch-scroll owner", () => {
    const styles = readFileSync("src/prototype-01/styles/globals.css", "utf8");

    expect(styles).toContain("[data-vdn-prototype01] .tab-pane.active {");
    expect(styles).toContain("overflow-y: auto;");
    expect(styles).toContain("touch-action: pan-y;");
    expect(styles).toContain("[data-vdn-prototype01] .page-scroll {");
    expect(styles).toContain("height: auto;");
    expect(styles).toContain("overflow: visible;");
    expect(styles).toContain("[data-vdn-prototype01] .tab-pane.active:has(.chat-screen)");
  });

  it("anchors focused chat to both the visual viewport height and offset", () => {
    const shell = readFileSync("src/components/mobile/MobileAppShell.tsx", "utf8");
    const styles = readFileSync("src/styles.css", "utf8");

    expect(shell).toContain("viewport?.offsetTop ?? 0");
    expect(shell).toContain('setProperty("--app-visual-offset-top"');
    expect(shell).toContain('removeProperty("--app-visual-offset-top")');
    expect(styles).toContain("top: var(--app-visual-offset-top, 0px);");
    expect(styles).toContain("height: var(--app-visual-height, 100dvh);");
  });
});
