import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PET_CARE_ICON } from "@/components/pet/PetNeedsHud";
import { PET_CARE_LABEL, type PetCareKind } from "@/types/petCare";

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
  if (b.restore_mult !== 1) return { value: b.restore_mult, isBoost: b.restore_mult > 1 };
  if (b.decay_mult !== 1) return { value: b.decay_mult, isBoost: b.decay_mult < 1 };
  return null;
}

// Agrupa por necessidade afetada, mantendo o efeito mais forte por kind
function dedupe(buffs: Buff[]): Array<{ kind: string; mult: number; isBoost: boolean; expires: number; label: string }> {
  const map = new Map<string, { kind: string; mult: number; isBoost: boolean; expires: number; label: string }>();
  for (const b of buffs) {
    const m = pickMult(b);
    if (!m) continue;
    const exp = new Date(b.expires_at).getTime();
    const cur = map.get(b.kind);
    const score = Math.abs(Math.log(m.value)); // intensidade do desvio
    const curScore = cur ? Math.abs(Math.log(cur.mult)) : -1;
    if (!cur || score > curScore) {
      map.set(b.kind, {
        kind: b.kind,
        mult: m.value,
        isBoost: m.isBoost,
        expires: exp,
        label: b.label?.trim() || PET_CARE_LABEL[b.kind as PetCareKind] || b.kind,
      });
    }
  }
  return Array.from(map.values());
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
  const grouped = dedupe(active);
  if (grouped.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {grouped.map((g) => {
        const Icon = PET_CARE_ICON[g.kind as PetCareKind] ?? Sparkles;
        const tone = g.isBoost ? "text-emerald-600" : "text-rose-600";
        const remaining = g.expires - now;
        return (
          <span
            key={g.kind}
            className={cn("inline-flex items-center gap-1 text-[11px] font-medium tabular-nums", tone)}
            title={`${g.label} · ${fmtMult(g.mult)} · ${formatRemaining(remaining)}`}
          >
            <Icon className="size-3 text-neutral-500" />
            {fmtMult(g.mult)}
          </span>
        );
      })}
    </div>
  );
}