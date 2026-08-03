import type { ReactNode } from "react";

export function RedesignDesktopContextPanel({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <aside className="rd-context-panel" aria-label="Contexto">
      {children}
    </aside>
  );
}
