import { plannedPrimaryDestinations, type FuturePrimaryTab } from "@/config/app-destinations";

export type NativePrimaryNavigationIcon = "home" | "community" | "explore" | "messages" | "profile";

export type NativePrimaryNavigationItem = {
  id: FuturePrimaryTab;
  label: string;
  path: string;
  icon: NativePrimaryNavigationIcon;
};

const nativePrimaryNavigationPresentation: Readonly<
  Record<FuturePrimaryTab, Pick<NativePrimaryNavigationItem, "label" | "icon">>
> = {
  home: { label: "Início", icon: "home" },
  community: { label: "Comunidade", icon: "community" },
  explore: { label: "Explorar", icon: "explore" },
  messages: { label: "Conversas", icon: "messages" },
  profile: { label: "Perfil", icon: "profile" },
};

export const nativePrimaryNavigation: readonly NativePrimaryNavigationItem[] =
  plannedPrimaryDestinations.map(({ id, path }) => ({
    id,
    path,
    ...nativePrimaryNavigationPresentation[id],
  }));

export type NativeTabSelectionAction = "navigate" | "reset-root" | "scroll-top";

export type NativeTabSelectionInput = {
  item: NativePrimaryNavigationItem;
  activeTab: FuturePrimaryTab;
  pathname: string;
  search?: string;
  hash?: string;
};

export function resolveNativeTabSelectionAction({
  item,
  activeTab,
  pathname,
  search = "",
  hash = "",
}: NativeTabSelectionInput): NativeTabSelectionAction {
  if (activeTab !== item.id || pathname !== item.path) return "navigate";
  if (search || hash) return "reset-root";
  return "scroll-top";
}

export const NATIVE_TAB_RESELECT_EVENT = "vdn:native-tab-reselect";

export function createNativeTabReselectDetail(item: NativePrimaryNavigationItem) {
  return { tab: item.id, path: item.path } as const;
}

export function resolveNativeReselectScrollBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? "auto" : "smooth";
}

export type NativeEditableTargetDescriptor = {
  tagName?: string;
  isContentEditable?: boolean;
};

export function isNativeEditableTarget({
  tagName = "",
  isContentEditable = false,
}: NativeEditableTargetDescriptor): boolean {
  return isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(tagName.toLocaleUpperCase());
}

export type NativeKeyboardVisibilityInput = {
  enabled: boolean;
  viewportWidth: number;
  layoutHeight: number;
  visualHeight?: number;
  editableFocused: boolean;
};

export function resolveNativeKeyboardVisibility({
  enabled,
  viewportWidth,
  layoutHeight,
  visualHeight,
  editableFocused,
}: NativeKeyboardVisibilityInput): boolean {
  if (!enabled || viewportWidth >= 768) return false;
  if (editableFocused) return true;
  if (visualHeight === undefined) return false;
  const reduction = layoutHeight - visualHeight;
  return reduction >= Math.max(120, layoutHeight * 0.2);
}
