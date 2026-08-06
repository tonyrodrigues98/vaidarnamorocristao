import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { getDestinationBehavior } from "@/config/app-destinations";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const behavior = getDestinationBehavior(location.pathname);
  const showMobileShell = Boolean(user) && !loading && behavior.mobileAppShell;
  const showBottomNav = showMobileShell && behavior.mobileBottomNav;
  const isChatScreen = behavior.visualViewport;

  useEffect(() => {
    if (!isChatScreen || typeof window === "undefined") return;

    const root = document.documentElement;
    const viewport = window.visualViewport;
    const setChatHeight = () => {
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      root.style.setProperty("--app-visual-height", `${height}px`);
      root.style.setProperty("--app-visual-offset-top", `${offsetTop}px`);
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
      root.style.removeProperty("--app-visual-offset-top");
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
