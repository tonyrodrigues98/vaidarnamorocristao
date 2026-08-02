import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

export function DocumentShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground" data-vdn-document-shell>
      <Header />
      {children}
    </div>
  );
}
