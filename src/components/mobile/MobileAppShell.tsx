import { useLocation } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

const MOBILE_APP_PREFIXES = [
  "/inicio",
  "/devocional",
  "/pretendentes",
  "/comunidade",
  "/perfil",
  "/notificacoes",
  "/dashboard",
  "/interesses",
  "/matches",
  "/loja",
  "/presentes",
  "/recados",
  "/oracoes",
  "/conta",
  "/bloqueados",
  "/verificacao",
  "/proposito",
];

const MOBILE_APP_HIDDEN_PREFIXES = ["/auth", "/admin", "/onboarding", "/suporte"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function shouldShowMobileAppShell(pathname: string, hasUser: boolean) {
  if (!hasUser) return false;
  if (pathname === "/" || pathname === "/termos" || pathname === "/manual") return false;
  if (MOBILE_APP_HIDDEN_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return false;
  return MOBILE_APP_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const showMobileShell = shouldShowMobileAppShell(location.pathname, Boolean(user) && !loading);

  return (
    <>
      <div className={cn(showMobileShell && "mobile-app-shell")}>{children}</div>
      {showMobileShell && <MobileBottomNav />}
    </>
  );
}
