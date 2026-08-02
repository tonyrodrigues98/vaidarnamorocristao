import * as React from "react";
import { Input } from "@/components/ui/input";

export type NumericInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange" | "inputMode" | "pattern"
> & {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  maxLength?: number;
  clampOnBlur?: boolean;
};

/**
 * App-style numeric input.
 * - text + inputMode="numeric" + pattern="[0-9]*" => numeric keyboard on mobile
 * - strips non-digits while typing; allows clearing the field
 * - optional clamp to [min, max] on blur (does not interrupt typing)
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    { value, onChange, min, max, maxLength = 6, clampOnBlur = true, onBlur, ...rest },
    ref,
  ) {
    const display = value === null || value === undefined ? "" : String(value);
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={display}
        maxLength={maxLength}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D+/g, "");
          onChange(digits.slice(0, maxLength));
        }}
        onBlur={(e) => {
          if (clampOnBlur && display !== "") {
            const n = Number(display);
            if (Number.isFinite(n)) {
              let clamped = n;
              if (typeof min === "number" && clamped < min) clamped = min;
              if (typeof max === "number" && clamped > max) clamped = max;
              if (clamped !== n) onChange(String(clamped));
            }
          }
          onBlur?.(e);
        }}
        {...rest}
      />
    );
  },
);
