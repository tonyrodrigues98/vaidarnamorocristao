import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Shield, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Buff = {
  id: string;
  kind: string;
  label: string | null;
  restore_mult: number;
  decay_mult: number;
  source: string;
  expires_at: string;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h${rm}m` : `${h}h`;
}

function buffMeta(b: Buff): { Icon: LucideIcon; tone: string; label: string } {
  const isBoost = b.restore_mult > 1 || b.decay_mult < 1;
  const isDebuff = b.restore_mult < 1 || b.decay_mult > 1;
  const label =
    b.label?.trim() ||
    (b.restore_mult !== 1
      ? `Ganho ×${b.restore_mult.toFixed(2).replace(/\.?0+$/, "")}`
      : b.decay_mult !== 1
        ? `Desgaste ×${b.decay_mult.toFixed(2).replace(/\.?0+$/, "")}`
        : b.kind);
  if (isDebuff) return { Icon: TrendingDown, tone: "border-rose-200 bg-rose-50 text-rose-700", label };
  if (isBoost) return { Icon: TrendingUp, tone: "border-emerald-200 bg-emerald-50 text-emerald-700", label };
  return { Icon: Shield, tone: "border-neutral-200 bg-neutral-50 text-neutral-700", label };
}

export function PetBuffsHud({ petId, className }: { petId: string; className?: string }) {
  const [buffs, setBuffs] = useState<Buff[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("user_pet_buffs" as any)
        .select("id, kind, label, restore_mult, decay_mult, source, expires_at")
        .eq("user_pet_id", petId)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true });
      if (!cancelled && !error) setBuffs((data ?? []) as unknown as Buff[]);
    }
    void load();
    const reload = setInterval(load, 30_000);
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      cancelled = true;
      clearInterval(reload);
      clearInterval(tick);
    };
  }, [petId]);

  const active = buffs.filter((b) => new Date(b.expires_at).getTime() > now);
  if (active.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        <Sparkles className="size-3" />
        Ativos
      </span>
      {active.map((b) => {
        const { Icon, tone, label } = buffMeta(b);
        const remaining = new Date(b.expires_at).getTime() - now;
        return (
          <span
            key={b.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
              tone,
            )}
            title={`${label} · expira em ${formatRemaining(remaining)}`}
          >
            <Icon className="size-3" />
            <span className="max-w-[8rem] truncate">{label}</span>
            <span className="inline-flex items-center gap-0.5 text-neutral-500">
              <Clock className="size-2.5" />
              <span className="tabular-nums">{formatRemaining(remaining)}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}