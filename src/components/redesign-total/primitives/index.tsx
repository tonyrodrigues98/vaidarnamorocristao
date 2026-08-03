import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function RedesignPage({ className, ...props }: DivProps) {
  return <main className={cn("rd-page", className)} {...props} />;
}

export function RedesignSection({ className, ...props }: DivProps) {
  return <section className={cn("rd-section", className)} {...props} />;
}

export type RedesignCardProps = DivProps & {
  tone?: "default" | "subtle" | "coral" | "violet";
};

export function RedesignCard({ className, tone = "default", ...props }: RedesignCardProps) {
  return <div className={cn("rd-card", `rd-card--${tone}`, className)} {...props} />;
}

export function RedesignActionCard({ className, ...props }: DivProps) {
  return <div className={cn("rd-action-card", className)} {...props} />;
}

export function RedesignIconButton({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn("rd-icon-button", className)} {...props} />;
}

export type RedesignAvatarProps = {
  src?: string | null;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function RedesignAvatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: RedesignAvatarProps) {
  return (
    <span className={cn("rd-avatar", `rd-avatar--${size}`, className)}>
      {src ? <img src={src} alt={alt} /> : <span aria-hidden>{fallback}</span>}
    </span>
  );
}

export function RedesignBadge({ className, ...props }: DivProps) {
  return <span className={cn("rd-badge", className)} {...props} />;
}

export type RedesignTabItem<Key extends string> = {
  id: Key;
  label: string;
};

export function RedesignTabs<Key extends string>({
  items,
  active,
  onChange,
  label,
}: {
  items: readonly RedesignTabItem<Key>[];
  active: Key;
  onChange(id: Key): void;
  label: string;
}) {
  return (
    <div className="rd-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          className="rd-tabs__item"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function RedesignListItem({ className, ...props }: DivProps) {
  return <div className={cn("rd-list-item", className)} {...props} />;
}

export function RedesignEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rd-empty-state" role="status">
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function RedesignSkeleton({ className, ...props }: DivProps) {
  return <div className={cn("rd-skeleton", className)} aria-hidden {...props} />;
}

export function RedesignProgress({
  value,
  label,
  metadata,
}: {
  value: number;
  label: string;
  metadata?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="rd-progress">
      <div className="rd-progress__label">
        <span>{label}</span>
        {metadata ? <span>{metadata}</span> : null}
      </div>
      <div
        className="rd-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeValue}
      >
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function RedesignDivider({ className, ...props }: DivProps) {
  return <div className={cn("rd-divider", className)} role="separator" {...props} />;
}
