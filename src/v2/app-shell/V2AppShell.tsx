import { useCallback, useMemo, useRef, useState } from "react";
import { V2ThemeScope, type V2ThemeName } from "@/v2/design-system";
import { V2BottomNavigation } from "./V2BottomNavigation";
import { V2ContextRail } from "./V2ContextRail";
import { V2CreateSheet } from "./V2CreateSheet";
import { V2DesktopSidebar } from "./V2DesktopSidebar";
import { V2MobileTopBar } from "./V2MobileTopBar";
import { V2MoreMenu } from "./V2MoreMenu";
import { V2NotificationsPopover } from "./V2NotificationsPopover";
import { resolveV2OverlayState } from "./overlay-focus";
import { V2ProfileMenu } from "./V2ProfileMenu";
import { V2ShellContent } from "./V2ShellContent";
import type {
  V2AppShellProps,
  V2ShellNavigationItem,
  V2ShellOverlay,
  V2SidebarMode,
} from "./types";

export function V2AppShell({
  children,
  page,
  activeNavigationId,
  navigation,
  secondaryNavigation = [],
  user,
  notifications = [],
  notificationCount = notifications.filter((notification) => notification.unread).length,
  theme = "light",
  sidebarMode,
  defaultSidebarMode = "expanded",
  onSidebarModeChange,
  onNavigate,
  onCreateAction,
  onThemeChange,
  onSearch,
  onLogout,
  logoutLoading,
}: V2AppShellProps) {
  const [internalSidebarMode, setInternalSidebarMode] = useState<V2SidebarMode>(defaultSidebarMode);
  const [overlay, setOverlay] = useState<V2ShellOverlay>(null);
  const overlayTriggerRef = useRef<HTMLElement | null>(null);
  const resolvedSidebarMode = sidebarMode ?? internalSidebarMode;

  const openOverlay = useCallback((next: Exclude<V2ShellOverlay, null>, trigger: HTMLElement) => {
    overlayTriggerRef.current = trigger;
    setOverlay((current) => resolveV2OverlayState(current, next));
  }, []);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  const handleSidebarModeChange = (mode: V2SidebarMode) => {
    if (sidebarMode === undefined) setInternalSidebarMode(mode);
    onSidebarModeChange?.(mode);
  };

  const profileItem = useMemo(() => navigation.find((item) => item.id === "profile"), [navigation]);
  const settingsItem = useMemo(
    () => secondaryNavigation.find((item) => item.id === "settings"),
    [secondaryNavigation],
  );

  const handleNavigate = (item: V2ShellNavigationItem) => {
    closeOverlay();
    onNavigate?.(item);
  };

  return (
    <V2ThemeScope theme={theme} className="vdn-v2-shell-theme" data-vdn-v2-shell-theme="">
      <a className="vdn-v2-shell-skip-link" href="#vdn-v2-main-content">
        Pular para o conteúdo
      </a>
      <div
        className={[
          "vdn-v2-shell",
          `vdn-v2-shell--sidebar-${resolvedSidebarMode}`,
          page.focused ? "vdn-v2-shell--focused" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-vdn-v2-shell=""
        data-sidebar-mode={resolvedSidebarMode}
      >
        <V2DesktopSidebar
          mode={resolvedSidebarMode}
          items={navigation}
          activeId={activeNavigationId}
          onModeChange={handleSidebarModeChange}
          onNavigate={handleNavigate}
          onCreateOpen={(trigger) => openOverlay("create", trigger)}
          onMoreOpen={(trigger) => openOverlay("more", trigger)}
          createOpen={overlay === "create"}
          moreOpen={overlay === "more"}
        />

        <div className="vdn-v2-shell__workspace">
          <V2MobileTopBar
            title={page.title}
            user={user}
            notificationCount={notificationCount}
            notificationsOpen={overlay === "notifications"}
            profileOpen={overlay === "profile"}
            onNotificationsOpen={(trigger) => openOverlay("notifications", trigger)}
            onProfileOpen={(trigger) => openOverlay("profile", trigger)}
            onSearch={onSearch}
          />
          <div className="vdn-v2-shell__columns">
            <V2ShellContent page={page}>{children}</V2ShellContent>
            {page.focused ? null : <V2ContextRail>{page.contextRail}</V2ContextRail>}
          </div>
        </div>

        <V2BottomNavigation
          items={navigation}
          activeId={activeNavigationId}
          onNavigate={handleNavigate}
          onCreateOpen={(trigger) => openOverlay("create", trigger)}
          createOpen={overlay === "create"}
        />

        <V2CreateSheet
          open={overlay === "create"}
          returnFocusRef={overlayTriggerRef}
          onClose={closeOverlay}
          onSelect={onCreateAction}
        />
        <V2NotificationsPopover
          open={overlay === "notifications"}
          notifications={notifications}
          returnFocusRef={overlayTriggerRef}
          onClose={closeOverlay}
        />
        <V2ProfileMenu
          open={overlay === "profile"}
          user={user}
          theme={theme as V2ThemeName}
          profileItem={profileItem}
          settingsItem={settingsItem}
          returnFocusRef={overlayTriggerRef}
          onClose={closeOverlay}
          onNavigate={handleNavigate}
          onThemeChange={onThemeChange}
          onLogout={onLogout}
          logoutLoading={logoutLoading}
        />
        <V2MoreMenu
          open={overlay === "more"}
          items={secondaryNavigation}
          activeId={activeNavigationId}
          returnFocusRef={overlayTriggerRef}
          onClose={closeOverlay}
          onNavigate={handleNavigate}
        />
      </div>
    </V2ThemeScope>
  );
}
