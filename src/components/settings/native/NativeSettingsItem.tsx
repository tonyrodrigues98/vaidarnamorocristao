import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

type NativeSettingsItemProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  showChevron?: boolean;
};

export function NativeSettingsItem({
  icon: Icon,
  title,
  description,
  to,
  onClick,
  disabled,
  showChevron = true,
}: NativeSettingsItemProps) {
  const content = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {showChevron && (to || onClick) ? (
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      ) : null}
    </>
  );
  const className =
    "flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
}
