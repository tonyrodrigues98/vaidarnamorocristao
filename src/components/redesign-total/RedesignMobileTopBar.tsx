import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";

import type { FuturePrimaryTab } from "@/config/app-destinations";
import { brand } from "@/config/brand";
import { getNativeSecondaryDestinationChrome } from "@/config/native-secondary-destinations";
import { getNativeDestinationTitle, getNativeUserInitials } from "@/config/native-top-bar";
import { useNotifications } from "@/lib/notifications";

import { RedesignAvatar } from "./primitives";

export function RedesignMobileTopBar({
  activeTab,
  destinationId,
  userLabel,
}: {
  activeTab: FuturePrimaryTab;
  destinationId: string;
  userLabel: string;
}) {
  const title = getNativeDestinationTitle(destinationId, activeTab);
  const secondaryChrome = getNativeSecondaryDestinationChrome(destinationId);
  const { unread } = useNotifications(20);

  return (
    <header className="rd-topbar" data-redesign-top-bar>
      <div className="rd-topbar__context">
        {secondaryChrome ? (
          <Link
            to={secondaryChrome.parentPath}
            className="rd-topbar__back"
            aria-label={`Voltar para ${getNativeDestinationTitle("", secondaryChrome.parentTab)}`}
          >
            <ArrowLeft aria-hidden />
          </Link>
        ) : (
          <img src={brand.assets.icon192} alt="" aria-hidden />
        )}
        <strong>{title}</strong>
      </div>
      <div className="rd-topbar__actions">
        <Link
          to="/notificacoes"
          className="rd-topbar__notification"
          aria-label={unread > 0 ? `Abrir notificações, ${unread} não lidas` : "Abrir notificações"}
        >
          <Bell aria-hidden />
          {unread > 0 ? <span>{Math.min(unread, 99)}</span> : null}
        </Link>
        <Link to="/perfil" aria-label="Abrir perfil">
          <RedesignAvatar alt="" fallback={getNativeUserInitials(userLabel)} size="md" />
        </Link>
      </div>
    </header>
  );
}
