import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Coins,
  Eye,
  Gift,
  Image,
  LayoutDashboard,
  PawPrint,
  Shirt,
  Sparkles,
  Sticker,
  Type,
  UsersRound,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import type {
  AdminDestination,
  AdminIconKey,
  AdminNavigationGroupId,
} from "@/config/admin-destinations";
import { BrandLogo } from "@/components/brand/BrandLogo";

const icons: Record<AdminIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  verification: BadgeCheck,
  photos: Eye,
  gifts: Gift,
  stickers: Sticker,
  backgrounds: Image,
  frames: WandSparkles,
  auras: Sparkles,
  gradients: Type,
  avatar: Shirt,
  pets: PawPrint,
  economy: Coins,
  live: UsersRound,
};

const groupLabels: Record<AdminNavigationGroupId, string> = {
  overview: "Visão geral",
  trust: "Confiança",
  content: "Conteúdo",
  catalog: "Catálogos",
  economy: "Economia",
  live: "Live",
};

export function AdminSidebar({
  destinations,
  activeId,
  onNavigate,
}: {
  destinations: readonly AdminDestination[];
  activeId: string;
  onNavigate?: () => void;
}) {
  const groups = Object.keys(groupLabels) as AdminNavigationGroupId[];

  return (
    <div className="vdn-admin-sidebar__inner">
      <Link to="/admin" className="vdn-admin-brand" onClick={onNavigate}>
        <BrandLogo className="w-36" />
        <span>
          <small>Administração</small>
        </span>
      </Link>
      <div className="vdn-admin-nav">
        {groups.map((group) => {
          const items = destinations.filter((destination) => destination.group === group);
          if (!items.length) return null;
          return (
            <section key={group} className="vdn-admin-nav__group">
              <h2>{groupLabels[group]}</h2>
              {items.map((destination) => {
                const Icon = icons[destination.icon];
                const active = destination.id === activeId;
                return (
                  <Link
                    key={destination.id}
                    to={destination.path}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    aria-label={destination.title}
                    title={destination.title}
                    className="vdn-admin-nav__item"
                  >
                    <Icon aria-hidden />
                    <span>{destination.shortLabel}</span>
                  </Link>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
