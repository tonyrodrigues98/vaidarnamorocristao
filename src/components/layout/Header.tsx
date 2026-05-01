import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Shield } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-love shadow-glow transition-transform group-hover:scale-105">
            <Heart className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Encontros<span className="text-gradient">.</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/dashboard">Início</Link></Button>
              <Button variant="ghost" size="sm" asChild><Link to="/pretendentes">Pretendentes</Link></Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin"><Shield className="mr-1 h-4 w-4" /> Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth/login">Entrar</Link></Button>
              <Button size="sm" asChild className="rounded-full px-5"><Link to="/auth/signup">Criar conta</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
