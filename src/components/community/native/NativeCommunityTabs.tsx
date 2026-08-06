import { Link } from "@tanstack/react-router";

import { nativeCommunityTabs, type NativeCommunityTab } from "@/config/native-community-tabs";

export function NativeCommunityTabs({ activeTab }: { activeTab: NativeCommunityTab }) {
  return (
    <nav aria-label="Seções da comunidade" className="flex gap-2 overflow-x-auto pb-1">
      {nativeCommunityTabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            to="/comunidade"
            search={{ tab: tab.id }}
            aria-current={active ? "page" : undefined}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            data-status={active ? "active" : "inactive"}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
