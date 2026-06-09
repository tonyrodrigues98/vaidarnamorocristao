import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Heart, Home, User, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { PhotoImg } from "@/components/PhotoImg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AppNavRoute = "/inicio" | "/devocional" | "/comunidade" | "/pretendentes" | "/perfil";

type NavItem = {
  to: AppNavRoute;
  label: string;
  icon: typeof Home;
};

type NavProfile = {
  full_name: string | null;
  photo_url: string | null;
};

const navItems: NavItem[] = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/devocional", label: "Devocional", icon: BookOpen },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/pretendentes", label: "Pretendentes", icon: Heart },
  { to: "/perfil", label: "Perfil", icon: User },
];

function isActivePath(pathname: string, route: AppNavRoute) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    supabase
      .from("profiles")
      .select("full_name, photo_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile((data as NavProfile | null) ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const initials = useMemo(() => {
    const source = profile?.full_name ?? user?.email ?? "";
    return (
      source
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?"
    );
  }, [profile?.full_name, user?.email]);

  const nav = (
    <nav
      aria-label="Navegacao principal mobile"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      <div className="mx-auto max-w-md px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="grid h-[72px] grid-cols-5 overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/88 shadow-[0_-16px_48px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-card/88 dark:shadow-[0_-16px_48px_rgba(0,0,0,0.38)]">
          {navItems.map((item) => {
            const active = isActivePath(location.pathname, item.to);
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "tap flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors",
                  active
                    ? "text-[var(--rose)]"
                    : "text-muted-foreground hover:text-foreground active:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 min-w-8 items-center justify-center rounded-2xl transition",
                    active && "bg-[var(--petal)] shadow-sm dark:bg-white/10",
                  )}
                >
                  {item.to === "/perfil" ? (
                    profile?.photo_url ? (
                      <span
                        className={cn(
                          "block h-7 w-7 overflow-hidden rounded-full border bg-muted",
                          active ? "border-[var(--rose)]" : "border-border",
                        )}
                      >
                        <PhotoImg
                          src={profile.photo_url}
                          alt="Seu perfil"
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-love text-[10px] font-black text-white",
                          active && "ring-2 ring-[var(--rose)]/20",
                        )}
                      >
                        {initials !== "?" ? initials : <User className="h-4 w-4" />}
                      </span>
                    )
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2.1} />
                  )}
                </span>
                <span className="max-w-full truncate leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(nav, document.body);
}
