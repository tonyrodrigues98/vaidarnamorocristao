import { Link, Navigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { getAdminDestination } from "@/config/admin-destinations";
import { getAdminReturnTo, resolveAdminRouteAccess } from "@/config/admin-route-access";
import { useAuth } from "@/lib/auth";

export function AdminRouteAccessBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { status, rolesLoaded, role } = useAuth();

  if (location.pathname !== "/admin" && !location.pathname.startsWith("/admin/")) {
    return <>{children}</>;
  }

  const destination = getAdminDestination(location.pathname);
  const decision = resolveAdminRouteAccess({ destination, status, rolesLoaded, role });

  if (decision === "redirect-login") {
    const returnTo = getAdminReturnTo(location.pathname, location.searchStr, location.hash);
    return <Navigate to="/auth/login" search={{ returnTo }} replace />;
  }

  if (decision === "wait") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <p role="status" className="text-sm text-muted-foreground">
          Verificando acesso...
        </p>
      </main>
    );
  }

  if (decision === "restricted") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <section className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área não está disponível para o seu papel atual.
          </p>
          <Link
            to="/inicio"
            replace
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Voltar ao início
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
