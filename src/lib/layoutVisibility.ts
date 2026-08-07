import { getDestinationBehavior } from "@/config/app-destinations";

/**
 * Backward-compatible layout helpers. Destination rules live exclusively in
 * `app-destinations`; these exports remain stable for existing consumers.
 */
export function shouldShowFooter(pathname: string): boolean {
  return getDestinationBehavior(pathname).footer;
}

export function isChatRoute(pathname: string): boolean {
  return getDestinationBehavior(pathname).visualViewport;
}

export function chatRouteHasBottomNav(pathname: string): boolean {
  const behavior = getDestinationBehavior(pathname);
  return behavior.visualViewport && behavior.mobileBottomNav;
}

export function isMobileAppRoute(pathname: string): boolean {
  return getDestinationBehavior(pathname).mobileAppShell;
}

export function shouldShowMobileAppShell(pathname: string, hasUser: boolean): boolean {
  return hasUser && getDestinationBehavior(pathname).mobileAppShell;
}

export function shouldShowMobileBottomNav(pathname: string): boolean {
  return getDestinationBehavior(pathname).mobileBottomNav;
}
