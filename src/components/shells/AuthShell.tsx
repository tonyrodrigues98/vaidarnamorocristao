import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-[100dvh] bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-foreground"
      data-vdn-auth-shell
    >
      <Link to="/" className="mx-auto flex min-h-11 w-fit items-center gap-3 rounded-xl px-3">
        <BrandLogo className="w-36" />
      </Link>
      {children}
    </div>
  );
}
