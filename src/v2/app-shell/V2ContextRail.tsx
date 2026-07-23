import type { ReactNode } from "react";

export interface V2ContextRailProps {
  readonly children?: ReactNode;
}

export function V2ContextRail({ children }: V2ContextRailProps) {
  if (!children) return null;
  return (
    <aside className="vdn-v2-shell-context-rail" aria-label="Contexto da página">
      <div className="vdn-v2-shell-context-rail__inner">{children}</div>
    </aside>
  );
}
