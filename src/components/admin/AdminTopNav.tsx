import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Eye,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  Newspaper,
  Settings as SettingsIcon,
  Sparkles,
  Sticker,
  Type,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type AdminNavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const NAV_ITEMS: AdminNavItem[] = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard },
  { to: "/admin/verificacoes", label: "Verificações", icon: BadgeCheck },
  { to: "/admin/fotos", label: "Fotos", icon: Eye },
  { to: "/admin/presentes", label: "Presentes", icon: Gift },
  { to: "/admin/stickers", label: "Stickers", icon: Sticker },
  { to: "/admin/fundos", label: "Fundos", icon: ImageIcon },
  { to: "/admin/molduras", label: "Molduras", icon: SettingsIcon },
  { to: "/admin/auras", label: "Auras", icon: Sparkles },
  { to: "/admin/gradientes-nome", label: "Gradientes", icon: Type },
  { to: "/admin/equipe-live", label: "Equipe live", icon: UsersRound },
];

void Newspaper;
void BookOpen;

type AdminTopNavProps = {
  /** Optional section eyebrow shown on the left (desktop). */
  eyebrow?: string;
  /** Compact variant for sub-pages: smaller padding, no back-to-app CTA. */
  compact?: boolean;
};

/**
 * Sticky admin context bar. Provides a consistent administrative
 * navigation strip across the /admin index and all sub-routes so the
 * panel feels like a dedicated back-office instead of a sequence of
 * disconnected pages. Hides on the marketing/social experience.
 */
export function AdminTopNav({ eyebrow, compact = false }: AdminTopNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur",
        compact ? "py-2" : "py-2.5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          to="/inicio"
          className="app-pressable inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          aria-label="Voltar ao app"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Voltar ao app</span>
        </Link>

        {eyebrow && (
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground md:inline-flex">
            {eyebrow}
          </span>
        )}

        <nav
          aria-label="Navegação administrativa"
          className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/admin"
                ? pathname === "/admin" || pathname === "/admin/"
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "app-pressable inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-[var(--rose)] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={active ? 2.6 : 2.1} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}