import { Link } from "@tanstack/react-router";
import { Compass, Home, MessageCircle, UserRound, UsersRound } from "lucide-react";
import type { MouseEvent } from "react";

import { NATIVE_SHELL_MAIN_ID } from "@/components/native-shell/NativeShellFrame";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import {
  NATIVE_TAB_RESELECT_EVENT,
  createNativeTabReselectDetail,
  nativePrimaryNavigation,
  resolveNativeReselectScrollBehavior,
  resolveNativeTabSelectionAction,
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
  function handleSelection(
    event: MouseEvent<HTMLAnchorElement>,
    item: (typeof nativePrimaryNavigation)[number],
  ) {
    const action = resolveNativeTabSelectionAction({
      item,
      activeTab,
      pathname,
      search,
      hash,
    });
    if (action !== "scroll-top") return;

    event.preventDefault();
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const behavior = resolveNativeReselectScrollBehavior(Boolean(reducedMotion));
    window.scrollTo({ top: 0, behavior });
    document.getElementById(NATIVE_SHELL_MAIN_ID)?.focus({ preventScroll: true });
    window.dispatchEvent(
      new CustomEvent(NATIVE_TAB_RESELECT_EVENT, {
        detail: createNativeTabReselectDetail(item),
      }),
    );
  }

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
