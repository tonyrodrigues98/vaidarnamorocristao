import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
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

function fmtMult(n: number): string {
  return `×${n.toFixed(2).replace(/\.?0+$/, "")}`;
}

function pickMult(b: Buff): { value: number; isBoost: boolean } | null {
  // Mostra o desvio mais relevante: ganho (restore) tem prioridade sobre desgaste (decay)
  if (b.restore_mult !== 1) return { value: b.restore_mult, isBoost: b.restore_mult > 1 };
  if (b.decay_mult !== 1) return { value: b.decay_mult, isBoost: b.decay_mult < 1 };
  return null;
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
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {active.map((b) => {
        const m = pickMult(b);
        if (!m) return null;
        const Icon = m.isBoost ? TrendingUp : TrendingDown;
        const remaining = new Date(b.expires_at).getTime() - now;
        const tone = m.isBoost ? "text-emerald-600" : "text-rose-600";
        return (
          <span
            key={b.id}
            className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums", tone)}
            title={`${b.label?.trim() || b.kind} · ${formatRemaining(remaining)}`}
          >
            <Icon className="size-3" />
            {fmtMult(m.value)}
          </span>
        );
      })}
    </div>
  );
}