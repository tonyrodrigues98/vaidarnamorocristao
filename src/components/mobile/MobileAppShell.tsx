import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

const MOBILE_APP_PREFIXES = [
  "/inicio",
  "/devocional",
  "/pretendentes",
  "/conversas",
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
/** Routes that hide the bottom nav for focused, full-screen chat. */
const MOBILE_FOCUSED_CHAT_PREFIXES = ["/conversas/"];
const MOBILE_CHAT_PREFIXES = ["/conversas/"];

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
      const height = viewport?.height ?? window.innerHeight;
      root.style.setProperty("--app-visual-height", `${height}px`);
    };

    setChatHeight();
    // Schedule a few extra reads after focus changes — iOS Safari does not
    // always fire `resize` immediately when the keyboard opens/closes.
    const scheduleReads = () => {
      setChatHeight();
      requestAnimationFrame(setChatHeight);
      window.setTimeout(setChatHeight, 100);
      window.setTimeout(setChatHeight, 350);
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        scheduleReads();
      }
    };
    const onFocusOut = () => scheduleReads();

    viewport?.addEventListener("resize", setChatHeight);
    viewport?.addEventListener("scroll", setChatHeight);
    window.addEventListener("resize", setChatHeight);
    window.addEventListener("orientationchange", scheduleReads);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      viewport?.removeEventListener("resize", setChatHeight);
      viewport?.removeEventListener("scroll", setChatHeight);
      window.removeEventListener("resize", setChatHeight);
      window.removeEventListener("orientationchange", scheduleReads);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
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
