import type { ReactNode } from "react";
import { useAdminShellRuntime } from "@/components/admin-shell/AdminShellRuntimeContext";

type AdminPageProps = {
  children: ReactNode;
  legacyClassName?: string;
};

export function AdminPage({ children, legacyClassName = "min-h-screen" }: AdminPageProps) {
  const { active } = useAdminShellRuntime();

  return (
    <div
      className={active ? "min-h-screen min-w-0 bg-background" : legacyClassName}
      data-vdn-admin-page={active ? "true" : undefined}
    >
      {children}
    </div>
  );
}
