import type { MouseEvent } from "react";
import { V2VisuallyHidden } from "@/v2/design-system";
import { formatV2NavigationBadge, isV2NavigationItemActive } from "./navigation";
import type { V2ShellNavigationId, V2ShellNavigationItem } from "./types";

export interface V2NavigationItemProps {
  readonly item: V2ShellNavigationItem;
  readonly activeId: V2ShellNavigationId | null;
  readonly presentation?: "sidebar" | "bottom" | "menu";
  readonly compact?: boolean;
  readonly onNavigate?: (item: V2ShellNavigationItem) => void;
}

export function V2NavigationItem({
  item,
  activeId,
  presentation = "sidebar",
  compact = false,
  onNavigate,
}: V2NavigationItemProps) {
  const active = isV2NavigationItemActive(activeId, item);
  const Icon = item.icon;
  const badge = formatV2NavigationBadge(item.badge);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (onNavigate) {
      event.preventDefault();
      onNavigate(item);
    }
  };

  return (
    <a
      href={item.href}
      className={[
        "vdn-v2-shell-navigation-item",
        `vdn-v2-shell-navigation-item--${presentation}`,
        active ? "is-active" : "",
        compact ? "is-compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-current={active ? "page" : undefined}
      aria-disabled={item.disabled || undefined}
      title={compact ? item.label : item.disabledReason}
      onClick={handleClick}
      data-vdn-v2-navigation-id={item.id}
    >
      <span className="vdn-v2-shell-navigation-item__icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="vdn-v2-shell-navigation-item__label">{item.label}</span>
      {badge ? (
        <span className="vdn-v2-shell-navigation-item__badge" aria-label={`${badge} pendentes`}>
          {badge}
        </span>
      ) : null}
      {item.disabledReason ? <V2VisuallyHidden>{item.disabledReason}</V2VisuallyHidden> : null}
    </a>
  );
}
