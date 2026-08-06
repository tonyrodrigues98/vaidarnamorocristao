import { Link } from "@tanstack/react-router";
import { Compass, Home, MessageCircle, UserRound, UsersRound } from "lucide-react";

import { useNativePrimaryTabSelection } from "@/components/native-shell/useNativePrimaryTabSelection";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import { brand } from "@/config/brand";
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

export type NativeAdaptiveNavigationProps = {
  activeTab: FuturePrimaryTab;
  pathname: string;
  search?: string;
  hash?: string;
};

export function NativeAdaptiveNavigation({
  activeTab,
  pathname,
  search = "",
  hash = "",
}: NativeAdaptiveNavigationProps) {
  const { handleSelection } = useNativePrimaryTabSelection({
    activeTab,
    pathname,
    search,
    hash,
  });
  const home = nativePrimaryNavigation[0]!;

  return (
    <div className="vdn-native-adaptive-navigation" data-native-adaptive-navigation>
      <Link
        to={home.path}
        preload="intent"
        className="vdn-native-adaptive-navigation__brand"
        aria-label={brand.displayName}
        onClick={(event) => handleSelection(event, home)}
      >
        <img
          src={brand.assets.icon192}
          alt=""
          width="40"
          height="40"
          className="vdn-native-adaptive-navigation__brand-icon"
          aria-hidden="true"
        />
        <span className="vdn-native-adaptive-navigation__brand-name">{brand.displayName}</span>
      </Link>

      <ul className="vdn-native-adaptive-navigation__list">
        {nativePrimaryNavigation.map((item) => {
          const Icon = navigationIcons[item.icon];
          const active = item.id === activeTab;
          return (
            <li key={item.id} className="vdn-native-adaptive-navigation__item">
              <Link
                to={item.path}
                preload="intent"
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
                data-native-primary-tab={item.id}
                data-active={String(active)}
                className="vdn-native-adaptive-navigation__link"
                onClick={(event) => handleSelection(event, item)}
              >
                <span className="vdn-native-adaptive-navigation__indicator" aria-hidden="true" />
                <Icon
                  className="vdn-native-adaptive-navigation__icon"
                  strokeWidth={active ? 2.6 : 2.1}
                  aria-hidden="true"
                />
                <span className="vdn-native-adaptive-navigation__label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
