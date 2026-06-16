import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Compass, Loader2, Sparkles, Clock, Lock, Zap, Gift, Send, CheckCircle2 } from "lucide-react";
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
  type ClaimResult,
  type TodayExpedition,
} from "@/types/petExpedition";
import { cn } from "@/lib/utils";
import { ExpeditionRewardModal } from "@/components/pet/ExpeditionRewardModal";
import { useSignedExpeditionUrl } from "@/lib/expeditionImageUrl";
import { ExpeditionLiveSceneModal } from "@/components/pet/ExpeditionLiveSceneModal";

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
  petImage,
  petName,
}: {
  userPetId: string;
  onChanged?: () => void;
  className?: string;
  petImage?: string | null;
  petName?: string;
}) {
  const [today, setToday] = useState<TodayExpedition[] | null>(null);
  const [active, setActive] = useState<ActiveExpedition | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ result: ClaimResult; title: string } | null>(null);
  const [sceneOpen, setSceneOpen] = useState(false);

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
    const claimedTitle = active.title;
    try {
      const result = await claimExpedition(active.run_id);
      setReveal({ result, title: claimedTitle });
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
          onOpenScene={() => setSceneOpen(true)}
        />
      ) : (
        <ul className="space-y-2">
          {today.map((m) => {
            const sent = !!m.sent_at;
            const disabled = sent || !!busy;
            return (
              <ExpeditionRow
                key={m.id}
                exp={m}
                sent={sent}
                disabled={disabled}
                busy={busy === m.id}
                onStart={() => void handleStart(m)}
              />
            );
          })}
        </ul>
      )}
      <ExpeditionRewardModal
        open={!!reveal}
        result={reveal?.result ?? null}
        expeditionTitle={reveal?.title ?? ""}
        onClose={() => setReveal(null)}
      />
      <ExpeditionLiveSceneModal
        open={sceneOpen && !!active}
        active={active}
        busy={!!active && busy === active.run_id}
        onClose={() => setSceneOpen(false)}
        petImage={petImage ?? null}
        petName={petName ?? "Seu pet"}
        onClaim={async () => {
          await handleClaim();
          setSceneOpen(false);
        }}
      />
    </section>
  );
}

function ExpeditionRow({
  exp: m,
  sent,
  disabled,
  busy,
  onStart,
}: {
  exp: TodayExpedition;
  sent: boolean;
  disabled: boolean;
  busy: boolean;
  onStart: () => void;
}) {
  const Icon = iconFor(m.icon);
  const img = useSignedExpeditionUrl(m.image_url);
  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border transition",
        sent ? "border-neutral-200 bg-neutral-50" : "border-neutral-200 bg-white",
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-indigo-50">
        {img ? (
          <img
            src={img}
            alt=""
            className={cn("size-full object-cover transition", sent && "scale-[1.02]")}
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center text-indigo-400">
            <Icon className="size-8" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
        <span
          className={cn(
            "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 backdrop-blur",
            DIFFICULTY_TONE[m.difficulty],
          )}
        >
          {DIFFICULTY_LABEL[m.difficulty]}
        </span>
        <h4 className="absolute inset-x-3 bottom-2 text-[14px] font-semibold leading-snug text-white drop-shadow">
          {m.title}
        </h4>
        {sent && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[3px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-emerald-600 shadow-lg ring-1 ring-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Concluída
            </span>
          </div>
        )}
      </div>
      <div className="space-y-3 p-3">
        {m.description && (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-neutral-600">
            {m.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {fmtDuration(m.duration_minutes)}
          </span>
          <span className="inline-flex items-center gap-1 text-yellow-600">
            <Zap className="size-3" />-{m.energy_cost}
          </span>
          <span className="inline-flex items-center gap-1 text-sky-600">
            <Sparkles className="size-3" />+{m.xp_reward} XP
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600">
            <CoinIcon className="size-3" />+{m.coin_reward}
          </span>
          {m.item_reward_label && (
            <span className="inline-flex items-center gap-1 text-fuchsia-600">
              <Gift className="size-3" />
              {m.item_reward_label}
            </span>
          )}
          <span className="ml-auto text-[10px] text-neutral-400">
            sucesso {m.success_rate}% · crit {m.crit_rate}%
          </span>
        </div>
        <Button
          size="sm"
          variant={sent ? "outline" : "default"}
          className="w-full"
          disabled={disabled}
          onClick={onStart}
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : sent ? (
            <>
              <Lock className="mr-1 size-3.5" />
              Já enviada hoje
            </>
          ) : (
            <>
              <Send className="mr-1 size-3.5" />
              Enviar pet
            </>
          )}
        </Button>
      </div>
    </li>
  );
}

function ActiveRunCard({
  active,
  now,
  busy,
  onClaim,
  onOpenScene,
}: {
  active: ActiveExpedition;
  now: number;
  busy: boolean;
  onClaim: () => void;
  onOpenScene: () => void;
}) {
  const Icon = iconFor(active.icon);
  const img = useSignedExpeditionUrl(active.image_url);
  const total = active.duration_minutes * 60_000;
  const elapsed = Math.max(0, now - new Date(active.started_at).getTime());
  const remaining = new Date(active.ends_at).getTime() - now;
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const ready = remaining <= 0;

  return (
    <button
      type="button"
      onClick={onOpenScene}
      className="w-full rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-left transition hover:bg-indigo-50 active:scale-[0.99]"
      aria-label="Ver progresso da expedição"
    >
      <div className="flex items-center gap-3">
        <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-200">
          {img ? (
            <img src={img} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <Icon className="size-5" />
          )}
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
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
            disabled={busy}
          >
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
      <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-indigo-500/70">
        Toque para acompanhar
      </p>
    </button>
  );
}