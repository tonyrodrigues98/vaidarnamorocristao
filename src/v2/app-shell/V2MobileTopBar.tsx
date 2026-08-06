import { Bell, Church, Search, X } from "lucide-react";
import { forwardRef, useEffect, useId, useState } from "react";
import { V2Button, V2IconButton, V2Text, V2TextField, V2VisuallyHidden } from "@/v2/design-system";
import type { V2ShellUser } from "./types";

export interface V2MobileTopBarProps {
  readonly title: string;
  readonly user: V2ShellUser;
  readonly notificationCount?: number;
  readonly notificationsOpen?: boolean;
  readonly profileOpen?: boolean;
  readonly onNotificationsOpen: (trigger: HTMLElement) => void;
  readonly onProfileOpen: (trigger: HTMLElement) => void;
  readonly onSearch?: (query: string) => void;
}

export const V2MobileTopBar = forwardRef<HTMLElement, V2MobileTopBarProps>(
  (
    {
      title,
      user,
      notificationCount = 0,
      notificationsOpen = false,
      profileOpen = false,
      onNotificationsOpen,
      onProfileOpen,
      onSearch,
    },
    ref,
  ) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [avatarFailed, setAvatarFailed] = useState(false);
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const searchId = useId();

    useEffect(() => {
      setAvatarFailed(false);
      setAvatarLoaded(false);
    }, [user.avatarUrl]);

    return (
      <header ref={ref} className="vdn-v2-shell-topbar" data-vdn-v2-shell-topbar="">
        <div className="vdn-v2-shell-topbar__row">
          <div className="vdn-v2-shell-brand" aria-label="Vai Dar Namoro">
            <span className="vdn-v2-shell-brand__mark" aria-hidden="true">
              <Church />
            </span>
            <span className="vdn-v2-shell-brand__copy">
              <span className="vdn-v2-shell-brand__name">Vai Dar Namoro</span>
              <span className="vdn-v2-shell-brand__context">{title}</span>
            </span>
          </div>

          <div className="vdn-v2-shell-topbar__actions">
            <V2IconButton
              label={searchOpen ? "Fechar busca" : "Buscar"}
              icon={searchOpen ? <X /> : <Search />}
              variant="ghost"
              size="small"
              aria-expanded={searchOpen}
              aria-controls={searchId}
              onClick={() => setSearchOpen((current) => !current)}
            />
            <span className="vdn-v2-shell-topbar__notification">
              <V2IconButton
                label="Notificações"
                icon={<Bell />}
                variant="ghost"
                size="small"
                aria-expanded={notificationsOpen}
                aria-controls="vdn-v2-notifications"
                onClick={(event) => onNotificationsOpen(event.currentTarget)}
              />
              {notificationCount > 0 ? (
                <span className="vdn-v2-shell-topbar__badge" aria-hidden="true">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              className="vdn-v2-shell-avatar-button"
              aria-label={`Abrir menu de ${user.displayName}`}
              aria-expanded={profileOpen}
              aria-controls="vdn-v2-profile-menu"
              onClick={(event) => onProfileOpen(event.currentTarget)}
            >
              <span
                className="vdn-v2-shell-avatar vdn-v2-shell-avatar--initials"
                aria-hidden="true"
              >
                {user.initials}
              </span>
              {user.avatarUrl && !avatarFailed ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className={[
                    "vdn-v2-shell-avatar",
                    "vdn-v2-shell-avatar--image",
                    avatarLoaded ? "is-loaded" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onLoad={() => setAvatarLoaded(true)}
                  onError={() => setAvatarFailed(true)}
                />
              ) : null}
              <V2VisuallyHidden>{user.displayName}</V2VisuallyHidden>
            </button>
          </div>
        </div>

        {searchOpen ? (
          <form
            id={searchId}
            className="vdn-v2-shell-topbar__search"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch?.(query.trim());
            }}
          >
            <div className="vdn-v2-shell-topbar__search-control">
              <V2TextField
                label="Buscar na comunidade"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Pessoas, grupos e assuntos"
                autoComplete="off"
              />
              <V2Button type="submit" size="small">
                Buscar
              </V2Button>
            </div>
            <V2Text variant="caption" tone="muted">
              Busca demonstrativa, sem consulta externa.
            </V2Text>
          </form>
        ) : null}
      </header>
    );
  },
);

V2MobileTopBar.displayName = "V2MobileTopBar";
