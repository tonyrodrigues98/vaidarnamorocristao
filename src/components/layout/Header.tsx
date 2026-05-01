import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Shield } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--primary)] shadow-glow">
            <Heart className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">Encontros de Fé</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" asChild><Link to="/dashboard">Início</Link></Button>
              <Button variant="ghost" asChild><Link to="/pretendentes">Pretendentes</Link></Button>
              {isAdmin && (
                <Button variant="ghost" asChild>
                  <Link to="/admin"><Shield className="mr-1 h-4 w-4" /> Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth/login">Entrar</Link></Button>
              <Button asChild><Link to="/auth/signup">Criar conta</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}