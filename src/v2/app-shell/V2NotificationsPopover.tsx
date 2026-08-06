import type { RefObject } from "react";
import { BellRing } from "lucide-react";
import { V2Button, V2Text } from "@/v2/design-system";
import type { V2ShellNotification } from "./types";
import { V2ShellOverlaySurface } from "./V2ShellOverlaySurface";

export interface V2NotificationsPopoverProps {
  readonly open: boolean;
  readonly notifications: readonly V2ShellNotification[];
  readonly returnFocusRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
}

export function V2NotificationsPopover({
  open,
  notifications,
  returnFocusRef,
  onClose,
}: V2NotificationsPopoverProps) {
  return (
    <V2ShellOverlaySurface
      id="vdn-v2-notifications"
      open={open}
      title="Notificações"
      description="Atualizações da sua comunidade."
      presentation="popover"
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      {notifications.length > 0 ? (
        <ol className="vdn-v2-shell-notification-list">
          {notifications.map((notification, index) => (
            <li key={notification.id} className={notification.unread ? "is-unread" : undefined}>
              <span className="vdn-v2-shell-notification-list__icon" aria-hidden="true">
                <BellRing />
              </span>
              <span>
                <strong>{notification.title}</strong>
                <V2Text as="span" variant="caption" tone="secondary">
                  {notification.description}
                </V2Text>
                <V2Text as="span" variant="caption" tone="muted">
                  {notification.timeLabel}
                </V2Text>
              </span>
              {notification.unread ? (
                <span className="vdn-v2-shell-unread-dot">
                  <span className="vdn-v2-visually-hidden">Não lida</span>
                </span>
              ) : null}
              {index === 0 ? <span data-vdn-v2-autofocus="" tabIndex={-1} /> : null}
            </li>
          ))}
        </ol>
      ) : (
        <div className="vdn-v2-shell-empty-state">
          <BellRing aria-hidden="true" />
          <strong>Tudo em dia</strong>
          <V2Text variant="body" tone="muted">
            Novas conversas, convites e eventos aparecerão aqui.
          </V2Text>
        </div>
      )}
      <V2Button variant="outline" size="small" onClick={onClose}>
        Ver central de notificações
      </V2Button>
    </V2ShellOverlaySurface>
  );
}
