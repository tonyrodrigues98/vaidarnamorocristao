import { cva } from "class-variance-authority";

export const buttonVariants = cva("vdn-v2-button", {
  variants: {
    variant: {
      primary: "vdn-v2-button--primary",
      secondary: "vdn-v2-button--secondary",
      outline: "vdn-v2-button--outline",
      ghost: "vdn-v2-button--ghost",
      destructive: "vdn-v2-button--destructive",
      link: "vdn-v2-button--link",
    },
    size: {
      small: "vdn-v2-button--small",
      medium: "vdn-v2-button--medium",
      large: "vdn-v2-button--large",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "medium",
  },
});

export const iconButtonVariants = cva("vdn-v2-icon-button", {
  variants: {
    variant: {
      primary: "vdn-v2-icon-button--primary",
      secondary: "vdn-v2-icon-button--secondary",
      outline: "vdn-v2-icon-button--outline",
      ghost: "vdn-v2-icon-button--ghost",
      destructive: "vdn-v2-icon-button--destructive",
    },
    size: {
      small: "vdn-v2-icon-button--small",
      medium: "",
      large: "vdn-v2-icon-button--large",
    },
  },
  defaultVariants: {
    variant: "ghost",
    size: "medium",
  },
});

export const textVariants = cva("vdn-v2-text", {
  variants: {
    variant: {
      body: "vdn-v2-text--body",
      bodyLarge: "vdn-v2-text--body-large",
      label: "vdn-v2-text--label",
      caption: "vdn-v2-text--caption",
      navigation: "vdn-v2-text--navigation",
    },
    tone: {
      primary: "vdn-v2-text--primary",
      secondary: "vdn-v2-text--secondary",
      muted: "vdn-v2-text--muted",
      inverse: "vdn-v2-text--inverse",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "primary",
  },
});

export const headingVariants = cva("vdn-v2-heading", {
  variants: {
    size: {
      small: "vdn-v2-heading--small",
      medium: "vdn-v2-heading--medium",
      large: "vdn-v2-heading--large",
      display: "vdn-v2-heading--display",
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

export const surfaceVariants = cva("vdn-v2-surface", {
  variants: {
    tone: {
      default: "vdn-v2-surface--default",
      subtle: "vdn-v2-surface--subtle",
      elevated: "vdn-v2-surface--elevated",
      inverse: "vdn-v2-surface--inverse",
    },
    elevation: {
      none: "vdn-v2-surface--elevation-none",
      one: "vdn-v2-surface--elevation-one",
      two: "vdn-v2-surface--elevation-two",
    },
    padding: {
      none: "vdn-v2-surface--padding-none",
      small: "vdn-v2-surface--padding-small",
      medium: "vdn-v2-surface--padding-medium",
      large: "vdn-v2-surface--padding-large",
    },
  },
  defaultVariants: {
    tone: "default",
    elevation: "none",
    padding: "medium",
  },
});

export const statusBadgeVariants = cva("vdn-v2-badge", {
  variants: {
    tone: {
      neutral: "vdn-v2-badge--neutral",
      brand: "vdn-v2-badge--brand",
      success: "vdn-v2-badge--success",
      warning: "vdn-v2-badge--warning",
      danger: "vdn-v2-badge--danger",
      info: "vdn-v2-badge--info",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});
