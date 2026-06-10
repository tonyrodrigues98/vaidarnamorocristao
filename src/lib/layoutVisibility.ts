const FOOTER_HIDDEN_PREFIXES = [
  "/admin",
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
  return pathname.startsWith("/conversas/");
}

/**
 * Focused 1:1 chats hide the bottom nav. The /conversas list shows it.
 * Currently no chat-shaped route opts back into the bottom nav.
 */
export function chatRouteHasBottomNav(pathname: string): boolean {
  void pathname;
  return false;
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
  "/conversas",
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