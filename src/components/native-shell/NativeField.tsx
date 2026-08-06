import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type NativeFieldSharedProps = {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  controlClassName?: string;
};

type NativeInputFieldProps = NativeFieldSharedProps &
  Omit<React.ComponentProps<typeof Input>, "id" | "className"> & {
    multiline?: false;
  };

type NativeTextareaFieldProps = NativeFieldSharedProps &
  Omit<React.ComponentProps<typeof Textarea>, "id" | "className"> & {
    multiline: true;
  };

export type NativeFieldProps = NativeInputFieldProps | NativeTextareaFieldProps;

export function NativeField(props: NativeFieldProps) {
  const generatedId = React.useId();
  const {
    id = `native-field-${generatedId.replaceAll(":", "")}`,
    label,
    description,
    error,
    className,
    controlClassName,
    multiline,
    ...controlProps
  } = props;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const controlClasses = cn(
    "min-h-11 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm",
    controlClassName,
  );

  return (
    <div className={cn("grid gap-2", className)} data-native-field="">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {multiline ? (
        <Textarea
          {...(controlProps as React.ComponentProps<typeof Textarea>)}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={controlClasses}
        />
      ) : (
        <Input
          {...(controlProps as React.ComponentProps<typeof Input>)}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={controlClasses}
        />
      )}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
