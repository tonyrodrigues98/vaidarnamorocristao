import type { ReactNode } from "react";

import { PublicNav } from "@/components/PublicNav";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground" data-vdn-public-shell>
      <PublicNav />
      {children}
    </div>
  );
}
