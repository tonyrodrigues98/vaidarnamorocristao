import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronRight, X } from "lucide-react";

type ElementProps = HTMLAttributes<HTMLElement>;
type DivProps = HTMLAttributes<HTMLDivElement>;

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function VisualZeroScreen({ className, ...props }: DivProps) {
  return <div className={cx("vz-screen", className)} {...props} />;
}

export function VisualZeroHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  ...props
}: Omit<ElementProps, "title"> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className={cx("vz-header", className)} {...props}>
      <div className="vz-header__copy">
        {eyebrow ? <span className="vz-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="vz-header__action">{action}</div> : null}
    </header>
  );
}

export function VisualZeroHero({ className, ...props }: DivProps) {
  return <section className={cx("vz-hero", className)} {...props} />;
}

export function VisualZeroSection({
  title,
  eyebrow,
  action,
  className,
  children,
  ...props
}: Omit<ElementProps, "title"> & {
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cx("vz-section", className)} {...props}>
      {title || eyebrow || action ? (
        <div className="vz-section__heading">
          <div>
            {eyebrow ? <span className="vz-eyebrow">{eyebrow}</span> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function VisualZeroGroupedList({ className, ...props }: DivProps) {
  return <div className={cx("vz-grouped-list", className)} {...props} />;
}

export function VisualZeroRow({
  leading,
  title,
  description,
  metadata,
  trailing,
  className,
  ...props
}: Omit<DivProps, "title"> & {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className={cx("vz-row", className)} {...props}>
      {leading ? <div className="vz-row__leading">{leading}</div> : null}
      <div className="vz-row__body">
        <div className="vz-row__title-line">
          <strong>{title}</strong>
          {metadata ? <span>{metadata}</span> : null}
        </div>
        {description ? <p>{description}</p> : null}
      </div>
      {trailing ? <div className="vz-row__trailing">{trailing}</div> : null}
    </div>
  );
}

export function VisualZeroActionRow({
  to,
  leading,
  title,
  description,
  metadata,
  trailing,
  className,
}: {
  to: string;
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to as never} className={cx("vz-action-row", className)}>
      <VisualZeroRow
        leading={leading}
        title={title}
        description={description}
        metadata={metadata}
        trailing={trailing ?? <ChevronRight aria-hidden />}
      />
    </Link>
  );
}

export function VisualZeroIconTile({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "coral" | "violet" | "mint" | "amber";
  className?: string;
  children: ReactNode;
}) {
  return <span className={cx("vz-icon-tile", `vz-icon-tile--${tone}`, className)}>{children}</span>;
}

export function VisualZeroAvatar({
  src,
  alt,
  fallback,
  size = "md",
  frameSrc,
  auraSrc,
  className,
}: {
  src?: string | null;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  frameSrc?: string | null;
  auraSrc?: string | null;
  className?: string;
}) {
  return (
    <span className={cx("vz-avatar", `vz-avatar--${size}`, className)}>
      {auraSrc ? <img className="vz-avatar__aura" src={auraSrc} alt="" aria-hidden /> : null}
      <span className="vz-avatar__media">
        {src ? <img src={src} alt={alt} /> : <span aria-label={alt}>{fallback}</span>}
      </span>
      {frameSrc ? <img className="vz-avatar__frame" src={frameSrc} alt="" aria-hidden /> : null}
    </span>
  );
}

export type VisualZeroSegment<Key extends string> = {
  id: Key;
  label: string;
  to?: string;
  search?: Record<string, unknown>;
};

export function VisualZeroSegmentedControl<Key extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly VisualZeroSegment<Key>[];
  value: Key;
  onChange?: (value: Key) => void;
  label: string;
}) {
  return (
    <div className="vz-segmented" role="tablist" aria-label={label}>
      {items.map((item) =>
        item.to ? (
          <Link
            key={item.id}
            to={item.to as never}
            search={item.search as never}
            role="tab"
            aria-selected={value === item.id}
            data-active={String(value === item.id)}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={value === item.id}
            data-active={String(value === item.id)}
            onClick={() => onChange?.(item.id)}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}

type ActionProps = {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
};

function VisualZeroAction({
  variant,
  children,
  to,
  className,
  ...props
}: ActionProps & { variant: "primary" | "secondary" }) {
  const classes = cx("vz-action", `vz-action--${variant}`, className);
  return to ? (
    <Link to={to as never} className={classes}>
      {children}
    </Link>
  ) : (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function VisualZeroPrimaryAction(props: ActionProps) {
  return <VisualZeroAction variant="primary" {...props} />;
}

export function VisualZeroSecondaryAction(props: ActionProps) {
  return <VisualZeroAction variant="secondary" {...props} />;
}

export function VisualZeroStatusPill({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "coral" | "violet" | "success" | "warning" | "danger";
}) {
  return <span className={cx("vz-status-pill", `vz-status-pill--${tone}`, className)} {...props} />;
}

export function VisualZeroProgressRing({
  value,
  label,
  size = 76,
}: {
  value: number;
  label: ReactNode;
  size?: number;
}) {
  const progress = Math.max(0, Math.min(100, value));
  const style = {
    "--vz-progress": `${progress * 3.6}deg`,
    "--vz-ring-size": `${size}px`,
  } as CSSProperties;
  return (
    <div
      className="vz-progress-ring"
      style={style}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <strong>{progress}%</strong>
      <span>{label}</span>
    </div>
  );
}

export function VisualZeroInlineProgress({
  value,
  label,
  metadata,
}: {
  value: number;
  label: ReactNode;
  metadata?: ReactNode;
}) {
  const progress = Math.max(0, Math.min(100, value));
  return (
    <div className="vz-inline-progress">
      <div>
        <span>{label}</span>
        {metadata ? <strong>{metadata}</strong> : null}
      </div>
      <progress
        max={100}
        value={progress}
        aria-label={typeof label === "string" ? label : undefined}
      />
    </div>
  );
}

export function VisualZeroEmpty({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("vz-empty", className)}>
      {icon}
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function VisualZeroLoading({
  rows = 4,
  label = "Carregando",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div className="vz-loading" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export function VisualZeroDivider() {
  return <div className="vz-divider" role="separator" />;
}

export function VisualZeroSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="vz-sheet-layer" role="presentation" onMouseDown={onClose}>
      <section
        className="vz-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </header>
        <div className="vz-sheet__content">{children}</div>
      </section>
    </div>
  );
}

export function VisualZeroMediaStrip({ className, ...props }: DivProps) {
  return <div className={cx("vz-media-strip", className)} {...props} />;
}
