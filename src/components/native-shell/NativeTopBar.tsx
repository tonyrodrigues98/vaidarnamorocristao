import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Moon, Sun } from "lucide-react";

import { NativeAvatar } from "@/components/native-shell/NativeAvatar";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { FuturePrimaryTab } from "@/config/app-destinations";
import { getNativeDestinationTitle, getNativeUserInitials } from "@/config/native-top-bar";
import { getNativeSecondaryDestinationChrome } from "@/config/native-secondary-destinations";
import { useTheme } from "@/lib/theme";

export type NativeTopBarProps = {
  activeTab: FuturePrimaryTab;
  destinationId: string;
  userLabel: string;
};

export function NativeTopBar({ activeTab, destinationId, userLabel }: NativeTopBarProps) {
  const { resolvedTheme, toggle } = useTheme();
  const title = getNativeDestinationTitle(destinationId, activeTab);
  const secondaryChrome = getNativeSecondaryDestinationChrome(destinationId);
  const themeLabel = resolvedTheme === "light" ? "Usar tema escuro" : "Usar tema claro";
  const ThemeIcon = resolvedTheme === "light" ? Moon : Sun;

  return (
    <div className="vdn-native-top-bar" data-native-top-bar>
      <div className="vdn-native-top-bar__context">
        {secondaryChrome ? (
          <Link
            to={secondaryChrome.parentPath}
            className="vdn-native-top-bar__action"
            aria-label={`Voltar para ${getNativeDestinationTitle("", secondaryChrome.parentTab)}`}
            title="Voltar"
          >
            <ArrowLeft aria-hidden="true" />
          </Link>
        ) : null}
        <BrandLogo className="w-24" decorative />
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
