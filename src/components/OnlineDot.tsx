import { usePresence } from "@/lib/presence";

type Props = {
  userId: string;
  className?: string;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
};

export function OnlineDot({ userId, className = "", size = "sm", showLabel = false }: Props) {
  const { isOnline } = usePresence();
  const on = isOnline(userId);
  if (!on) return null;
  const dim = size === "xs" ? "h-2 w-2" : size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title="Online agora">
      <span className={`relative inline-flex ${dim}`}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className={`relative inline-flex rounded-full bg-emerald-500 ring-2 ring-background ${dim}`} />
      </span>
      {showLabel && <span className="text-xs font-medium text-emerald-600">Online</span>}
    </span>
  );
}