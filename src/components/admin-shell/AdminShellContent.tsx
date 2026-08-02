import type { ReactNode } from "react";

export function AdminShellContent({ children }: { children: ReactNode }) {
  return <div className="vdn-admin-content">{children}</div>;
}
