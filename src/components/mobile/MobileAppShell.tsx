import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

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
const MOBILE_FOCUSED_CHAT_PREFIXES = ["/conversas/", "/comunidade"];
const MOBILE_CHAT_PREFIXES = ["/comunidade", "/conversas/"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function shouldShowMobileAppShell(pathname: string, hasUser: boolean) {
  if (!hasUser) return false;
  if (pathname === "/" || pathname === "/termos" || pathname === "/manual") return false;
  if (MOBILE_APP_HIDDEN_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return false;
  return MOBILE_APP_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function shouldShowMobileBottomNav(pathname: string) {
  return !MOBILE_FOCUSED_CHAT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const showMobileShell = shouldShowMobileAppShell(location.pathname, Boolean(user) && !loading);
  const showBottomNav = showMobileShell && shouldShowMobileBottomNav(location.pathname);
  const isChatScreen = MOBILE_CHAT_PREFIXES.some((prefix) =>
    matchesPrefix(location.pathname, prefix),
  );

  useEffect(() => {
    if (!isChatScreen || typeof window === "undefined") return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    const setChatHeight = () => {
      root.style.setProperty("--app-visual-height", `${viewport?.height ?? window.innerHeight}px`);
    };

    setChatHeight();
    viewport?.addEventListener("resize", setChatHeight);
    viewport?.addEventListener("scroll", setChatHeight);
    window.addEventListener("resize", setChatHeight);

    return () => {
      viewport?.removeEventListener("resize", setChatHeight);
      viewport?.removeEventListener("scroll", setChatHeight);
      window.removeEventListener("resize", setChatHeight);
      root.style.removeProperty("--app-visual-height");
    };
  }, [isChatScreen]);

  return (
    <>
      <div
        className={cn(showMobileShell && "mobile-app-shell", isChatScreen && "mobile-chat-shell")}
      >
        {children}
      </div>
      {showBottomNav && <MobileBottomNav />}
    </>
  );
}
