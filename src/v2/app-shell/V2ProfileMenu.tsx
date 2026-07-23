import { CircleUserRound, LogOut, Moon, Settings, Sun } from "lucide-react";
import type { RefObject } from "react";
import { V2Text, type V2ThemeName } from "@/v2/design-system";
import type { V2ShellNavigationItem, V2ShellUser } from "./types";
import { V2ShellOverlaySurface } from "./V2ShellOverlaySurface";

export interface V2ProfileMenuProps {
  readonly open: boolean;
  readonly user: V2ShellUser;
  readonly theme: V2ThemeName;
  readonly profileItem?: V2ShellNavigationItem;
  readonly settingsItem?: V2ShellNavigationItem;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly onNavigate?: (item: V2ShellNavigationItem) => void;
  readonly onThemeChange?: (theme: V2ThemeName) => void;
}

export function V2ProfileMenu({
  open,
  user,
  theme,
  profileItem,
  settingsItem,
  returnFocusRef,
  onClose,
  onNavigate,
  onThemeChange,
}: V2ProfileMenuProps) {
  const nextTheme = theme === "light" ? "dark" : "light";
  const ThemeIcon = nextTheme === "dark" ? Moon : Sun;

  const navigate = (item: V2ShellNavigationItem | undefined) => {
    if (!item) return;
    onNavigate?.(item);
    onClose();
  };

  return (
    <V2ShellOverlaySurface
      id="vdn-v2-profile-menu"
      open={open}
      title={user.displayName}
      description={user.supportingText}
      presentation="menu"
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      <div className="vdn-v2-shell-profile-summary">
        <span className="vdn-v2-shell-avatar vdn-v2-shell-avatar--large" aria-hidden="true">
          {user.initials}
        </span>
        <span>
          <strong>{user.displayName}</strong>
          <V2Text as="span" variant="caption" tone="muted">
            {user.status === "online" ? "Disponível na comunidade" : "Presença discreta"}
          </V2Text>
        </span>
      </div>
      <div className="vdn-v2-shell-menu-list">
        <button type="button" data-vdn-v2-autofocus="" onClick={() => navigate(profileItem)}>
          <CircleUserRound aria-hidden="true" />
          <span>Ver meu perfil</span>
        </button>
        <button type="button" onClick={() => navigate(settingsItem)}>
          <Settings aria-hidden="true" />
          <span>Configurações</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onThemeChange?.(nextTheme);
            onClose();
          }}
        >
          <ThemeIcon aria-hidden="true" />
          <span>Usar tema {nextTheme === "dark" ? "escuro" : "claro"}</span>
        </button>
        <button type="button" disabled title="Ação desativada no showcase">
          <LogOut aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </V2ShellOverlaySurface>
  );
}
