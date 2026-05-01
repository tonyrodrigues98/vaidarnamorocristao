import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Heart, LogOut, Shield, MessageCircle, Sparkles, Menu, X,
  User as UserIcon, Users, Newspaper, Globe, Ban,
} from "lucide-react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [interestCount, setInterestCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setInterestCount(0); setUnreadCount(0); return; }
    let ignore = false;
    const loadInterests = async () => {
      const { count } = await supabase
        .from("interests")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id);
      if (!ignore) setInterestCount(count ?? 0);
    };
    const loadUnread = async () => {
      const { data: matches } = await supabase
        .from("matches").select("id")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      const ids = (matches ?? []).map((m) => m.id);
      if (!ids.length) { if (!ignore) setUnreadCount(0); return; }
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("match_id", ids)
        .neq("sender_id", user.id)
        .is("read_at", null);
      if (!ignore) setUnreadCount(count ?? 0);
    };
    loadInterests(); loadUnread();
    const ch = supabase.channel("hdr-counters")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests", filter: `receiver_id=eq.${user.id}` }, loadInterests)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, loadUnread)
      .subscribe();
    return () => { ignore = true; supabase.removeChannel(ch); };
  }, [user]);

  const close = () => setOpen(false);
  const Badge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="ml-1 rounded-full bg-[var(--rose)] px-1.5 py-[1px] text-[10px] font-bold text-white">{n > 99 ? "99+" : n}</span>
    ) : null;

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={close}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-love shadow-glow transition-transform group-hover:scale-105">
            <Heart className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Encontros<span className="text-gradient">.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/dashboard">Início</Link></Button>
              <Button variant="ghost" size="sm" asChild><Link to="/pretendentes">Pretendentes</Link></Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/comunidade"><Globe className="mr-1 h-4 w-4" /> Comunidade</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/noticias"><Newspaper className="mr-1 h-4 w-4" /> Notícias</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/interesses"><Sparkles className="mr-1 h-4 w-4" /> Interesses<Badge n={interestCount} /></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/matches"><Users className="mr-1 h-4 w-4" /> Matches</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/conversas"><MessageCircle className="mr-1 h-4 w-4" /> Conversas<Badge n={unreadCount} /></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/perfil"><UserIcon className="mr-1 h-4 w-4" /> Perfil</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/bloqueados"><Ban className="mr-1 h-4 w-4" /> Bloqueados</Link>
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

        {/* Mobile trigger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-card/95 backdrop-blur md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 p-3">
            {user ? (
              <>
                <MobileItem to="/dashboard" onClick={close}>Início</MobileItem>
                <MobileItem to="/pretendentes" onClick={close}>Pretendentes</MobileItem>
                <MobileItem to="/comunidade" onClick={close}>
                  <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Comunidade</span>
                </MobileItem>
                <MobileItem to="/noticias" onClick={close}>
                  <span className="flex items-center gap-2"><Newspaper className="h-4 w-4" /> Notícias</span>
                </MobileItem>
                <MobileItem to="/interesses" onClick={close}>
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Interesses</span>
                  <Badge n={interestCount} />
                </MobileItem>
                <MobileItem to="/matches" onClick={close}>
                  <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Matches</span>
                </MobileItem>
                <MobileItem to="/conversas" onClick={close}>
                  <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Conversas</span>
                  <Badge n={unreadCount} />
                </MobileItem>
                <MobileItem to="/perfil" onClick={close}>
                  <span className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Perfil</span>
                </MobileItem>
                <MobileItem to="/bloqueados" onClick={close}>
                  <span className="flex items-center gap-2"><Ban className="h-4 w-4" /> Bloqueados</span>
                </MobileItem>
                {isAdmin && (
                  <MobileItem to="/admin" onClick={close}>
                    <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Admin</span>
                  </MobileItem>
                )}
                <button
                  onClick={async () => { close(); await signOut(); navigate({ to: "/" }); }}
                  className="mt-1 flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </>
            ) : (
              <>
                <MobileItem to="/auth/login" onClick={close}>Entrar</MobileItem>
                <MobileItem to="/auth/signup" onClick={close}>Criar conta</MobileItem>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileItem({
  to, onClick, children,
}: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
      activeProps={{ className: "bg-[var(--petal)] text-[var(--rose)]" }}
    >
      {children}
    </Link>
  );
}
