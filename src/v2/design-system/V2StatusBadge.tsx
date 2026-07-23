import { type HTMLAttributes, type ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { v2cx } from "./utilities";
import { statusBadgeVariants } from "./variants";

export interface V2StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  icon?: ReactNode;
}

export function V2StatusBadge({ tone, icon, className, children, ...props }: V2StatusBadgeProps) {
  return (
    <span {...props} className={v2cx(statusBadgeVariants({ tone }), className)}>
      {icon && (
        <span className="vdn-v2-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
