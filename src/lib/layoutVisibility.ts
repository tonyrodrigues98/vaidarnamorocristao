const FOOTER_HIDDEN_PREFIXES = [
  "/admin",
  "/comunidade",
  "/conversas",
  "/perfil",
  "/loja",
  "/conta",
  "/verificacao",
  "/bloqueados",
  "/presentes",
  "/oracoes",
  "/suporte",
  "/onboarding",
  "/auth",
  "/notificacoes",
];

function startsWithPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Decide whether the global institutional footer (Termos / Manual / Suporte)
 * should render on a given route. We hide it on functional app screens so
 * they feel like an app rather than a website.
 */
export function shouldShowFooter(pathname: string): boolean {
  if (pathname === "/") return false;
  return !FOOTER_HIDDEN_PREFIXES.some((prefix) => startsWithPrefix(pathname, prefix));
}

/**
 * Chat-like routes whose layout occupies the full visual viewport
 * (no document scroll, composer pinned to the keyboard).
 */
export function isChatRoute(pathname: string): boolean {
  return pathname === "/comunidade" || pathname.startsWith("/conversas/");
}

/**
 * /comunidade is a chat that still shows the bottom nav (it's a top-level
 * app destination). Private conversations hide the bottom nav for focus.
 */
export function chatRouteHasBottomNav(pathname: string): boolean {
  return pathname === "/comunidade";
}

/**
 * Internal app routes that, on mobile, replace the global marketing
 * Header with the contextual MobileAppHeader so the PWA feels like a
 * native app instead of a website with a bottom nav.
 */
const MOBILE_APP_HEADER_PREFIXES = [
  "/inicio",
  "/devocional",
  "/pretendentes",
  "/comunidade",
  "/perfil",
  "/loja",
  "/notificacoes",
  "/conta",
  "/interesses",
  "/matches",
  "/recados",
  "/oracoes",
  "/presentes",
  "/bloqueados",
  "/verificacao",
  "/dashboard",
  "/proposito",
];

export function isMobileAppRoute(pathname: string): boolean {
  return MOBILE_APP_HEADER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}