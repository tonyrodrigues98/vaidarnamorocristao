import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsBridge } from "@/lib/useRealtimeNotifications";
import { ThemeProvider } from "@/lib/theme";
import { TermsGate } from "@/components/TermsGate";
import { SupportFooterButton } from "@/components/SupportFooterButton";
import { PresenceProvider } from "@/lib/presence";
import { BanGuard } from "@/components/BanGuard";

import appCss from "../styles.css?url";
import coinPng from "@/assets/coin.webp";

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
      { name: "theme-color", content: "#ffffff" },
      { name: "format-detection", content: "telephone=no" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "VaiDarNamoro" },
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
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PresenceProvider>
          <NotificationsBridge />
          <BanGuard />
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            <footer className="border-t border-border/50 bg-background/60 py-4 mt-8">
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
          </div>
          <TermsGate />
        </PresenceProvider>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
