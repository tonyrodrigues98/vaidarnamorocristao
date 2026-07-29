import { useCallback, type MouseEvent } from "react";

import { NATIVE_SHELL_MAIN_ID } from "@/components/native-shell/NativeShellFrame";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import {
  NATIVE_TAB_RESELECT_EVENT,
  createNativeTabReselectDetail,
  resolveNativeReselectScrollBehavior,
  resolveNativeTabSelectionAction,
  type NativePrimaryNavigationItem,
} from "@/config/native-primary-navigation";

export type UseNativePrimaryTabSelectionOptions = {
  activeTab: FuturePrimaryTab;
  pathname: string;
  search?: string;
  hash?: string;
};

export function useNativePrimaryTabSelection({
  activeTab,
  pathname,
  search = "",
  hash = "",
}: UseNativePrimaryTabSelectionOptions) {
  const handleSelection = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, item: NativePrimaryNavigationItem) => {
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
    },
    [activeTab, hash, pathname, search],
  );

  return { handleSelection };
}
