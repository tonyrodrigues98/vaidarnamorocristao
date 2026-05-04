import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsBridge } from "@/lib/useRealtimeNotifications";
import { ThemeProvider } from "@/lib/theme";
import { TermsGate } from "@/components/TermsGate";
import { SupportFooterButton } from "@/components/SupportFooterButton";
import { PresenceProvider } from "@/lib/presence";

import appCss from "../styles.css?url";

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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VaiDarNamoro — Plataforma Cristã de Relacionamentos" },
      { name: "description", content: "Plataforma cristã de relacionamentos sérios. Conheça pretendentes que compartilham sua fé." },
      { property: "og:title", content: "VaiDarNamoro" },
      { property: "og:description", content: "Onde a fé encontra o amor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap",
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
    <html lang="en">
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
          <div className="flex min-h-screen flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="border-t border-border/50 bg-background/60 py-4 mt-8">
            <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 text-xs text-muted-foreground">
              <Link to="/termos" className="hover:text-[var(--rose)] hover:underline">
                Termos e Condições
              </Link>
              <span aria-hidden className="opacity-40">•</span>
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
