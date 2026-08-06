import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const theme = vi.hoisted(() => ({
  resolvedTheme: "light" as "light" | "dark",
  toggle: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    preload: _preload,
    ...props
  }: ComponentProps<"a"> & { to: string; children?: ReactNode; preload?: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/theme", () => ({
  useTheme: () => theme,
}));

import { getNativeTopBarTitle, getNativeUserInitials } from "../src/config/native-top-bar";
import { NativeTopBar } from "../src/components/native-shell/NativeTopBar";

describe("NativeTopBar", () => {
  it.each([
    ["home", "In\u00edcio"],
    ["community", "Comunidade"],
    ["explore", "Explorar"],
    ["messages", "Conversas"],
    ["profile", "Perfil"],
  ] as const)("derives %s from the primary navigation source", (tab, title) => {
    expect(getNativeTopBarTitle(tab)).toBe(title);
  });

  it("renders official identity and only real, named actions", () => {
    const markup = renderToStaticMarkup(
      <NativeTopBar
        activeTab="home"
        destinationId="app-home"
        userLabel="antonio.rodrigues@example.com"
      />,
    );

    expect(markup).toContain("orha-wordmark-light.png");
    expect(markup).toContain("orha-wordmark-dark.png");
    expect(markup).toContain("In\u00edcio");
    expect(markup).toContain('aria-label="Usar tema escuro"');
    expect(markup).toContain('href="/notificacoes"');
    expect(markup).toContain('aria-label="Abrir notificações"');
    expect(markup).toContain('href="/perfil"');
    expect(markup).toContain('aria-label="Abrir perfil"');
    expect(markup).toContain("AR");
    expect(markup).not.toContain("antonio.rodrigues@example.com");
    expect(markup).not.toContain("<header");
  });

  it("uses at most two initials and reflects the applied theme action", () => {
    expect(getNativeUserInitials("Antonio Rodrigues Silva")).toBe("AR");
    expect(getNativeUserInitials("antonio@example.com")).toBe("AN");
    theme.resolvedTheme = "dark";
    const markup = renderToStaticMarkup(
      <NativeTopBar activeTab="profile" destinationId="app-profile" userLabel="" />,
    );
    expect(markup).toContain('aria-label="Usar tema claro"');
    expect(markup).toContain("VD");
    theme.resolvedTheme = "light";
  });

  it("has no fake search, counters, backend, fetch, portal or V2 dependency", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile("src/components/native-shell/NativeTopBar.tsx", "utf8"),
    );

    expect(source).not.toMatch(
      /search|badge|counter|supabase|fetch\(|createPortal|@\/v2|useNotifications|profiles/i,
    );
  });
});
