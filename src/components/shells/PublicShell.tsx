import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { PublicNav } from "@/components/PublicNav";
import { brand } from "@/config/brand";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground" data-vdn-public-shell>
      <PublicNav />
      {children}
      <footer className="border-t border-border bg-background px-6 py-10 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p>{brand.displayName} · Comunidade cristã 18+</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/termos" className="hover:text-foreground">
              Termos
            </Link>
            <Link to="/manual" className="hover:text-foreground">
              Manual
            </Link>
            <Link to="/suporte" className="hover:text-foreground">
              Suporte
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
