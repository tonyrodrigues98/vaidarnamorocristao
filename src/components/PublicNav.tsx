import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Heart className="h-5 w-5 text-[var(--rose)]" />
          <span>VaiDarNamoro</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/sobre" className="hover:text-[var(--rose)]" activeProps={{ className: "text-[var(--rose)]" }}>Sobre</Link>
          <Link to="/como-funciona" className="hover:text-[var(--rose)]" activeProps={{ className: "text-[var(--rose)]" }}>Como funciona</Link>
          <Link to="/depoimentos" className="hover:text-[var(--rose)]" activeProps={{ className: "text-[var(--rose)]" }}>Depoimentos</Link>
          <Link to="/blog" className="hover:text-[var(--rose)]" activeProps={{ className: "text-[var(--rose)]" }}>Blog</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth/login" className="hidden text-sm font-medium text-muted-foreground hover:text-[var(--rose)] md:inline">Entrar</Link>
          <Link
            to="/auth/signup"
            className="rounded-full bg-[var(--rose)] px-4 py-2 text-sm font-semibold text-white shadow-glow hover:opacity-90"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </nav>
  );
}
