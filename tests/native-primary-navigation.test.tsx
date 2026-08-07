import { readFileSync } from "node:fs";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    preload,
    children,
    ...props
  }: ComponentProps<"a"> & { to: string; preload?: string; children?: ReactNode }) => (
    <a href={to} data-preload={preload} {...props}>
      {children}
    </a>
  ),
}));

import { NativeBottomNavigation } from "../src/components/native-shell/NativeBottomNavigation";
import { NativeAdaptiveNavigation } from "../src/components/native-shell/NativeAdaptiveNavigation";
import { brand } from "../src/config/brand";
import { plannedPrimaryDestinations } from "../src/config/app-destinations";
import {
  NATIVE_TAB_RESELECT_EVENT,
  createNativeTabReselectDetail,
  isNativeEditableTarget,
  nativePrimaryNavigation,
  resolveNativeKeyboardVisibility,
  resolveNativeReselectScrollBehavior,
  resolveNativeTabSelectionAction,
} from "../src/config/native-primary-navigation";

describe("native primary navigation configuration", () => {
  it("derives the exact ordered five-tab contract from planned destinations", () => {
    expect(nativePrimaryNavigation.map(({ id, label, path }) => ({ id, label, path }))).toEqual([
      { id: "home", label: "Início", path: "/inicio" },
      { id: "community", label: "Comunidade", path: "/comunidade" },
      { id: "explore", label: "Explorar", path: "/explorar" },
      { id: "messages", label: "Conversas", path: "/conversas" },
      { id: "profile", label: "Perfil", path: "/perfil" },
    ]);
    expect(nativePrimaryNavigation.map(({ id, path }) => ({ id, path }))).toEqual(
      plannedPrimaryDestinations,
    );
    expect(new Set(nativePrimaryNavigation.map((item) => item.id)).size).toBe(5);
    expect(new Set(nativePrimaryNavigation.map((item) => item.path)).size).toBe(5);
    expect(nativePrimaryNavigation.map((item) => item.label).join(" ")).not.toMatch(
      /Devocional|Pretendentes|Criar|Mais/,
    );
  });

  it("renders five semantic links, visible labels, icons and one active item without nested nav", () => {
    const markup = renderToStaticMarkup(
      <NativeBottomNavigation activeTab="community" pathname="/comunidade" />,
    );

    expect(markup.match(/<a /g)).toHaveLength(5);
    expect(markup.match(/<svg/g)).toHaveLength(5);
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup.match(/min-h-11/g)).toHaveLength(5);
    expect(markup).not.toContain("<nav");
    for (const label of ["Início", "Comunidade", "Explorar", "Conversas", "Perfil"]) {
      expect(markup).toContain(label);
    }
  });

  it("has no data, portal, profile fetch or Supabase dependency", () => {
    const source = readFileSync("src/components/native-shell/NativeBottomNavigation.tsx", "utf8");
    expect(source).not.toMatch(/supabase|createPortal|avatar|badge|useQuery/i);
    expect(source).not.toMatch(/from\s+["'][^"']*(profile|perfil)[^"']*["']/i);
  });

  it("renders the official brand and the same five destinations without a nested nav", () => {
    const markup = renderToStaticMarkup(
      <NativeAdaptiveNavigation activeTab="explore" pathname="/explorar" />,
    );

    expect(markup).toContain(`src="${brand.assets.icon192}"`);
    expect(markup).toContain(brand.displayName);
    expect(markup.match(/<a /g)).toHaveLength(6);
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).not.toContain("<nav");
    for (const item of nativePrimaryNavigation) {
      expect(markup).toContain(`href="${item.path}"`);
      expect(markup).toContain(item.label);
    }
  });

  it("shares one selection hook without backend, avatar, badge or portal imports", () => {
    const bottom = readFileSync("src/components/native-shell/NativeBottomNavigation.tsx", "utf8");
    const adaptive = readFileSync(
      "src/components/native-shell/NativeAdaptiveNavigation.tsx",
      "utf8",
    );
    const selection = readFileSync(
      "src/components/native-shell/useNativePrimaryTabSelection.ts",
      "utf8",
    );

    expect(bottom).toContain("useNativePrimaryTabSelection");
    expect(adaptive).toContain("useNativePrimaryTabSelection");
    expect(bottom).not.toContain("window.scrollTo");
    expect(adaptive).not.toContain("window.scrollTo");
    expect(selection.match(/window\.scrollTo/g)).toHaveLength(1);
    expect(`${adaptive}\n${selection}`).not.toMatch(/supabase|createPortal|avatar|badge|useQuery/i);
  });
});

describe("native tab reselection", () => {
  const home = nativePrimaryNavigation[0]!;

  it("distinguishes navigation, root reset and root reselection", () => {
    expect(
      resolveNativeTabSelectionAction({
        item: home,
        activeTab: "profile",
        pathname: "/perfil",
      }),
    ).toBe("navigate");
    expect(
      resolveNativeTabSelectionAction({
        item: home,
        activeTab: "home",
        pathname: "/inicio",
        search: "?filtro=agora",
      }),
    ).toBe("reset-root");
    expect(
      resolveNativeTabSelectionAction({
        item: home,
        activeTab: "home",
        pathname: "/inicio",
      }),
    ).toBe("scroll-top");
  });

  it("defines reduced-motion and event detail deterministically", () => {
    expect(resolveNativeReselectScrollBehavior(false)).toBe("smooth");
    expect(resolveNativeReselectScrollBehavior(true)).toBe("auto");
    expect(NATIVE_TAB_RESELECT_EVENT).toBe("vdn:native-tab-reselect");
    expect(createNativeTabReselectDetail(home)).toEqual({ tab: "home", path: "/inicio" });
  });
});

describe("native keyboard visibility", () => {
  it.each(["input", "textarea", "select"])("recognizes editable %s", (tagName) => {
    expect(isNativeEditableTarget({ tagName })).toBe(true);
  });

  it("recognizes contenteditable and rejects ordinary elements", () => {
    expect(isNativeEditableTarget({ tagName: "div", isContentEditable: true })).toBe(true);
    expect(isNativeEditableTarget({ tagName: "button" })).toBe(false);
  });

  it("hides immediately for mobile editing or a reduced visual viewport", () => {
    expect(
      resolveNativeKeyboardVisibility({
        enabled: true,
        viewportWidth: 390,
        layoutHeight: 844,
        visualHeight: 844,
        editableFocused: true,
      }),
    ).toBe(true);
    expect(
      resolveNativeKeyboardVisibility({
        enabled: true,
        viewportWidth: 390,
        layoutHeight: 844,
        visualHeight: 600,
        editableFocused: false,
      }),
    ).toBe(true);
  });

  it("remains visible after blur/full viewport and on desktop", () => {
    expect(
      resolveNativeKeyboardVisibility({
        enabled: true,
        viewportWidth: 390,
        layoutHeight: 844,
        visualHeight: 844,
        editableFocused: false,
      }),
    ).toBe(false);
    expect(
      resolveNativeKeyboardVisibility({
        enabled: true,
        viewportWidth: 834,
        layoutHeight: 1194,
        visualHeight: 700,
        editableFocused: true,
      }),
    ).toBe(false);
  });

  it("registers and cleans every runtime listener", () => {
    const source = readFileSync("src/components/native-shell/useNativeViewportState.ts", "utf8");
    for (const event of ["focusin", "focusout", "resize", "scroll", "orientationchange"]) {
      expect(source).toContain(`addEventListener("${event}"`);
      expect(source).toContain(`removeEventListener("${event}"`);
    }
  });
});
