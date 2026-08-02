import { describe, expect, it } from "vitest";

import {
  chatRouteHasBottomNav,
  isChatRoute,
  isMobileAppRoute,
  shouldShowFooter,
  shouldShowMobileAppShell,
  shouldShowMobileBottomNav,
} from "../src/lib/layoutVisibility";

const legacyParityFixture = [
  {
    path: "/",
    footer: false,
    mobile: false,
    bottom: false,
    chat: false,
  },
  {
    path: "/inicio",
    footer: true,
    mobile: true,
    bottom: true,
    chat: false,
  },
  {
    path: "/conversas",
    footer: false,
    mobile: true,
    bottom: true,
    chat: false,
  },
  {
    path: "/conversas/abc",
    footer: false,
    mobile: true,
    bottom: false,
    chat: true,
  },
  {
    path: "/conversas/comunidade",
    footer: false,
    mobile: true,
    bottom: false,
    chat: true,
  },
  {
    path: "/perfil",
    footer: false,
    mobile: true,
    bottom: true,
    chat: false,
  },
  {
    path: "/suporte/abc",
    footer: false,
    mobile: false,
    bottom: false,
    chat: false,
  },
  {
    path: "/admin/pets",
    footer: false,
    mobile: false,
    bottom: false,
    chat: false,
  },
  {
    path: "/auth/login",
    footer: false,
    mobile: false,
    bottom: false,
    chat: false,
  },
  {
    path: "/comunidade",
    footer: true,
    mobile: false,
    bottom: false,
    chat: false,
  },
] as const;

describe("layout visibility compatibility wrappers", () => {
  it.each(legacyParityFixture)("preserves the pre-refactor matrix for $path", (fixture) => {
    expect(shouldShowFooter(fixture.path)).toBe(fixture.footer);
    expect(isMobileAppRoute(fixture.path)).toBe(fixture.mobile);
    expect(shouldShowMobileAppShell(fixture.path, true)).toBe(fixture.mobile);
    expect(shouldShowMobileAppShell(fixture.path, false)).toBe(false);
    expect(shouldShowMobileBottomNav(fixture.path)).toBe(fixture.bottom);
    expect(isChatRoute(fixture.path)).toBe(fixture.chat);
  });

  it("keeps focused chats free from bottom navigation", () => {
    expect(chatRouteHasBottomNav("/conversas/comunidade")).toBe(false);
    expect(chatRouteHasBottomNav("/conversas/abc")).toBe(false);
    expect(isChatRoute("/conversas")).toBe(false);
    expect(isChatRoute("/conversas/comunidade")).toBe(true);
  });
});
