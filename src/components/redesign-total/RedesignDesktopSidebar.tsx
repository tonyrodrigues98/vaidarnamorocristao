import { Link } from "@tanstack/react-router";
import { Bell, CircleHelp, Settings } from "lucide-react";

import { useNativePrimaryTabSelection } from "@/components/native-shell/useNativePrimaryTabSelection";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import { brand } from "@/config/brand";
import { nativePrimaryNavigation } from "@/config/native-primary-navigation";
import { getNativeUserInitials } from "@/config/native-top-bar";

import { RedesignAvatar } from "./primitives";
import { redesignNavigationIcons } from "./RedesignNavigationIcons";

const secondaryLinks = [
  { label: "Notificações", to: "/notificacoes", Icon: Bell },
  { label: "Configurações", to: "/conta", Icon: Settings },
  { label: "Suporte", to: "/suporte", Icon: CircleHelp },
] as const;

export function RedesignDesktopSidebar({
  activeTab,
  pathname,
  search = "",
  hash = "",
  userLabel,
}: {
  activeTab: FuturePrimaryTab;
  pathname: string;
  search?: string;
  hash?: string;
  userLabel: string;
}) {
  const { handleSelection } = useNativePrimaryTabSelection({
    activeTab,
    pathname,
    search,
    hash,
  });

  return (
    <aside className="rd-sidebar" aria-label="Navegação principal">
      <Link to="/inicio" className="rd-sidebar__brand" aria-label={brand.displayName}>
        <img src={brand.assets.icon192} alt="" aria-hidden />
        <strong>{brand.displayName}</strong>
      </Link>

      <nav>
        <ul className="rd-sidebar__primary">
          {nativePrimaryNavigation.map((item) => {
            const Icon = redesignNavigationIcons[item.icon];
            const active = item.id === activeTab;
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  preload="intent"
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  data-redesign-primary-tab={item.id}
                  data-active={String(active)}
                  onClick={(event) => handleSelection(event, item)}
                >
                  <Icon aria-hidden strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="rd-sidebar__divider" />
        <ul className="rd-sidebar__secondary">
          {secondaryLinks.map(({ label, to, Icon }) => (
            <li key={to}>
              <Link to={to} title={label}>
                <Icon aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Link to="/conta" className="rd-sidebar__account">
        <RedesignAvatar alt="" fallback={getNativeUserInitials(userLabel)} size="md" />
        <span>
          <strong>Minha conta</strong>
          <small>Perfil e preferências</small>
        </span>
      </Link>
    </aside>
  );
}
