import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Target, CheckCircle2, Sparkles, Clock } from "lucide-react";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { XpIcon } from "@/components/icons/XpIcon";
import { rollAndGetTodayMissions, DIFFICULTY_LABEL, type TodayMission } from "@/lib/missions";
import { cn } from "@/lib/utils";

/**
 * Card de missões diárias (3 por dia).
 * Progresso é avançado por triggers no banco — basta recarregar ao montar
 * e quando a tela do pet sinaliza uma ação (refreshKey).
 */
export function MissionsTodayCard({
  refreshKey,
  className,
}: {
  refreshKey?: number;
  className?: string;
}) {
  const [items, setItems] = useState<TodayMission[] | null>(null);
  const [resetIn, setResetIn] = useState<string>(() => timeUntilMidnight());

  useEffect(() => {
    const id = window.setInterval(() => setResetIn(timeUntilMidnight()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    rollAndGetTodayMissions()
      .then((data) => alive && setItems(data))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  if (items === null) {
    return (
      <div
        className={cn(
          "h-44 animate-pulse rounded-2xl border border-neutral-200 bg-white",
          className,
        )}
      />
    );
  }
  if (!items.length) return null;

  return (
    <section
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5",
        className,
      )}
      aria-label="Missões do dia"
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
          <Sparkles className="size-4 text-sky-500" />
          Missões de hoje
        </h3>
        <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-400">
          <span>
            {items.filter((m) => m.completed_at).length}/{items.length} feitas
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-1.5 py-0.5 tabular-nums text-neutral-500">
            <Clock className="size-3" />
            {resetIn}
          </span>
        </div>
      </header>
      <ul className="space-y-2.5">
        {items.map((m) => (
          <MissionRow key={m.id} mission={m} />
        ))}
      </ul>
    </section>
  );
}

function timeUntilMidnight(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diff = next.getTime() - now.getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function MissionRow({ mission }: { mission: TodayMission }) {
  const Icon =
    (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      mission.icon
    ] ?? Target;
  const done = !!mission.completed_at;
  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  return (
    <li
      className={cn(
        "rounded-xl border p-3 transition",
        done ? "border-emerald-200 bg-emerald-50/60" : "border-neutral-200 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            done ? "bg-emerald-100 text-emerald-600" : "bg-neutral-100 text-neutral-500",
          )}
        >
          {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "truncate text-[13px] font-medium",
                done ? "text-emerald-700 line-through" : "text-neutral-900",
              )}
            >
              {mission.title}
            </p>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
              {DIFFICULTY_LABEL[mission.difficulty] ?? mission.difficulty}
            </span>
          </div>
          {mission.description && (
            <p className="mt-0.5 truncate text-[11px] text-neutral-500">{mission.description}</p>
          )}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                done ? "bg-emerald-500" : "bg-gradient-to-r from-sky-500 to-blue-500",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
            <span className="tabular-nums text-neutral-500">
              {Math.min(mission.progress, mission.target)} / {mission.target}
            </span>
            <span className="inline-flex items-center gap-2 text-neutral-500">
              <span className="inline-flex items-center gap-0.5 text-sky-600">
                <XpIcon className="size-3.5" />
                {mission.xp_reward} XP
              </span>
              {mission.coin_reward > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <CoinIcon className="h-3.5 w-3.5" />
                  {mission.coin_reward}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}