import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsBridge } from "@/lib/useRealtimeNotifications";
import { ThemeProvider } from "@/lib/theme";
import { TermsGate } from "@/components/TermsGate";
import { SupportFooterButton } from "@/components/SupportFooterButton";
import { PresenceProvider } from "@/lib/presence";
import { BanGuard } from "@/components/BanGuard";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { NetworkStatusBanner } from "@/components/mobile/NetworkStatusBanner";
import { MobileRouteTransition } from "@/components/mobile/MobileRouteTransition";
import { isChatRoute, shouldShowFooter } from "@/lib/layoutVisibility";

import appCss from "../styles.css?url";
import coinPng from "@/assets/coin.webp";
import { useEffect } from "react";
import { registerAppServiceWorker } from "@/lib/registerSW";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ff4f68" },
      { name: "format-detection", content: "telephone=no" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "VaiDarNamoro" },
      { name: "application-name", content: "VaiDarNamoro" },
      { name: "msapplication-TileColor", content: "#ff4f68" },
      {
        name: "google-site-verification",
        content: "PXzDRZhAILyhetuReW3wOrUOPfeN11JyBmm0bVeO0Hg",
      },
      { title: "VaiDarNamoro — Namoro cristão sério com propósito" },
      {
        name: "description",
        content:
          "VaiDarNamoro é a plataforma cristã de relacionamentos sérios. Conheça pretendentes aprovados manualmente que vivem e compartilham a sua fé.",
      },
      { name: "author", content: "VaiDarNamoro" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "VaiDarNamoro" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "VaiDarNamoro — Namoro cristão sério com propósito" },
      { name: "twitter:title", content: "VaiDarNamoro — Namoro cristão sério com propósito" },
      { name: "description", content: "Namoro cristão sério com propósito" },
      { property: "og:description", content: "Namoro cristão sério com propósito" },
      { name: "twitter:description", content: "Namoro cristão sério com propósito" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1b750425-4e0b-4a54-9e82-fd801fe3d681/id-preview-24502e78--3b50ea40-46ee-4b11-9926-5be9286cb827.lovable.app-1780599389099.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1b750425-4e0b-4a54-9e82-fd801fe3d681/id-preview-24502e78--3b50ea40-46ee-4b11-9926-5be9286cb827.lovable.app-1780599389099.png",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/GKTUFlq77iPwT8Pw4jhZzy7Szyp2/social-images/social-1780667467585-8a3c052a-1309-44dc-bb48-6fffc6504f58.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/GKTUFlq77iPwT8Pw4jhZzy7Szyp2/social-images/social-1780667467585-8a3c052a-1309-44dc-bb48-6fffc6504f58.webp",
      },
    ],
    links: [
      { rel: "preload", as: "image", href: coinPng },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <style
          dangerouslySetInnerHTML={{
            __html: `
#app-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#ffffff;transition:opacity .35s ease;}
#app-splash.is-hiding{opacity:0;pointer-events:none;}
#app-splash .app-splash-logo{width:min(60vw,200px);height:auto;object-fit:contain;display:block;filter:drop-shadow(0 8px 24px rgba(0,0,0,.08));}
@media (min-width:768px){#app-splash .app-splash-logo{width:240px;}}
#app-splash .app-splash-loader{margin-top:32px;width:160px;height:3px;background:rgba(0,0,0,.08);border-radius:999px;overflow:hidden;}
#app-splash .app-splash-loader-bar{display:block;height:100%;width:0%;background:#000;border-radius:999px;transition:width .35s cubic-bezier(.22,.61,.36,1);}
`,
          }}
        />
      </head>
      <body>
        <div id="app-splash" aria-hidden="true">
          <img src="/splash-logo.png" alt="VaiDarNamoro" className="app-splash-logo" />
          <div className="app-splash-loader"><span className="app-splash-loader-bar" /></div>
        </div>
        {children}
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var b=document.querySelector('#app-splash .app-splash-loader-bar');if(!b)return;var p=5;b.style.width=p+'%';var tick=setInterval(function(){if(p<90){p+=Math.max(.4,(90-p)*0.04);b.style.width=p+'%';}},120);function set(v){if(v>p){p=v;b.style.width=p+'%';}}window.__splashSet=set;document.addEventListener('DOMContentLoaded',function(){set(35);});window.addEventListener('load',function(){set(70);});window.__splashDone=function(){clearInterval(tick);b.style.width='100%';};})();`,
          }}
        />
      </body>
    </html>
  );
}

function RootComponent() {
  const location = useLocation();
  const showFooter = shouldShowFooter(location.pathname);
  const chatRoute = isChatRoute(location.pathname);
  const isHome = location.pathname === "/";

  useEffect(() => {
    registerAppServiceWorker();
  }, []);

  useEffect(() => {
    const el = document.getElementById("app-splash");
    if (!el) return;
    const done = (window as unknown as { __splashDone?: () => void }).__splashDone;
    if (done) done();
    const t = window.setTimeout(() => {
      el.classList.add("is-hiding");
      window.setTimeout(() => el.remove(), 400);
    }, 280);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <PresenceProvider>
          <NotificationsBridge />
          <BanGuard />
          <NetworkStatusBanner />
          <MobileAppShell>
            {isHome ? (
              <Outlet />
            ) : (
            <div
              className={
                chatRoute
                  ? "flex h-[var(--app-visual-height,100dvh)] flex-col overflow-hidden"
                  : "flex min-h-screen flex-col"
              }
            >
              <div className={chatRoute ? "min-h-0 flex-1 overflow-hidden" : "flex-1"}>
                <MobileRouteTransition disabled={chatRoute} className={chatRoute ? undefined : "h-full"}>
                  <Outlet />
                </MobileRouteTransition>
              </div>
              {showFooter && (
                <footer className="mt-8 border-t border-border/40 bg-card/60 py-4 text-muted-foreground">
                  <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 text-xs text-muted-foreground">
                    <Link to="/termos" className="hover:text-[var(--rose)] hover:underline">
                      Termos e Condições
                    </Link>
                    <span aria-hidden className="opacity-40">
                      •
                    </span>
                    <Link to="/manual" className="hover:text-[var(--rose)] hover:underline">
                      Manual do Usuário
                    </Link>
                    <SupportFooterButton />
                  </div>
                </footer>
              )}
            </div>
            )}
          </MobileAppShell>
          <TermsGate />
        </PresenceProvider>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
