import type { ReactNode } from "react";
import type { V2ShellPageConfig } from "./types";
import { V2PageHeader } from "./V2PageHeader";

export interface V2ShellContentProps {
  readonly page: V2ShellPageConfig;
  readonly children: ReactNode;
}

export function V2ShellContent({ page, children }: V2ShellContentProps) {
  return (
    <main
      id="vdn-v2-main-content"
      className={`vdn-v2-shell-content vdn-v2-shell-content--${page.width ?? "standard"}`}
      tabIndex={-1}
    >
      <V2PageHeader page={page} />
      <div className="vdn-v2-shell-content__body">{children}</div>
    </main>
  );
}
