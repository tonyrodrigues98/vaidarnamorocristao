import type { ReactNode } from "react";

type ActionBubbleProps = {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

export function ActionBubble({ icon, label, onClick, ariaLabel }: ActionBubbleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full bg-white shadow-md transition hover:scale-105"
    >
      {icon}
      {label && (
        <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
      )}
    </button>
  );
}

type RailProps = {
  children: ReactNode;
};

export function AvatarActionRail({ children }: RailProps) {
  return (
    <div className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-3">
      {children}
    </div>
  );
}
