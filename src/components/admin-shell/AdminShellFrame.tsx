import { useCallback, useState, type ReactNode } from "react";

import { AdminMobileDrawer } from "@/components/admin-shell/AdminMobileDrawer";
import { AdminShellContent } from "@/components/admin-shell/AdminShellContent";
import { AdminSidebar } from "@/components/admin-shell/AdminSidebar";
import { AdminTopBar } from "@/components/admin-shell/AdminTopBar";
import type { AdminDestination } from "@/config/admin-destinations";
import type { AppRole } from "@/lib/roles";

export function AdminShellFrame({
  destination,
  destinations,
  role,
  children,
}: {
  destination: AdminDestination;
  destinations: readonly AdminDestination[];
  role: AppRole;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div data-vdn-admin-shell data-admin-role={role}>
      <aside className="vdn-admin-primary" aria-label="Navegação administrativa">
        <AdminSidebar destinations={destinations} activeId={destination.id} />
      </aside>
      <div className="vdn-admin-workspace">
        <header className="vdn-admin-header">
          <AdminTopBar
            title={destination.title}
            role={role}
            onOpenMenu={() => setDrawerOpen(true)}
          />
        </header>
        <AdminShellContent>{children}</AdminShellContent>
      </div>
      <AdminMobileDrawer
        open={drawerOpen}
        destinations={destinations}
        activeId={destination.id}
        onClose={closeDrawer}
      />
    </div>
  );
}
