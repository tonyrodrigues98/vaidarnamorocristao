import { forwardRef, type HTMLAttributes } from "react";
import type { VariantProps } from "class-variance-authority";
import { v2cx } from "./utilities";
import { surfaceVariants } from "./variants";

type V2SurfaceElement = "div" | "section" | "article" | "aside";

export interface V2SurfaceProps
  extends HTMLAttributes<HTMLElement>, VariantProps<typeof surfaceVariants> {
  as?: V2SurfaceElement;
}

export const V2Surface = forwardRef<HTMLElement, V2SurfaceProps>(
  ({ as: Element = "div", tone, elevation, padding, className, ...props }, ref) => (
    <Element
      {...props}
      ref={ref as never}
      className={v2cx(surfaceVariants({ tone, elevation, padding }), className)}
    />
  ),
);

V2Surface.displayName = "V2Surface";
