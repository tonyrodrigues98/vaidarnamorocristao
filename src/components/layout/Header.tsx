import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Heart, LogOut, Shield, MessageCircle, Sparkles, Menu, X,
  User as UserIcon, Users, Newspaper, Globe, Ban, Share2, Gem, Sun, Moon, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { getLastSeen } from "@/lib/lastSeen";
import { useTheme } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

async function shareSite() {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const shareData = {
    title: "VaiDarNamoro",
    text: "Conheça pretendentes que compartilham sua fé.",
    url,
  };
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  } catch (e: any) {
    if (e?.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível compartilhar");
    }
  }
}

export function Header() {
  const { user, isAdmin, role, isApproved, signOut } = useAuth();
  const canSeeAdminPanel = isAdmin || role === "apresentador" || role === "moderador";
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const [interestCount, setInterestCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newsCount, setNewsCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) { setInterestCount(0); setUnreadCount(0); setNewsCount(0); setCommunityCount(0); return; }
    let ignore = false;
    const loadInterests = async () => {
      const since = getLastSeen(user.id, "interests");
      const { count } = await supabase
        .from("interests")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .gt("created_at", since);
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
    const loadNews = async () => {
      const since = getLastSeen(user.id, "news");
      const { count } = await supabase
        .from("daily_posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .gt("published_at", since);
      if (!ignore) setNewsCount(count ?? 0);
    };
    const loadCommunity = async () => {
      const since = getLastSeen(user.id, "community");
      const { count } = await supabase
        .from("global_messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", user.id)
        .gt("created_at", since);
      if (!ignore) setCommunityCount(count ?? 0);
    };
    loadInterests(); loadUnread(); loadNews(); loadCommunity();
    const ch = supabase.channel("hdr-counters")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests", filter: `receiver_id=eq.${user.id}` }, loadInterests)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, loadUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_posts" }, loadNews)
      .on("postgres_changes", { event: "*", schema: "public", table: "global_messages" }, loadCommunity)
      .subscribe();
    const onSeen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined;
      if (!detail?.key) return;
      if (detail.key === "interests") loadInterests();
      if (detail.key === "news") loadNews();
      if (detail.key === "community") loadCommunity();
    };
    window.addEventListener("lastSeen:update", onSeen);
    return () => {
      ignore = true;
      supabase.removeChannel(ch);
      window.removeEventListener("lastSeen:update", onSeen);
    };
  }, [user]);

  const close = () => setOpen(false);
  const Badge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="ml-1 rounded-full bg-[var(--rose)] px-1.5 py-[1px] text-[10px] font-bold text-white">{n > 99 ? "99+" : n}</span>
    ) : null;

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 min-w-0">
        <Link to="/" className="flex items-center gap-2.5 group min-w-0 shrink-0" onClick={close}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-love shadow-glow transition-transform group-hover:scale-105">
            <Heart className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="tracking-tight font-extrabold text-xl lg:text-2xl truncate">
            VaiDar<span className="text-gradient">Namoro</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-w-0 items-center gap-0.5 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="px-2"><Link to="/dashboard">Início</Link></Button>
              <Button variant="ghost" size="sm" asChild className="px-2">
                <Link to="/perfil"><UserIcon className="mr-1 h-4 w-4" /> Perfil</Link>
              </Button>
              {isApproved && (
                <>
                  <Button variant="ghost" size="sm" asChild className="px-2">
                    <Link to="/conversas"><MessageCircle className="mr-1 h-4 w-4" /> Conversas<Badge n={unreadCount} /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="px-2">
                    <Link to="/comunidade"><Globe className="mr-1 h-4 w-4" /> Comunidade<Badge n={communityCount} /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="px-2">
                    <Link to="/pretendentes"><Gem className="mr-1 h-4 w-4" /> Pretendentes</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="px-2">
                    <Link to="/interesses"><Sparkles className="mr-1 h-4 w-4" /> Interesses<Badge n={interestCount} /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="px-2">
                    <Link to="/matches"><Users className="mr-1 h-4 w-4" /> Matches</Link>
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2" aria-label="Mais opções">
                    <MoreHorizontal className="h-4 w-4" />
                    {(newsCount > 0) && <Badge n={newsCount} />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/noticias" className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4" /> Notícias <Badge n={newsCount} />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => shareSite()}>
                    <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                  </DropdownMenuItem>
                  {isApproved && (
                    <DropdownMenuItem asChild>
                      <Link to="/bloqueados" className="flex items-center gap-2">
                        <Ban className="h-4 w-4" /> Bloqueados
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {canSeeAdminPanel && (
                <Button variant="ghost" size="sm" asChild className="px-2">
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
              <Button variant="ghost" size="sm" onClick={shareSite}>
                <Share2 className="mr-1 h-4 w-4" /> Compartilhar
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
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
                <MobileItem to="/perfil" onClick={close}>
                  <span className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Perfil</span>
                </MobileItem>
                {isApproved && (
                  <>
                    <MobileItem to="/conversas" onClick={close}>
                      <span className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Conversas</span>
                      <Badge n={unreadCount} />
                    </MobileItem>
                    <MobileItem to="/comunidade" onClick={close}>
                      <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Comunidade</span>
                      <Badge n={communityCount} />
                    </MobileItem>
                    <MobileItem to="/pretendentes" onClick={close}>
                      <span className="flex items-center gap-2"><Gem className="h-4 w-4" /> Pretendentes</span>
                    </MobileItem>
                    <MobileItem to="/interesses" onClick={close}>
                      <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Interesses</span>
                      <Badge n={interestCount} />
                    </MobileItem>
                    <MobileItem to="/matches" onClick={close}>
                      <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Matches</span>
                    </MobileItem>
                  </>
                )}
                <MobileItem to="/noticias" onClick={close}>
                  <span className="flex items-center gap-2"><Newspaper className="h-4 w-4" /> Notícias</span>
                  <Badge n={newsCount} />
                </MobileItem>
                <button
                  onClick={() => { close(); shareSite(); }}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
                {isApproved && (
                  <MobileItem to="/bloqueados" onClick={close}>
                    <span className="flex items-center gap-2"><Ban className="h-4 w-4" /> Bloqueados</span>
                  </MobileItem>
                )}
                <button
                  onClick={() => { toggleTheme(); }}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                >
                  {theme === "dark" ? <><Sun className="h-4 w-4" /> Modo claro</> : <><Moon className="h-4 w-4" /> Modo escuro</>}
                </button>
                {canSeeAdminPanel && (
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
                <button
                  onClick={() => { close(); shareSite(); }}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                >
                  {theme === "dark" ? <><Sun className="h-4 w-4" /> Modo claro</> : <><Moon className="h-4 w-4" /> Modo escuro</>}
                </button>
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
