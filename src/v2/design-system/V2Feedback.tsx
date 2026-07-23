import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { v2cx } from "./utilities";

export const V2VisuallyHidden = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span {...props} ref={ref} className={v2cx("vdn-v2-visually-hidden", className)} />
  ),
);

V2VisuallyHidden.displayName = "V2VisuallyHidden";

export interface V2LoadingIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
  size?: "small" | "medium" | "large";
  visibleLabel?: boolean;
}

export const V2LoadingIndicator = forwardRef<HTMLSpanElement, V2LoadingIndicatorProps>(
  ({ label = "Carregando", size = "medium", visibleLabel = false, className, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={v2cx("vdn-v2-loading", `vdn-v2-loading--${size}`, className)}
      role="status"
      aria-live="polite"
    >
      <span className="vdn-v2-loading__spinner" aria-hidden="true" />
      {visibleLabel ? <span>{label}</span> : <V2VisuallyHidden>{label}</V2VisuallyHidden>}
    </span>
  ),
);

V2LoadingIndicator.displayName = "V2LoadingIndicator";

export interface V2SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  children?: never;
}

export const V2Skeleton = forwardRef<HTMLSpanElement, V2SkeletonProps>(
  ({ width = "100%", height = "1rem", className, style, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      aria-hidden="true"
      className={v2cx("vdn-v2-skeleton", className)}
      data-vdn-v2-skeleton=""
      style={{ width, height, ...style }}
    />
  ),
);

V2Skeleton.displayName = "V2Skeleton";

export function V2DecorativeIcon({ children }: { children: ReactNode }) {
  return (
    <span className="vdn-v2-button__icon" aria-hidden="true">
      {children}
    </span>
  );
}
