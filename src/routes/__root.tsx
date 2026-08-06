import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

type StructuralRouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<StructuralRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "noindex,nofollow" },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  shellComponent: StructuralDocument,
  component: StructuralRoot,
  notFoundComponent: StructuralNotFound,
});

function StructuralDocument({ children }: { children: React.ReactNode }) {
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

function StructuralRoot() {
  return <Outlet />;
}

function StructuralNotFound() {
  return (
    <main>
      <h1>Rota não encontrada</h1>
      <Link to="/">Voltar</Link>
    </main>
  );
}
