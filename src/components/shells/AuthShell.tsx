import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="orha-auth-shell min-h-[100dvh] text-foreground" data-vdn-auth-shell>
      {children}
    </div>
  );
}
