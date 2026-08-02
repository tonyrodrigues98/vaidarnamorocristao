import type { ReactNode } from "react";
import { AdminPage } from "@/components/admin-shell/AdminPage";

export function AdminShellContent({ children }: { children: ReactNode }) {
  return (
    <div className="vdn-admin-content">
      <AdminPage>{children}</AdminPage>
    </div>
  );
}
