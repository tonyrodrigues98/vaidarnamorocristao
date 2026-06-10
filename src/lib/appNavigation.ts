/**
 * Canonical app routes. Use these constants instead of inlining strings so
 * any rename happens in one place and we keep "one function = one path".
 *
 * These are intentionally string-typed (not `as const`) so they can be passed
 * to TanStack Router's `<Link to={...}>` without widening issues. For dynamic
 * routes (e.g. `/pretendentes/$id`) keep using the route + `params` pattern
 * directly with `<Link>`.
 */
export const appRoutes = {
  home: "/inicio",
  profile: "/perfil",
  account: "/conta",
  notifications: "/notificacoes",
  news: "/noticias",
  conversations: "/conversas",
  community: "/conversas/comunidade",
  explore: "/pretendentes",
  shop: "/loja",
  admin: "/admin",
  devotional: "/devocional",
  interests: "/interesses",
  matches: "/matches",
  anonymousMessages: "/recados",
  gifts: "/presentes",
  verification: "/verificacao",
  support: "/suporte",
  terms: "/termos",
  blocked: "/bloqueados",
} as const;

export type AppRouteKey = keyof typeof appRoutes;
export type AppRoutePath = (typeof appRoutes)[AppRouteKey];

/**
 * Canonical labels for app destinations. Use these to avoid drift between
 * "Visual" / "Customização" / "Aparência" or "Recados" / "Anônimos" etc.
 */
export const appLabels: Record<AppRouteKey, string> = {
  home: "Início",
  profile: "Perfil",
  account: "Conta",
  notifications: "Notificações",
  news: "Notícias",
  conversations: "Conversas",
  community: "Comunidade",
  explore: "Pretendentes",
  shop: "Loja",
  admin: "Painel administrativo",
  devotional: "Devocional",
  interests: "Interesses",
  matches: "Matches",
  anonymousMessages: "Recado anônimo",
  gifts: "Presentes",
  verification: "Verificação",
  support: "Suporte",
  terms: "Termos",
  blocked: "Bloqueados",
};