import type { ReactNode } from "react";

export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-background pb-[env(safe-area-inset-bottom)] text-foreground"
      data-vdn-onboarding-shell
    >
      {children}
    </div>
  );
}
