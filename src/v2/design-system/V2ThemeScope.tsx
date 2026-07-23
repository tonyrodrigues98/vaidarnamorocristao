import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { createV2CssVariables, type V2ThemeName } from "./tokens";
import { v2cx } from "./utilities";

export interface V2ThemeScopeProps extends HTMLAttributes<HTMLDivElement> {
  theme?: V2ThemeName;
}

export const V2ThemeScope = forwardRef<HTMLDivElement, V2ThemeScopeProps>(
  ({ theme = "light", className, style, children, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      className={v2cx("vdn-v2", className)}
      data-vdn-v2=""
      data-vdn-v2-theme={theme}
      style={{ ...(createV2CssVariables(theme) as CSSProperties), ...style }}
    >
      {children}
    </div>
  ),
);

V2ThemeScope.displayName = "V2ThemeScope";
