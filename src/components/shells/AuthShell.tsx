import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Triangle } from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";

export function AuthShell({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex min-h-[100svh] flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-background px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-foreground sm:min-h-[100dvh] sm:px-4"
      data-vdn-auth-shell
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, filter: "blur(12px)", y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full flex-col items-center"
      >
        <Link to="/" className="flex min-h-11 w-fit items-center rounded-xl px-3">
          <BrandLogo className="w-32 sm:w-40" />
        </Link>
        <p className="mt-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
          <span>Conheça</span>
          <Triangle aria-hidden="true" className="size-2.5 fill-current stroke-none opacity-60" />
          <span>Conecte-se</span>
          <Triangle aria-hidden="true" className="size-2.5 fill-current stroke-none opacity-60" />
          <span>Pertença</span>
        </p>
      </motion.div>
      {children}
    </div>
  );
}
