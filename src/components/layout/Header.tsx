import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Heart,
  LogOut,
  Shield,
  MessageCircle,
  Sparkles,
  Menu,
  X,
  User as UserIcon,
  Users,
  Newspaper,
  Ban,
  Share2,
  Gem,
  Sun,
  Moon,
  MoreHorizontal,
  ChevronDown,
  Heart as HeartIcon,
  LifeBuoy,
  BookHeart,
  Settings,
  Bell,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { getLastSeen } from "@/lib/lastSeen";
import { useTheme } from "@/lib/theme";
import { useNotifications } from "@/lib/notifications";
import { isMobileAppRoute } from "@/lib/layoutVisibility";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") return;
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
  const location = useLocation();
  const hideOnMobile = Boolean(user) && isMobileAppRoute(location.pathname);
  const { theme, toggle: toggleTheme } = useTheme();
  const { unread: notifUnread } = useNotifications(20);
  const [interestCount, setInterestCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newsCount, setNewsCount] = useState(0);
  const [devotionalCount, setDevotionalCount] = useState(0);
  const [anonCount, setAnonCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{
    photo_url: string | null;
    full_name: string | null;
    verified: boolean | null;
    equipped_frame_id: string | null;
    equipped_aura_id: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("photo_url, full_name, verified, equipped_frame_id, equipped_aura_id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setInterestCount(0);
      setUnreadCount(0);
      setNewsCount(0);
      setDevotionalCount(0);
      setAnonCount(0);
      return;
    }
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
        .from("matches")
        .select("id")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      const ids = (matches ?? []).map((m) => m.id);
      if (!ids.length) {
        if (!ignore) setUnreadCount(0);
        return;
      }
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
        .eq("kind", "news")
        .gt("published_at", since);
      if (!ignore) setNewsCount(count ?? 0);
    };
    const loadDevotional = async () => {
      const since = getLastSeen(user.id, "devotional");
      const { count } = await supabase
        .from("daily_posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .eq("kind", "devotional")
        .gt("published_at", since);
      if (!ignore) setDevotionalCount(count ?? 0);
    };
    const loadAnon = async () => {
      const { count } = await supabase
        .from("anonymous_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .in("status", ["pending", "hint_sent", "reveal_requested", "replied"]);
      if (!ignore) setAnonCount(count ?? 0);
    };
    loadInterests();
    loadUnread();
    loadNews();
    loadDevotional();
    loadAnon();
    const ch = supabase
      .channel("hdr-counters")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interests", filter: `receiver_id=eq.${user.id}` },
        loadInterests,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, loadUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_posts" }, () => {
        loadNews();
        loadDevotional();
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "anonymous_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        loadAnon,
      )
      .subscribe();
    const onSeen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined;
      if (!detail?.key) return;
      if (detail.key === "interests") loadInterests();
      if (detail.key === "news") loadNews();
      if (detail.key === "devotional") loadDevotional();
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
      <span className="ml-1 rounded-full bg-[#ff4f68] px-1.5 py-[1px] text-[10px] font-black text-white shadow-sm">
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  const relCount = unreadCount + interestCount + anonCount;
  const initials = (profile?.full_name ?? user?.email ?? "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className={
        hideOnMobile
          ? "sticky top-0 z-50 glass pt-safe-top hidden md:block"
          : "sticky top-0 z-50 glass pt-safe-top"
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 min-w-0">
        <Link to="/" className="flex items-center gap-2.5 group min-w-0 shrink-0" onClick={close}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-love shadow-glow transition-transform group-hover:scale-105">
            <Heart className="h-4 w-4 text-white" fill="white" />
          </div>
          <span className="tracking-tight font-extrabold text-xl lg:text-2xl truncate">
            VaiDar<span className="text-gradient">Namoro</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/inicio">Início</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-1 h-4 w-4" /> Dashboard
                </Link>
              </Button>
              {isApproved && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <HeartIcon className="h-4 w-4" /> Relacionamento
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      <Badge n={relCount} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[22rem] p-3">
                    <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                      Conexões
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <MegaItem
                        to="/pretendentes"
                        icon={<Gem className="h-4 w-4" />}
                        title="Pretendentes"
                        desc="Descobrir perfis"
                      />
                      <MegaItem
                        to="/interesses"
                        icon={<Sparkles className="h-4 w-4" />}
                        title="Interesses"
                        desc="Quem te quer"
                        badge={interestCount}
                      />
                      <MegaItem
                        to="/matches"
                        icon={<Users className="h-4 w-4" />}
                        title="Matches"
                        desc="Conexões mútuas"
                      />
                      <MegaItem
                        to="/conversas"
                        icon={<MessageCircle className="h-4 w-4" />}
                        title="Conversas"
                        desc="Suas mensagens"
                        badge={unreadCount}
                      />
                      <MegaItem
                        to="/recados"
                        icon={<Sparkles className="h-4 w-4" />}
                        title="Recados"
                        desc="Mensagens anônimas"
                        badge={anonCount}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Mais opções">
                    <MoreHorizontal className="h-4 w-4" />
                    {newsCount + devotionalCount > 0 && <Badge n={newsCount + devotionalCount} />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/devocional" className="flex items-center gap-2">
                      <BookHeart className="h-4 w-4" /> Devocional <Badge n={devotionalCount} />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/noticias" className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4" /> Notícias <Badge n={newsCount} />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => shareSite()}>
                    <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Notificações"
                className="relative"
              >
                <Link to="/notificacoes">
                  <Bell className="h-4 w-4" />
                  {notifUnread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[#ff4f68] px-1.5 py-[1px] text-[10px] font-black text-white shadow-sm">
                      {notifUnread > 99 ? "99+" : notifUnread}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card/60 p-1 pr-2 hover:bg-muted shrink-0"
                    aria-label="Menu do perfil"
                  >
                    <span className="flex h-8 w-8 items-center justify-center">
                      <DecoratedAvatar
                        photoUrl={profile?.photo_url ?? null}
                        fallback={initials}
                        size={32}
                        frameId={profile?.equipped_frame_id ?? null}
                        auraId={profile?.equipped_aura_id ?? null}
                      />
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{profile?.full_name ?? user.email}</span>
                    {profile?.verified && <VerifiedBadge size="sm" />}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> Ver perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/conta" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Conta
                    </Link>
                  </DropdownMenuItem>
                  {isApproved && (
                    <DropdownMenuItem asChild>
                      <Link to="/verificacao" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Verificação
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/suporte" className="flex items-center gap-2 text-[#ff4f68]">
                      <LifeBuoy className="h-4 w-4" /> Suporte
                    </Link>
                  </DropdownMenuItem>
                  {canSeeAdminPanel && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isApproved && (
                    <DropdownMenuItem asChild>
                      <Link to="/bloqueados" className="flex items-center gap-2">
                        <Ban className="h-4 w-4" /> Bloqueados
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full px-5">
                <Link to="/auth/signup">Criar conta</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={shareSite}>
                <Share2 className="mr-1 h-4 w-4" /> Compartilhar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
              >
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
                {/* Profile header */}
                <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
                  <span className="flex h-11 w-11 items-center justify-center">
                    <DecoratedAvatar
                      photoUrl={profile?.photo_url ?? null}
                      fallback={initials}
                      size={44}
                      frameId={profile?.equipped_frame_id ?? null}
                      auraId={profile?.equipped_aura_id ?? null}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      <span className="truncate">{profile?.full_name ?? user.email}</span>
                      {profile?.verified && <VerifiedBadge size="sm" />}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Tema">
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>

                <MobileItem to="/inicio" onClick={close}>
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4" /> Início
                  </span>
                </MobileItem>

                <MobileItem to="/dashboard" onClick={close}>
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </span>
                </MobileItem>

                <MobileItem to="/notificacoes" onClick={close}>
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Notificações
                  </span>
                  <Badge n={notifUnread} />
                </MobileItem>

                {isApproved && (
                  <MobileSection label="Relacionamento" defaultOpen>
                    <MobileItem to="/pretendentes" onClick={close}>
                      <span className="flex items-center gap-2">
                        <Gem className="h-4 w-4" /> Pretendentes
                      </span>
                    </MobileItem>
                    <MobileItem to="/interesses" onClick={close}>
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Interesses
                      </span>
                      <Badge n={interestCount} />
                    </MobileItem>
                    <MobileItem to="/matches" onClick={close}>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Matches
                      </span>
                    </MobileItem>
                    <MobileItem to="/conversas" onClick={close}>
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" /> Conversas
                      </span>
                      <Badge n={unreadCount} />
                    </MobileItem>
                    <MobileItem to="/recados" onClick={close}>
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Recados anônimos
                      </span>
                      <Badge n={anonCount} />
                    </MobileItem>
                  </MobileSection>
                )}

                <MobileSection label="Mais">
                  <MobileItem to="/devocional" onClick={close}>
                    <span className="flex items-center gap-2">
                      <BookHeart className="h-4 w-4" /> Devocional
                    </span>
                  </MobileItem>
                  <MobileItem to="/noticias" onClick={close}>
                    <span className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4" /> Notícias
                    </span>
                    <Badge n={newsCount} />
                  </MobileItem>
                  <button
                    onClick={() => {
                      close();
                      shareSite();
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                  >
                    <Share2 className="h-4 w-4" /> Compartilhar
                  </button>
                </MobileSection>

                <MobileSection label="Perfil">
                  <MobileItem to="/perfil" onClick={close}>
                    <span className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> Ver perfil
                    </span>
                  </MobileItem>
                  <MobileItem to="/conta" onClick={close}>
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Conta
                    </span>
                  </MobileItem>
                  {isApproved && (
                    <MobileItem to="/verificacao" onClick={close}>
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Verificação
                      </span>
                    </MobileItem>
                  )}
                  <MobileItem to="/suporte" onClick={close}>
                    <span className="flex items-center gap-2 text-[#ff4f68]">
                      <LifeBuoy className="h-4 w-4" /> Suporte
                    </span>
                  </MobileItem>
                  {canSeeAdminPanel && (
                    <MobileItem to="/admin" onClick={close}>
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Admin
                      </span>
                    </MobileItem>
                  )}
                  {isApproved && (
                    <MobileItem to="/bloqueados" onClick={close}>
                      <span className="flex items-center gap-2">
                        <Ban className="h-4 w-4" /> Bloqueados
                      </span>
                    </MobileItem>
                  )}
                  <button
                    onClick={async () => {
                      close();
                      await signOut();
                      navigate({ to: "/" });
                    }}
                    className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm text-muted-foreground hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </MobileSection>
              </>
            ) : (
              <>
                <MobileItem to="/auth/login" onClick={close}>
                  Entrar
                </MobileItem>
                <MobileItem to="/auth/signup" onClick={close}>
                  Criar conta
                </MobileItem>
                <button
                  onClick={() => {
                    close();
                    shareSite();
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-muted"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4" /> Modo claro
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" /> Modo escuro
                    </>
                  )}
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
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

function MobileSection({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="mt-1 rounded-xl border border-border/60 bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="flex flex-col gap-0.5 p-1">{children}</div>}
    </div>
  );
}

function MegaItem({
  to,
  icon,
  title,
  desc,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: number;
}) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-lg p-3 hover:bg-muted">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--petal)] text-[var(--rose)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-medium">
          {title}
          {badge && badge > 0 ? (
            <span className="rounded-full bg-[#ff4f68] px-1.5 py-[1px] text-[10px] font-black text-white shadow-sm">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </Link>
  );
}
