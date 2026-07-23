import { forwardRef, type HTMLAttributes, type LabelHTMLAttributes, type ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { v2cx } from "./utilities";
import { headingVariants, textVariants } from "./variants";

type V2TextElement = "p" | "span" | "div" | "label";

export interface V2TextProps
  extends Omit<HTMLAttributes<HTMLElement>, "color">, VariantProps<typeof textVariants> {
  as?: V2TextElement;
  children?: ReactNode;
  htmlFor?: LabelHTMLAttributes<HTMLLabelElement>["htmlFor"];
}

export const V2Text = forwardRef<HTMLElement, V2TextProps>(
  ({ as: Element = "p", variant, tone, className, ...props }, ref) => (
    <Element
      {...props}
      ref={ref as never}
      className={v2cx(textVariants({ variant, tone }), className)}
    />
  ),
);

V2Text.displayName = "V2Text";

export interface V2HeadingProps
  extends HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export const V2Heading = forwardRef<HTMLHeadingElement, V2HeadingProps>(
  ({ level, size, className, ...props }, ref) => {
    const Element = `h${level}` as const;
    return (
      <Element
        {...props}
        ref={ref}
        className={v2cx(headingVariants({ size }), className)}
        data-vdn-v2-heading-level={level}
      />
    );
  },
);

V2Heading.displayName = "V2Heading";
