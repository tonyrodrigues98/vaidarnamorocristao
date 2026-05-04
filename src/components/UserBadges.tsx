import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGE_META, type BadgeCode } from "@/lib/badges";

type Props = {
  userId: string;
  size?: "xs" | "sm" | "md";
  max?: number;
  className?: string;
};

const cache = new Map<string, BadgeCode[]>();
const listeners = new Map<string, Set<(b: BadgeCode[]) => void>>();

export function invalidateUserBadges(userId: string) {
  cache.delete(userId);
}

export function UserBadges({ userId, size = "sm", max = 3, className = "" }: Props) {
  const [codes, setCodes] = useState<BadgeCode[]>(() => cache.get(userId) ?? []);

  useEffect(() => {
    let alive = true;
    const cached = cache.get(userId);
    if (cached) setCodes(cached);
    (async () => {
      const { data } = await supabase
        .from("user_badges")
        .select("active, expires_at, badges(code)")
        .eq("user_id", userId)
        .eq("active", true);
      if (!alive) return;
      const list = ((data ?? []) as any[])
        .filter((r) => !r.expires_at || new Date(r.expires_at) > new Date())
        .map((r) => r.badges?.code as BadgeCode)
        .filter(Boolean);
      cache.set(userId, list);
      setCodes(list);
      listeners.get(userId)?.forEach((fn) => fn(list));
    })();
    const set = listeners.get(userId) ?? new Set();
    set.add(setCodes);
    listeners.set(userId, set);
    return () => {
      alive = false;
      set.delete(setCodes);
    };
  }, [userId]);

  if (!codes.length) return null;
  const shown = codes.slice(0, max);
  const padding = size === "xs" ? "px-1 py-0.5 text-[9px]" : size === "md" ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[10px]";
  const icon = size === "xs" ? "h-2.5 w-2.5" : size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {shown.map((code) => {
        const m = BADGE_META[code];
        if (!m) return null;
        const Icon = m.icon;
        return (
          <span
            key={code}
            title={m.description}
            className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding} ${m.premium ? "shadow-[0_0_10px_rgba(16,185,129,0.4)]" : ""}`}
            style={{ backgroundColor: m.bg, color: m.fg }}
          >
            <Icon className={icon} />
            <span className="hidden sm:inline">{m.name}</span>
          </span>
        );
      })}
    </span>
  );
}