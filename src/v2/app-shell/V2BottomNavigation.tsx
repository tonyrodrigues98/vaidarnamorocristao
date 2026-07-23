import { Plus } from "lucide-react";
import type { V2ShellNavigationId, V2ShellNavigationItem } from "./types";
import { V2NavigationItem } from "./V2NavigationItem";

export interface V2BottomNavigationProps {
  readonly items: readonly V2ShellNavigationItem[];
  readonly activeId: V2ShellNavigationId | null;
  readonly onNavigate?: (item: V2ShellNavigationItem) => void;
  readonly onCreateOpen: (trigger: HTMLElement) => void;
  readonly createOpen?: boolean;
}

export function V2BottomNavigation({
  items,
  activeId,
  onNavigate,
  onCreateOpen,
  createOpen = false,
}: V2BottomNavigationProps) {
  const home = items.find((item) => item.id === "home");
  const community = items.find((item) => item.id === "community");
  const conversations = items.find((item) => item.id === "conversations");
  const profile = items.find((item) => item.id === "profile");
  const ordered = [home, community, conversations, profile];

  if (ordered.some((item) => !item)) {
    throw new Error("V2BottomNavigation requires home, community, conversations and profile.");
  }

  return (
    <nav className="vdn-v2-shell-bottom-nav" aria-label="Navegação principal">
      <div className="vdn-v2-shell-bottom-nav__inner">
        <V2NavigationItem
          item={home!}
          activeId={activeId}
          presentation="bottom"
          onNavigate={onNavigate}
        />
        <V2NavigationItem
          item={community!}
          activeId={activeId}
          presentation="bottom"
          onNavigate={onNavigate}
        />
        <button
          type="button"
          className="vdn-v2-shell-create-trigger"
          aria-label="Criar"
          aria-expanded={createOpen}
          aria-controls="vdn-v2-create-sheet"
          onClick={(event) => onCreateOpen(event.currentTarget)}
        >
          <span className="vdn-v2-shell-create-trigger__icon" aria-hidden="true">
            <Plus />
          </span>
          <span>Criar</span>
        </button>
        <V2NavigationItem
          item={conversations!}
          activeId={activeId}
          presentation="bottom"
          onNavigate={onNavigate}
        />
        <V2NavigationItem
          item={profile!}
          activeId={activeId}
          presentation="bottom"
          onNavigate={onNavigate}
        />
      </div>
    </nav>
  );
}
