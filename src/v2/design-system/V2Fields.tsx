import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { v2cx } from "./utilities";

type FieldContent = string | ReactNode;

interface V2FieldContract {
  label: FieldContent;
  description?: FieldContent;
  error?: FieldContent;
}

function combineIds(...ids: Array<string | undefined>): string | undefined {
  const present = ids.filter(Boolean);
  return present.length > 0 ? present.join(" ") : undefined;
}

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: FieldContent;
  required?: boolean;
}) {
  return (
    <label className="vdn-v2-field__label" htmlFor={htmlFor}>
      <span>{label}</span>
      {required && (
        <span className="vdn-v2-field__required" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function FieldMessages({
  description,
  descriptionId,
  error,
  errorId,
}: {
  description?: FieldContent;
  descriptionId: string;
  error?: FieldContent;
  errorId: string;
}) {
  return (
    <>
      {description && (
        <p className="vdn-v2-field__description" id={descriptionId}>
          {description}
        </p>
      )}
      {error && (
        <p className="vdn-v2-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export interface V2TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, V2FieldContract {}

export const V2TextField = forwardRef<HTMLInputElement, V2TextFieldProps>(
  (
    {
      id: providedId,
      label,
      description,
      error,
      required,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? `vdn-v2-field-${generatedId}`;
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;
    const describedBy = combineIds(
      ariaDescribedBy,
      description ? descriptionId : undefined,
      error ? errorId : undefined,
    );

    return (
      <div className="vdn-v2-field">
        <FieldLabel htmlFor={id} label={label} required={required} />
        <input
          {...props}
          ref={ref}
          id={id}
          required={required}
          className={v2cx("vdn-v2-field__control", className)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : props["aria-invalid"]}
        />
        <FieldMessages
          description={description}
          descriptionId={descriptionId}
          error={error}
          errorId={errorId}
        />
      </div>
    );
  },
);

V2TextField.displayName = "V2TextField";

export interface V2TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, V2FieldContract {}

export const V2TextArea = forwardRef<HTMLTextAreaElement, V2TextAreaProps>(
  (
    {
      id: providedId,
      label,
      description,
      error,
      required,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? `vdn-v2-textarea-${generatedId}`;
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;
    const describedBy = combineIds(
      ariaDescribedBy,
      description ? descriptionId : undefined,
      error ? errorId : undefined,
    );

    return (
      <div className="vdn-v2-field">
        <FieldLabel htmlFor={id} label={label} required={required} />
        <textarea
          {...props}
          ref={ref}
          id={id}
          required={required}
          className={v2cx("vdn-v2-field__control", className)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : props["aria-invalid"]}
        />
        <FieldMessages
          description={description}
          descriptionId={descriptionId}
          error={error}
          errorId={errorId}
        />
      </div>
    );
  },
);

V2TextArea.displayName = "V2TextArea";
