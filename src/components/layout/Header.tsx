import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Shield, MessageCircle, Sparkles } from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [interestCount, setInterestCount] = useState(0);

  useEffect(() => {
    if (!user) { setInterestCount(0); return; }
    let ignore = false;
    const load = async () => {
      const { count } = await supabase
        .from("interests")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id);
      if (!ignore) setInterestCount(count ?? 0);
    };
    load();
    const ch = supabase.channel("hdr-interests")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests", filter: `receiver_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { ignore = true; supabase.removeChannel(ch); };
  }, [user]);

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
              <Button variant="ghost" size="sm" asChild className="relative">
                <Link to="/interesses">
                  <Sparkles className="mr-1 h-4 w-4" /> Interesses
                  {interestCount > 0 && (
                    <span className="ml-1 rounded-full bg-[var(--rose)] px-1.5 py-[1px] text-[10px] font-bold text-white">{interestCount}</span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/conversas"><MessageCircle className="mr-1 h-4 w-4" /> Conversas</Link>
              </Button>
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
