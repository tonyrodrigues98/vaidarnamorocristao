import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { V2LoadingIndicator } from "./V2Feedback";
import { v2cx } from "./utilities";
import { buttonVariants, iconButtonVariants } from "./variants";

export interface V2ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const V2Button = forwardRef<HTMLElement, V2ButtonProps>(
  (
    {
      asChild = false,
      variant,
      size,
      loading = false,
      loadingLabel = "Carregando",
      leadingIcon,
      trailingIcon,
      disabled,
      className,
      children,
      onClick,
      type,
      ...props
    },
    ref,
  ) => {
    const unavailable = disabled || loading;
    const classes = v2cx(buttonVariants({ variant, size }), className);

    if (asChild) {
      if (loading || leadingIcon || trailingIcon) {
        throw new Error(
          "V2Button with asChild does not accept loading or icon props; compose content in the child.",
        );
      }

      const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      };

      return (
        <Slot
          {...props}
          ref={ref}
          className={classes}
          aria-disabled={disabled || undefined}
          data-disabled={disabled ? "" : undefined}
          onClick={handleClick}
          tabIndex={disabled ? -1 : props.tabIndex}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        {...props}
        ref={ref as never}
        type={type ?? "button"}
        className={classes}
        disabled={unavailable}
        aria-busy={loading || undefined}
        onClick={onClick}
      >
        {loading ? (
          <V2LoadingIndicator label={loadingLabel} size="small" />
        ) : (
          leadingIcon && (
            <span className="vdn-v2-button__icon" aria-hidden="true">
              {leadingIcon}
            </span>
          )
        )}
        <span>{children}</span>
        {!loading && trailingIcon && (
          <span className="vdn-v2-button__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  },
);

V2Button.displayName = "V2Button";

export interface V2IconButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children">,
    VariantProps<typeof iconButtonVariants> {
  label: string;
  icon: ReactNode;
  loading?: boolean;
}

export const V2IconButton = forwardRef<HTMLButtonElement, V2IconButtonProps>(
  ({ label, icon, loading = false, disabled, variant, size, className, type, ...props }, ref) => {
    if (!label.trim()) {
      throw new Error("V2IconButton requires a non-empty accessible label.");
    }

    return (
      <button
        {...props}
        ref={ref}
        type={type ?? "button"}
        className={v2cx(iconButtonVariants({ variant, size }), className)}
        aria-label={loading ? `${label}: carregando` : label}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
      >
        {loading ? (
          <V2LoadingIndicator label={`${label}: carregando`} size="small" />
        ) : (
          <span className="vdn-v2-icon-button__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  },
);

V2IconButton.displayName = "V2IconButton";
