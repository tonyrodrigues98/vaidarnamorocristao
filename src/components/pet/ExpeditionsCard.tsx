import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Compass, Loader2, Sparkles, Clock, Lock, Zap, Gift, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/icons/CoinIcon";
import {
  claimExpedition,
  getActiveExpedition,
  rollAndGetTodayExpeditions,
  startExpedition,
} from "@/lib/petExpeditions";
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  type ActiveExpedition,
  type TodayExpedition,
} from "@/types/petExpedition";
import { cn } from "@/lib/utils";

function fmtRemaining(ms: number): string {
  if (ms <= 0) return "pronto";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}min` : `${h}h`;
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rm = min % 60;
  return rm ? `${h}h ${rm}min` : `${h}h`;
}

function iconFor(name: string) {
  const map = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return map[name] ?? Compass;
}

export function ExpeditionsCard({
  userPetId,
  onChanged,
  className,
}: {
  userPetId: string;
  onChanged?: () => void;
  className?: string;
}) {
  const [today, setToday] = useState<TodayExpedition[] | null>(null);
  const [active, setActive] = useState<ActiveExpedition | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    const [t, a] = await Promise.all([
      rollAndGetTodayExpeditions(),
      getActiveExpedition(userPetId),
    ]);
    setToday(t);
    setActive(a);
  }

  useEffect(() => {
    void reload();
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    const refresh = setInterval(() => void reload(), 30_000);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPetId]);

  async function handleStart(exp: TodayExpedition) {
    setBusy(exp.id);
    try {
      await startExpedition(exp.expedition_id, userPetId);
      toast.success("Pet enviado em expedição!");
      await reload();
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleClaim() {
    if (!active) return;
    setBusy(active.run_id);
    try {
      const result = await claimExpedition(active.run_id);
      const head =
        result.outcome === "crit"
          ? "Crítico!"
          : result.outcome === "success"
            ? "Sucesso!"
            : "Pet voltou cansado";
      toast.success(`${head} +${result.xp} XP · +${result.coins} moedas${result.item ? ` · ${result.item}` : ""}`);
      await reload();
      onChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (today === null) {
    return (
      <div className={cn("h-44 animate-pulse rounded-2xl border border-neutral-200 bg-white", className)} />
    );
  }
  if (today.length === 0 && !active) return null;

  return (
    <section
      className={cn("rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5", className)}
      aria-label="Expedições"
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
          <Compass className="size-4 text-indigo-500" />
          Expedições
        </h3>
        <span className="text-[11px] font-medium text-neutral-400">
          {today.filter((t) => t.sent_at).length}/{today.length} enviadas
        </span>
      </header>

      {active ? (
        <ActiveRunCard
          active={active}
          now={now}
          busy={busy === active.run_id}
          onClaim={handleClaim}
        />
      ) : (
        <ul className="space-y-2">
          {today.map((m) => {
            const Icon = iconFor(m.icon);
            const sent = !!m.sent_at;
            const disabled = sent || !!busy;
            return (
              <li
                key={m.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition",
                  sent
                    ? "border-neutral-200 bg-neutral-50 opacity-60"
                    : "border-neutral-200 bg-white",
                )}
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-neutral-900">{m.title}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1",
                        DIFFICULTY_TONE[m.difficulty],
                      )}
                    >
                      {DIFFICULTY_LABEL[m.difficulty]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="size-3" />
                      {fmtDuration(m.duration_minutes)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-yellow-600">
                      <Zap className="size-3" />-{m.energy_cost}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-sky-600">
                      <Sparkles className="size-3" />+{m.xp_reward}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-amber-600">
                      <CoinIcon className="size-3" />+{m.coin_reward}
                    </span>
                    {m.item_reward_label && (
                      <span className="inline-flex items-center gap-0.5 text-fuchsia-600">
                        <Gift className="size-3" />
                        {m.item_reward_label}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={disabled}
                  onClick={() => void handleStart(m)}
                >
                  {busy === m.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : sent ? (
                    <Lock className="size-3.5" />
                  ) : (
                    <>
                      <Send className="mr-1 size-3.5" />
                      Enviar
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ActiveRunCard({
  active,
  now,
  busy,
  onClaim,
}: {
  active: ActiveExpedition;
  now: number;
  busy: boolean;
  onClaim: () => void;
}) {
  const Icon = iconFor(active.icon);
  const total = active.duration_minutes * 60_000;
  const elapsed = Math.max(0, now - new Date(active.started_at).getTime());
  const remaining = new Date(active.ends_at).getTime() - now;
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const ready = remaining <= 0;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-200">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-neutral-900">{active.title}</p>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-500">
            <Clock className="size-3" />
            <span className="tabular-nums">
              {ready ? "Pronto para coletar" : `Volta em ${fmtRemaining(remaining)}`}
            </span>
          </div>
        </div>
        {ready && (
          <Button size="sm" onClick={onClaim} disabled={busy}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <><Gift className="mr-1 size-3.5" />Coletar</>}
          </Button>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}