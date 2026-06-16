import { useEffect, useMemo, useState } from "react";
import {
  Bird,
  Compass,
  Droplets,
  Feather,
  Flame,
  Footprints,
  Gift,
  Heart,
  Leaf,
  Loader2,
  Moon,
  Mountain,
  Sparkles,
  Star,
  Sun,
  Wind,
  X,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSignedExpeditionUrl } from "@/lib/expeditionImageUrl";
import {
  PHASE_OVERLAY,
  eventIntervalMs,
  getEventAt,
  phaseAtProgress,
  resolveBiome,
  type StoryIcon,
} from "@/lib/expeditionStoryEngine";
import type { ActiveExpedition } from "@/types/petExpedition";
import { SceneWeatherLayer } from "./SceneWeatherLayer";

const ICON_MAP: Record<StoryIcon, React.ComponentType<{ className?: string }>> = {
  footprints: Footprints,
  sparkles: Sparkles,
  wind: Wind,
  leaf: Leaf,
  mountain: Mountain,
  sun: Sun,
  moon: Moon,
  stars: Star,
  heart: Heart,
  gift: Gift,
  feather: Feather,
  flame: Flame,
  droplets: Droplets,
  bird: Bird,
  compass: Compass,
};

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

function fmtAgo(ms: number): string {
  if (ms < 60_000) return "agora";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  return `${h}h atrás`;
}

export function ExpeditionLiveSceneModal({
  open,
  active,
  onClose,
  onClaim,
  busy,
}: {
  open: boolean;
  active: ActiveExpedition | null;
  onClose: () => void;
  onClaim: () => void;
  busy: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  const img = useSignedExpeditionUrl(active?.image_url ?? null);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const data = useMemo(() => {
    if (!active) return null;
    const total = active.duration_minutes * 60_000;
    const started = new Date(active.started_at).getTime();
    const ends = new Date(active.ends_at).getTime();
    const elapsed = Math.max(0, now - started);
    const remaining = ends - now;
    const pct = Math.min(100, (elapsed / total) * 100);
    const ready = remaining <= 0;
    const { biome, weather, startPhase } = resolveBiome(active.slug);
    const phase = phaseAtProgress(pct, startPhase);
    const interval = eventIntervalMs(active.difficulty);
    const eventsHappened = Math.max(0, Math.floor(elapsed / interval));
    const ctx = {
      slug: active.slug,
      itemRewardLabel: active.item_reward_label,
      difficulty: active.difficulty,
    };
    // Show last 3 events; if none yet, show a "departure" pseudo-event.
    const visible: { id: string; text: string; icon: StoryIcon; agoMs: number }[] = [];
    if (eventsHappened === 0) {
      visible.push({
        id: "departure",
        text: "Seu pet partiu cheio de coragem. A aventura está começando.",
        icon: "footprints",
        agoMs: elapsed,
      });
    } else {
      const start = Math.max(0, eventsHappened - 3);
      for (let i = start; i < eventsHappened; i++) {
        const ev = getEventAt(active.run_id, i, ctx);
        const agoMs = elapsed - ev.at;
        visible.push({ id: `${active.run_id}:${i}`, text: ev.text, icon: ev.icon, agoMs });
      }
      visible.reverse(); // newest first
    }
    return { pct, ready, remaining, biome, weather, phase, visible };
  }, [active, now]);

  if (!active || !data) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md" />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="h-[92vh] max-h-[92vh] w-full max-w-md overflow-hidden border-0 bg-black p-0 [&>button]:hidden"
      >
        <DialogTitle className="sr-only">{active.title}</DialogTitle>

        {/* Background scene */}
        <div className="absolute inset-0">
          {img ? (
            <img
              src={img}
              alt=""
              className="size-full object-cover"
              style={{
                animation: `scene-zoom ${Math.max(60, active.duration_minutes * 60)}s linear forwards`,
                animationDelay: `-${Math.max(0, ((data.pct / 100) * Math.max(60, active.duration_minutes * 60)) | 0)}s`,
              }}
            />
          ) : (
            <div className="size-full bg-gradient-to-b from-indigo-900 to-black" />
          )}
          {/* Day-phase tonal overlay */}
          <div
            className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
            style={{ background: PHASE_OVERLAY[data.phase], mixBlendMode: "soft-light" }}
          />
          {/* Top vignette + bottom darkening for legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/80" />
          {/* Weather particles */}
          <SceneWeatherLayer weather={data.weather} />
        </div>

        {/* HUD top */}
        <div className="relative z-10 flex items-start justify-between gap-2 p-4 pt-5">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-white/70">
              Expedição ativa
            </div>
            <h2 className="mt-0.5 text-[17px] font-semibold leading-tight text-white drop-shadow">
              {active.title}
            </h2>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {data.ready ? "Pronto para coletar" : `Volta em ${fmtRemaining(data.remaining)}`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 px-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15 backdrop-blur">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 transition-[width] duration-1000"
              style={{ width: `${data.pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/70">
            <span>{Math.round(data.pct)}%</span>
            <span className="capitalize">{data.phase === "dawn" ? "amanhecer" : data.phase === "day" ? "dia" : data.phase === "dusk" ? "entardecer" : "noite"}</span>
          </div>
        </div>

        {/* Walking pet silhouette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-44 z-10 flex justify-center">
          <div
            className="text-white/80"
            style={{ animation: "scene-walk 1.4s ease-in-out infinite" }}
          >
            <Footprints className="size-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
          </div>
        </div>

        {/* Floating event cards */}
        <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-4">
          {!data.ready && (
            <div className="space-y-2">
              {data.visible.map((ev, idx) => {
                const Icon = ICON_MAP[ev.icon] ?? Sparkles;
                const isLatest = idx === 0;
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-2xl border p-3 backdrop-blur-md transition-all",
                      isLatest
                        ? "border-white/30 bg-white/15 text-white shadow-lg animate-fade-in"
                        : "border-white/15 bg-white/10 text-white/70",
                    )}
                    style={{ opacity: isLatest ? 1 : 0.7 - idx * 0.15 }}
                  >
                    <div className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full",
                      isLatest ? "bg-white/25" : "bg-white/10",
                    )}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] leading-snug">{ev.text}</p>
                      <p className="mt-0.5 text-[10px] text-white/55">{fmtAgo(ev.agoMs)}</p>
                    </div>
                  </div>
                );
              })}
              <p className="pt-1 text-center text-[10.5px] text-white/50">
                Volte mais tarde — sua aventura continua.
              </p>
            </div>
          )}

          {data.ready && (
            <div className="space-y-2">
              <div className="rounded-2xl border border-amber-300/40 bg-amber-200/15 p-4 text-center text-white backdrop-blur-md animate-scale-in">
                <Sparkles className="mx-auto size-5 text-amber-200" />
                <p className="mt-1 text-[13px] font-semibold">Seu pet voltou!</p>
                <p className="text-[11px] text-white/75">Recompensas prontas pra serem reveladas.</p>
              </div>
              <Button
                size="lg"
                className="w-full bg-white text-neutral-900 hover:bg-white/90"
                onClick={onClaim}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Gift className="mr-1 size-4" />
                )}
                Coletar recompensas
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}