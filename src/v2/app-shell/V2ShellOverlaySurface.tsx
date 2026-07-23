import { X } from "lucide-react";
import { useId, useRef, type ReactNode, type RefObject } from "react";
import { V2Heading, V2IconButton, V2Surface, V2Text } from "@/v2/design-system";
import { useV2OverlayFocus } from "./overlay-focus";

export interface V2ShellOverlaySurfaceProps {
  readonly id: string;
  readonly open: boolean;
  readonly title: string;
  readonly description?: string;
  readonly presentation: "sheet" | "popover" | "menu";
  readonly returnFocusRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function V2ShellOverlaySurface({
  id,
  open,
  title,
  description,
  presentation,
  returnFocusRef,
  onClose,
  children,
}: V2ShellOverlaySurfaceProps) {
  const containerRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useV2OverlayFocus({ open, onClose, containerRef, returnFocusRef });

  if (!open) return null;

  return (
    <div
      className={`vdn-v2-shell-overlay-layer vdn-v2-shell-overlay-layer--${presentation}`}
      data-vdn-v2-shell-overlay={presentation}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <V2Surface
        ref={containerRef}
        id={id}
        as="section"
        className={`vdn-v2-shell-overlay vdn-v2-shell-overlay--${presentation}`}
        elevation="two"
        padding="none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        {presentation === "sheet" ? <span className="vdn-v2-shell-sheet-handle" /> : null}
        <div className="vdn-v2-shell-overlay__header">
          <div>
            <V2Heading id={titleId} level={2} size="small">
              {title}
            </V2Heading>
            {description ? (
              <V2Text id={descriptionId} variant="caption" tone="muted">
                {description}
              </V2Text>
            ) : null}
          </div>
          <V2IconButton
            label={`Fechar ${title.toLocaleLowerCase("pt-BR")}`}
            icon={<X />}
            variant="ghost"
            size="small"
            onClick={onClose}
          />
        </div>
        <div className="vdn-v2-shell-overlay__body">{children}</div>
      </V2Surface>
    </div>
  );
}
