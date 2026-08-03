import { Link } from "@tanstack/react-router";

import { useNativePrimaryTabSelection } from "@/components/native-shell/useNativePrimaryTabSelection";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import { nativePrimaryNavigation } from "@/config/native-primary-navigation";

import { redesignNavigationIcons } from "./RedesignNavigationIcons";

export function RedesignBottomNavigation({
  activeTab,
  pathname,
  search = "",
  hash = "",
}: {
  activeTab: FuturePrimaryTab;
  pathname: string;
  search?: string;
  hash?: string;
}) {
  const { handleSelection } = useNativePrimaryTabSelection({
    activeTab,
    pathname,
    search,
    hash,
  });

  return (
    <nav className="rd-bottom-nav" aria-label="Navegação principal">
      <ul>
        {nativePrimaryNavigation.map((item) => {
          const Icon = redesignNavigationIcons[item.icon];
          const active = item.id === activeTab;
          return (
            <li key={item.id}>
              <Link
                to={item.path}
                preload="intent"
                aria-current={active ? "page" : undefined}
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
    </nav>
  );
}
