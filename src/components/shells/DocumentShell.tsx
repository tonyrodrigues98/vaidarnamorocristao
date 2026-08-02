import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";
import { useNativeShellRuntime } from "@/components/native-shell/NativeShellRuntimeContext";
import { PublicShell } from "@/components/shells/PublicShell";

export function DocumentShell({ children }: { children: ReactNode }) {
  const { active } = useNativeShellRuntime();

  if (!active) return <PublicShell>{children}</PublicShell>;

  return (
    <div className="min-h-screen bg-background text-foreground" data-vdn-document-shell>
      <Header />
      {children}
    </div>
  );
}
