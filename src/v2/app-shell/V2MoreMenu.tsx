import type { RefObject } from "react";
import type { V2ShellNavigationId, V2ShellNavigationItem } from "./types";
import { V2NavigationItem } from "./V2NavigationItem";
import { V2ShellOverlaySurface } from "./V2ShellOverlaySurface";

export interface V2MoreMenuProps {
  readonly open: boolean;
  readonly items: readonly V2ShellNavigationItem[];
  readonly activeId: V2ShellNavigationId;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly onNavigate?: (item: V2ShellNavigationItem) => void;
}

export function V2MoreMenu({
  open,
  items,
  activeId,
  returnFocusRef,
  onClose,
  onNavigate,
}: V2MoreMenuProps) {
  return (
    <V2ShellOverlaySurface
      id="vdn-v2-more-menu"
      open={open}
      title="Mais experiências"
      description="Acesse outras áreas sem transformar Namoro no centro da plataforma."
      presentation="menu"
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      <nav className="vdn-v2-shell-more-navigation" aria-label="Outras experiências">
        {items.map((item) => (
          <V2NavigationItem
            key={item.id}
            item={item}
            activeId={activeId}
            presentation="menu"
            onNavigate={(selected) => {
              onNavigate?.(selected);
              onClose();
            }}
          />
        ))}
      </nav>
    </V2ShellOverlaySurface>
  );
}
