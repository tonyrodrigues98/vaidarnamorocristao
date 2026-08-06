import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-[100svh] overflow-x-hidden overflow-y-auto bg-background px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(.5rem,env(safe-area-inset-top))] text-foreground sm:min-h-[100dvh] sm:px-4 sm:pt-[max(1rem,env(safe-area-inset-top))]"
      data-vdn-auth-shell
    >
      <Link to="/" className="mx-auto flex min-h-11 w-fit items-center rounded-xl px-3">
        <BrandLogo className="w-28 sm:w-36" />
      </Link>
      {children}
    </div>
  );
}
