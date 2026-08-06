import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, Moon, Sun } from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { ROLE_CONFIG, type AppRole } from "@/lib/roles";
import { useTheme } from "@/lib/theme";

export function AdminTopBar({
  title,
  role,
  onOpenMenu,
}: {
  title: string;
  role: AppRole;
  onOpenMenu: () => void;
}) {
  const { resolvedTheme, toggle } = useTheme();
  const ThemeIcon = resolvedTheme === "light" ? Moon : Sun;
  const themeLabel = resolvedTheme === "light" ? "Usar tema escuro" : "Usar tema claro";

  return (
    <div className="vdn-admin-topbar">
      <button
        type="button"
        className="vdn-admin-topbar__action vdn-admin-topbar__menu"
        aria-label="Abrir menu administrativo"
        onClick={onOpenMenu}
      >
        <Menu aria-hidden />
      </button>
      <BrandLogo className="w-24" decorative />
      <div className="vdn-admin-topbar__title">
        <strong>{title}</strong>
        <span>{ROLE_CONFIG[role].label}</span>
      </div>
      <div className="vdn-admin-topbar__actions">
        <button
          type="button"
          className="vdn-admin-topbar__action"
          aria-label={themeLabel}
          title={themeLabel}
          onClick={toggle}
        >
          <ThemeIcon aria-hidden />
        </button>
        <Link to="/inicio" className="vdn-admin-topbar__back">
          <ArrowLeft aria-hidden />
          <span>Voltar ao app</span>
        </Link>
      </div>
    </div>
  );
}
