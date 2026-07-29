import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useLocation,
  Navigate,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import type { AppRouterContext } from "@/v2/app/router-context";
import { appBuildInfo } from "@/v2/app/build-info";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsBridge } from "@/lib/useRealtimeNotifications";
import { ThemeProvider } from "@/lib/theme";
import { getThemeBootstrapScript } from "@/lib/theme-core";
import { SupportFooterButton } from "@/components/SupportFooterButton";
import { PresenceProvider } from "@/lib/presence";
import { BanGuard } from "@/components/BanGuard";
import { NativeShellRuntimeBoundary } from "@/components/native-shell";
import { NetworkStatusBanner } from "@/components/mobile/NetworkStatusBanner";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { MobileRouteTransition } from "@/components/mobile/MobileRouteTransition";
import { isChatRoute, shouldShowFooter } from "@/lib/layoutVisibility";
import { RouteProtectionBoundary } from "@/v2/app/routing/RouteProtectionBoundary";
import { shouldMountPrivateProviders } from "@/v2/app/routing/route-access";
import { v2FeatureFlags } from "@/v2/platform/feature-flags";
import { isV2RuntimePath, V2RuntimeState } from "@/v2/integration";
import {
  configureSupabaseRuntime,
  hasSupabaseRuntimeConfig,
  type PublicSupabaseRuntimeConfig,
} from "@/integrations/supabase/client";

import appCss from "../styles.css?url";
import coinPng from "@/assets/coin.webp";
import { useEffect, useState } from "react";
import { registerAppServiceWorker } from "@/lib/registerSW";
import { brand } from "@/config/brand";
import { rootMetadata } from "@/config/route-metadata";

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

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      {
        name: "theme-color",
        content: brand.theme.canvasLight,
      },
      { name: "format-detection", content: "telephone=no" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: brand.name },
      { name: "application-name", content: brand.name },
      { name: "msapplication-TileColor", content: brand.theme.action },
      { name: "vdn-build-commit", content: appBuildInfo.commit },
      { name: "vdn-build-channel", content: appBuildInfo.channel },
      {
        name: "google-site-verification",
        content: "PXzDRZhAILyhetuReW3wOrUOPfeN11JyBmm0bVeO0Hg",
      },
      { name: "author", content: brand.name },
      { property: "og:site_name", content: brand.name },
      { property: "og:locale", content: brand.locale },
      ...rootMetadata.meta,
    ],
    links: [
      { rel: "preload", as: "image", href: coinPng },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Preconnect to Supabase host so the first signed-URL image (avatars,
      // photos, etc.) doesn't pay DNS + TLS on the critical path.
      {
        rel: "preconnect",
        href: (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: brand.assets.favicon, sizes: "any" },
      { rel: "apple-touch-icon", href: brand.assets.appleTouchIcon, sizes: "180x180" },
      { rel: "manifest", href: brand.assets.manifest },
      { rel: "icon", type: "image/png", sizes: "192x192", href: brand.assets.icon192 },
      { rel: "icon", type: "image/png", sizes: "512x512", href: brand.assets.icon512 },
      // iOS splash screens (apple-touch-startup-image) — kills the white flash
      // when launching the installed PWA from the home screen.
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-2048x2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-1668x2388.png",
        media:
          "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-1536x2048.png",
        media:
          "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-1290x2796.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-1284x2778.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-1179x2556.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-1170x2532.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-1125x2436.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-828x1792.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-750x1334.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
      {
        rel: "apple-touch-startup-image",
        href: "/splash/splash-640x1136.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
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
    <html lang={brand.language} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
        <style
          dangerouslySetInnerHTML={{
            __html: `
#app-splash{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#ffffff;transition:opacity .35s ease;}
html.dark #app-splash,html[data-theme="dark"] #app-splash{background:${brand.theme.canvasDark};}
#app-splash.is-hiding{opacity:0;pointer-events:none;}
#app-splash .app-splash-logo{width:min(60vw,200px);height:auto;object-fit:contain;display:block;filter:drop-shadow(0 8px 24px rgba(0,0,0,.08));}
@media (min-width:768px){#app-splash .app-splash-logo{width:240px;}}
#app-splash .app-splash-loader{margin-top:32px;width:160px;height:3px;background:rgba(0,0,0,.08);border-radius:999px;overflow:hidden;}
html.dark #app-splash .app-splash-loader,html[data-theme="dark"] #app-splash .app-splash-loader{background:rgba(255,255,255,.14);}
#app-splash .app-splash-loader-bar{display:block;height:100%;width:0%;background:#000;border-radius:999px;transition:width .35s cubic-bezier(.22,.61,.36,1);}
html.dark #app-splash .app-splash-loader-bar,html[data-theme="dark"] #app-splash .app-splash-loader-bar{background:#fff;}
`,
          }}
        />
      </head>
      <body>
        <div id="app-splash" aria-hidden="true">
          <img src={brand.assets.splashLogo} alt={brand.name} className="app-splash-logo" />
          <div className="app-splash-loader">
            <span className="app-splash-loader-bar" suppressHydrationWarning />
          </div>
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
  const { queryClient } = Route.useRouteContext();
  const showFooter = shouldShowFooter(location.pathname);
  const chatRoute = isChatRoute(location.pathname);
  const isHome = location.pathname === "/";
  const isV2Route = isV2RuntimePath(location.pathname);

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SupabaseRuntimeBoundary>
          <AuthProvider>
            <V2AwareRouteBoundary isV2Route={isV2Route}>
              <AuthenticatedProviderBoundary>
                <NativeShellRuntimeBoundary>
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
                        <MobileRouteTransition disabled={chatRoute}>
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
                </NativeShellRuntimeBoundary>
              </AuthenticatedProviderBoundary>
            </V2AwareRouteBoundary>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </SupabaseRuntimeBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function SupabaseRuntimeBoundary({ children }: { children: React.ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function resolveRuntimeConfig() {
      if (hasSupabaseRuntimeConfig()) {
        if (active) setState("ready");
        return;
      }

      try {
        const response = await fetch("/api/public/runtime-config", {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Runtime configuration unavailable");

        const config = (await response.json()) as PublicSupabaseRuntimeConfig;
        configureSupabaseRuntime(config);
        if (active) setState("ready");
      } catch {
        if (active) setState("error");
      }
    }

    void resolveRuntimeConfig();
    return () => {
      active = false;
    };
  }, [attempt]);

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p role="status" className="text-sm text-muted-foreground">
          Carregando sua comunidade...
        </p>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold text-foreground">Não foi possível iniciar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifique sua conexão e tente novamente.
          </p>
          <button
            type="button"
            className="mt-5 min-h-11 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => {
              setState("loading");
              setAttempt((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

function V2AwareRouteBoundary({
  children,
  isV2Route,
}: {
  children: React.ReactNode;
  isV2Route: boolean;
}) {
  if (isV2Route && !v2FeatureFlags.appShell) return <Navigate to="/inicio" replace />;

  return (
    <RouteProtectionBoundary
      waitingFallback={isV2Route ? <V2RuntimeState kind="loading" /> : undefined}
      recoverableErrorFallback={
        isV2Route ? (
          <V2RuntimeState
            kind="session-error"
            onRetry={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
          />
        ) : undefined
      }
    >
      <NetworkStatusBanner />
      <InstallPromptBanner />
      {isV2Route ? <Outlet /> : children}
    </RouteProtectionBoundary>
  );
}

function AuthenticatedProviderBoundary({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  if (!shouldMountPrivateProviders(status, !!user)) return <>{children}</>;

  return (
    <PresenceProvider>
      <NotificationsBridge />
      <BanGuard />
      {children}
    </PresenceProvider>
  );
}
