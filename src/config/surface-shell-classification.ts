export type SurfaceShellClassification =
  | "Native App Shell"
  | "Focused Messaging Shell"
  | "Admin Shell"
  | "Auth Shell"
  | "Onboarding Shell"
  | "Document Shell"
  | "Public Shell"
  | "API/server";

const publicPaths = new Set([
  "/",
  "/sobre",
  "/como-funciona",
  "/depoimentos",
  "/instalar",
  "/blog/",
  "/blog/$slug",
]);

const nativeAppPaths = new Set([
  "/avatar",
  "/avatar/criar",
  "/bloqueados",
  "/caixas",
  "/comunidade",
  "/conquistas",
  "/conta",
  "/conversas/",
  "/dashboard",
  "/devocional",
  "/explorar",
  "/inicio",
  "/interesses",
  "/loja",
  "/matches",
  "/meu-pet",
  "/notificacoes",
  "/noticias/",
  "/oracoes",
  "/perfil",
  "/pet-arcade",
  "/presentes/",
  "/pretendentes/",
  "/pretendentes/$id",
  "/proposito/$matchId",
  "/quiz-biblico",
  "/recados",
  "/suporte/",
  "/suporte/$id",
  "/suporte/ajuda",
  "/verificacao",
]);

export function classifySurfaceShell(pathname: string): SurfaceShellClassification | undefined {
  if (pathname.startsWith("/api/")) return "API/server";
  if (pathname === "/admin/" || pathname.startsWith("/admin/")) return "Admin Shell";
  if (pathname.startsWith("/auth/")) return "Auth Shell";
  if (pathname === "/onboarding/" || pathname.startsWith("/onboarding/")) {
    return "Onboarding Shell";
  }
  if (pathname === "/manual" || pathname === "/termos") return "Document Shell";
  if (publicPaths.has(pathname)) return "Public Shell";
  if (pathname === "/conversas/$matchId" || pathname === "/conversas/comunidade") {
    return "Focused Messaging Shell";
  }
  if (nativeAppPaths.has(pathname)) return "Native App Shell";
  return undefined;
}
