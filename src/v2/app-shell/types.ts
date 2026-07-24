import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { V2ThemeName } from "@/v2/design-system";

export type V2ShellNavigationId =
  | "home"
  | "community"
  | "create"
  | "conversations"
  | "profile"
  | "explore"
  | "dating"
  | "purpose"
  | "anonymous"
  | "shop"
  | "avatar"
  | "pets"
  | "verbo"
  | "settings";

export interface V2ShellNavigationItem {
  readonly id: V2ShellNavigationId;
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly badge?: number | string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
}

export interface V2ShellBreadcrumb {
  readonly label: string;
  readonly href?: string;
  readonly onSelect?: () => void;
}

export interface V2ShellAction {
  readonly label: string;
  readonly icon?: LucideIcon;
  readonly onSelect: () => void;
  readonly loading?: boolean;
  readonly disabled?: boolean;
}

export interface V2ShellPageConfig {
  readonly title: string;
  readonly subtitle?: string;
  readonly eyebrow?: string;
  readonly breadcrumbs?: readonly V2ShellBreadcrumb[];
  readonly primaryAction?: V2ShellAction;
  readonly onBack?: () => void;
  readonly contextRail?: ReactNode;
  readonly focused?: boolean;
  readonly width?: "narrow" | "standard" | "wide" | "fluid";
}

export interface V2ShellUser {
  readonly displayName: string;
  readonly supportingText?: string;
  readonly initials: string;
  readonly avatarUrl?: string;
  readonly status?: "online" | "away" | "offline";
}

export interface V2ShellNotification {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly timeLabel: string;
  readonly unread?: boolean;
}

export interface V2CreateAction {
  readonly id: "post" | "reflection" | "question" | "event" | "cinema";
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export type V2SidebarMode = "compact" | "expanded";
export type V2ShellOverlay = "create" | "notifications" | "profile" | "more" | null;

export interface V2AppShellProps {
  readonly children: ReactNode;
  readonly page: V2ShellPageConfig;
  readonly activeNavigationId: V2ShellNavigationId | null;
  readonly navigation: readonly V2ShellNavigationItem[];
  readonly secondaryNavigation?: readonly V2ShellNavigationItem[];
  readonly user: V2ShellUser;
  readonly notifications?: readonly V2ShellNotification[];
  readonly notificationCount?: number;
  readonly theme?: V2ThemeName;
  readonly sidebarMode?: V2SidebarMode;
  readonly defaultSidebarMode?: V2SidebarMode;
  readonly onSidebarModeChange?: (mode: V2SidebarMode) => void;
  readonly onNavigate?: (item: V2ShellNavigationItem) => void;
  readonly onCreateAction?: (action: V2CreateAction) => void;
  readonly onThemeChange?: (theme: V2ThemeName) => void;
  readonly onSearch?: (query: string) => void;
  readonly onLogout?: () => void | Promise<void>;
  readonly logoutLoading?: boolean;
}
