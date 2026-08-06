import { Link } from "@tanstack/react-router";
import { Compass, Home, MessageCircle, UserRound, UsersRound } from "lucide-react";

import { useNativePrimaryTabSelection } from "@/components/native-shell/useNativePrimaryTabSelection";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import {
  nativePrimaryNavigation,
  type NativePrimaryNavigationIcon,
} from "@/config/native-primary-navigation";

const navigationIcons = {
  home: Home,
  community: UsersRound,
  explore: Compass,
  messages: MessageCircle,
  profile: UserRound,
} as const satisfies Record<NativePrimaryNavigationIcon, typeof Home>;

export type NativeBottomNavigationProps = {
  activeTab: FuturePrimaryTab;
  pathname: string;
  search?: string;
  hash?: string;
};

export function NativeBottomNavigation({
  activeTab,
  pathname,
  search = "",
  hash = "",
}: NativeBottomNavigationProps) {
  const { handleSelection } = useNativePrimaryTabSelection({
    activeTab,
    pathname,
    search,
    hash,
  });

  return (
    <div className="vdn-native-bottom-navigation" data-native-bottom-navigation>
      <ul className="vdn-native-bottom-navigation__list">
        {nativePrimaryNavigation.map((item) => {
          const Icon = navigationIcons[item.icon];
          const active = item.id === activeTab;
          return (
            <li key={item.id} className="vdn-native-bottom-navigation__item">
              <Link
                to={item.path}
                preload="intent"
                aria-current={active ? "page" : undefined}
                data-native-primary-tab={item.id}
                data-active={String(active)}
                className="vdn-native-bottom-navigation__link min-h-11"
                onClick={(event) => handleSelection(event, item)}
              >
                <span className="vdn-native-bottom-navigation__indicator" aria-hidden="true" />
                <Icon
                  className="vdn-native-bottom-navigation__icon"
                  strokeWidth={active ? 2.6 : 2.1}
                  aria-hidden="true"
                />
                <span className="vdn-native-bottom-navigation__label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
