import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { brand } from "@/config/brand";

const publicLinks = [
  { to: "/sobre", label: "Sobre" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/depoimentos", label: "Histórias" },
  { to: "/blog", label: "Blog" },
  { to: "/instalar", label: "Instalar" },
] as const;

export function PublicNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <nav
      aria-label="Navegação pública"
      className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex min-h-11 items-center gap-2 rounded-xl px-2 font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img src={brand.assets.icon192} alt="" className="h-8 w-8 rounded-lg" />
          <span>{brand.displayName}</span>
        </Link>

        <div className="hidden items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
          {publicLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-11 items-center rounded-lg px-1 hover:text-[var(--rose)]"
              activeProps={{ className: "text-[var(--rose)]" }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/auth/login"
            className="hidden min-h-11 items-center px-2 text-sm font-medium text-muted-foreground hover:text-[var(--rose)] sm:flex"
          >
            Entrar
          </Link>
          <Link
            to="/auth/signup"
            className="hidden min-h-11 items-center rounded-full bg-[var(--rose)] px-4 text-sm font-semibold text-white shadow-glow hover:opacity-90 sm:flex"
          >
            Criar conta
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div id="public-mobile-menu" className="border-t border-border bg-background p-4 md:hidden">
          <div className="mx-auto grid max-w-6xl gap-1">
            {publicLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/auth/login"
              onClick={() => setOpen(false)}
              className="mt-2 flex min-h-11 items-center rounded-xl px-3 text-sm font-medium"
            >
              Entrar
            </Link>
            <Link
              to="/auth/signup"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-xl bg-[var(--rose)] px-4 text-sm font-semibold text-white"
            >
              Criar conta
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
