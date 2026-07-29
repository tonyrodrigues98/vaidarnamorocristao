import { Link } from "@tanstack/react-router";
import { Bell, Moon, Sun } from "lucide-react";

import { NativeAvatar } from "@/components/native-shell/NativeAvatar";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import { brand } from "@/config/brand";
import { getNativeTopBarTitle, getNativeUserInitials } from "@/config/native-top-bar";
import { useTheme } from "@/lib/theme";

export type NativeTopBarProps = {
  activeTab: FuturePrimaryTab;
  userLabel: string;
};

export function NativeTopBar({ activeTab, userLabel }: NativeTopBarProps) {
  const { resolvedTheme, toggle } = useTheme();
  const title = getNativeTopBarTitle(activeTab);
  const themeLabel = resolvedTheme === "light" ? "Usar tema escuro" : "Usar tema claro";
  const ThemeIcon = resolvedTheme === "light" ? Moon : Sun;

  return (
    <div className="vdn-native-top-bar" data-native-top-bar>
      <div className="vdn-native-top-bar__context">
        <img
          src={brand.assets.icon192}
          alt=""
          width="32"
          height="32"
          className="vdn-native-top-bar__brand-icon"
          aria-hidden="true"
        />
        <span className="vdn-native-top-bar__title">{title}</span>
      </div>

      <div className="vdn-native-top-bar__actions">
        <button
          type="button"
          className="vdn-native-top-bar__action"
          aria-label={themeLabel}
          title={themeLabel}
          onClick={toggle}
        >
          <ThemeIcon aria-hidden="true" />
        </button>
        <Link
          to="/notificacoes"
          preload="intent"
          className="vdn-native-top-bar__action"
          aria-label="Abrir notificações"
          title="Notificações"
        >
          <Bell aria-hidden="true" />
        </Link>
        <Link
          to="/perfil"
          preload="intent"
          className="vdn-native-top-bar__profile"
          aria-label="Abrir perfil"
          title="Perfil"
        >
          <NativeAvatar fallback={getNativeUserInitials(userLabel)} size="sm" />
        </Link>
      </div>
    </div>
  );
}
