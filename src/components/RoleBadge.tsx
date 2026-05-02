import { ShieldCheck } from "lucide-react";
import { COLOR_HEX, ROLE_CONFIG, type AppRole, type RoleColor } from "@/lib/roles";

type Props = {
  role: AppRole | null | undefined;
  color?: RoleColor | null;
  size?: "sm" | "md";
  showDescription?: boolean;
  className?: string;
};

export function RoleBadge({
  role,
  color,
  size = "sm",
  showDescription = false,
  className = "",
}: Props) {
  if (!role || role === "user") return null;
  const cfg = ROLE_CONFIG[role];
  const c = COLOR_HEX[(color ?? cfg.defaultColor) as RoleColor] ?? COLOR_HEX[cfg.defaultColor];
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ${padding}`}
        style={{ backgroundColor: c.bg, color: c.fg }}
        aria-label={cfg.label}
      >
        <ShieldCheck className={iconSize} />
        {cfg.label}
      </span>
      {showDescription && cfg.description && (
        <span className="text-[11px] text-muted-foreground">· {cfg.description}</span>
      )}
    </span>
  );
}

export function RoleRingStyle(color?: RoleColor | null): React.CSSProperties | undefined {
  if (!color) return undefined;
  const c = COLOR_HEX[color];
  if (!c) return undefined;
  return { boxShadow: `0 0 0 2px ${c.ring}, 0 0 0 4px hsl(var(--background))` };
}