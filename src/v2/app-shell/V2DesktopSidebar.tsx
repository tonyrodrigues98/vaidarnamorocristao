import { Church, Menu, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { V2Button, V2IconButton, V2Text } from "@/v2/design-system";
import type { V2ShellNavigationId, V2ShellNavigationItem, V2SidebarMode } from "./types";
import { V2NavigationItem } from "./V2NavigationItem";

export interface V2DesktopSidebarProps {
  readonly mode: V2SidebarMode;
  readonly items: readonly V2ShellNavigationItem[];
  readonly activeId: V2ShellNavigationId;
  readonly onModeChange: (mode: V2SidebarMode) => void;
  readonly onNavigate?: (item: V2ShellNavigationItem) => void;
  readonly onCreateOpen: (trigger: HTMLElement) => void;
  readonly onMoreOpen: (trigger: HTMLElement) => void;
  readonly createOpen?: boolean;
  readonly moreOpen?: boolean;
}

export function V2DesktopSidebar({
  mode,
  items,
  activeId,
  onModeChange,
  onNavigate,
  onCreateOpen,
  onMoreOpen,
  createOpen = false,
  moreOpen = false,
}: V2DesktopSidebarProps) {
  const compact = mode === "compact";
  return (
    <aside
      className={`vdn-v2-shell-sidebar ${compact ? "is-compact" : "is-expanded"}`}
      aria-label="Navegação da plataforma"
    >
      <div className="vdn-v2-shell-sidebar__brand">
        <span className="vdn-v2-shell-brand__mark" aria-hidden="true">
          <Church />
        </span>
        {compact ? null : (
          <span>
            <strong>Vai Dar Namoro</strong>
            <V2Text as="span" variant="caption" tone="muted">
              Comunidade cristã
            </V2Text>
          </span>
        )}
      </div>

      <div className="vdn-v2-shell-sidebar__primary-action">
        {compact ? (
          <V2IconButton
            label="Criar"
            icon={<Plus />}
            variant="primary"
            aria-expanded={createOpen}
            aria-controls="vdn-v2-create-sheet"
            onClick={(event) => onCreateOpen(event.currentTarget)}
          />
        ) : (
          <V2Button
            variant="primary"
            leadingIcon={<Plus />}
            aria-expanded={createOpen}
            aria-controls="vdn-v2-create-sheet"
            onClick={(event) => onCreateOpen(event.currentTarget)}
          >
            Criar
          </V2Button>
        )}
      </div>

      <nav className="vdn-v2-shell-sidebar__navigation" aria-label="Destinos principais">
        {items.map((item) => (
          <V2NavigationItem
            key={item.id}
            item={item}
            activeId={activeId}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="vdn-v2-shell-sidebar__footer">
        <button
          type="button"
          className={["vdn-v2-shell-sidebar__more", compact ? "is-compact" : ""]
            .filter(Boolean)
            .join(" ")}
          aria-expanded={moreOpen}
          aria-controls="vdn-v2-more-menu"
          onClick={(event) => onMoreOpen(event.currentTarget)}
        >
          <Menu aria-hidden="true" />
          {compact ? null : <span>Mais</span>}
        </button>
        <V2IconButton
          label={compact ? "Expandir sidebar" : "Recolher sidebar"}
          icon={compact ? <PanelLeftOpen /> : <PanelLeftClose />}
          variant="ghost"
          size="small"
          onClick={() => onModeChange(compact ? "expanded" : "compact")}
        />
      </div>
    </aside>
  );
}
