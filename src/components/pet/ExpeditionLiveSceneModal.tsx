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
  PHASE_TINT,
  PHASE_AMBIENT,
  PHASE_DENSITY,
  PHASE_ORDER,
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
  petImage,
  petName,
}: {
  open: boolean;
  active: ActiveExpedition | null;
  onClose: () => void;
  onClaim: () => void;
  busy: boolean;
  petImage: string | null;
  petName: string;
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
    visible.push({
      id: "departure",
      text: `${petName} partiu cheio de coragem. A aventura está começando.`,
      icon: "footprints",
      agoMs: elapsed,
    });
    for (let i = 0; i < eventsHappened; i++) {
      const ev = getEventAt(active.run_id, i, ctx);
      const agoMs = Math.max(0, elapsed - ev.at);
      visible.push({ id: `${active.run_id}:${i}`, text: ev.text, icon: ev.icon, agoMs });
    }
    visible.reverse(); // newest first
    return { pct, ready, remaining, biome, weather, phase, visible };
  }, [active, now, petName]);

  if (!active || !data) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md" />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[92vh] max-h-[92vh] w-full max-w-md flex-col overflow-hidden border-0 bg-neutral-950 p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">{active.title}</DialogTitle>

        {/* ===== SCENE (top half) ===== */}
        <div className="relative h-[46%] w-full shrink-0 overflow-hidden bg-black">
          {img ? (
            <img
              src={img}
              alt=""
              className="size-full object-cover"
              style={{ objectPosition: "center 40%" }}
            />
          ) : (
            <div className="size-full bg-gradient-to-b from-indigo-900 to-black" />
          )}
          {/* Day-phase tonal overlay — crossfade between all 4 phases (gradients are not interpolable) */}
          {PHASE_ORDER.map((p) => (
            <div
              key={`ov-${p}`}
              className="pointer-events-none absolute inset-0 transition-opacity duration-[2500ms] ease-in-out"
              style={{
                background: PHASE_OVERLAY[p],
                mixBlendMode: "overlay",
                opacity: data.phase === p ? 1 : 0,
              }}
            />
          ))}
          {/* Day-phase color wash (temperature) */}
          {PHASE_ORDER.map((p) => (
            <div
              key={`tint-${p}`}
              className="pointer-events-none absolute inset-0 transition-opacity duration-[2500ms] ease-in-out"
              style={{
                background: PHASE_TINT[p],
                mixBlendMode: "soft-light",
                opacity: data.phase === p ? 1 : 0,
              }}
            />
          ))}
          {/* Soft top vignette (covers status bar / URL chrome area) */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 to-transparent"
            style={{ height: "calc(env(safe-area-inset-top, 0px) + 7rem)" }}
          />
          {/* Bottom fade into feed */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-neutral-950" />
          {/* Base weather particles (biome) — density modulates per phase */}
          <div className="pointer-events-none absolute inset-0 transition-opacity duration-[2000ms]">
            <SceneWeatherLayer weather={data.weather} densityMul={PHASE_DENSITY[data.phase]} />
          </div>
          {/* Phase ambient particles — crossfade between phases without remount */}
          {PHASE_ORDER.map((p) => (
            <div
              key={`amb-${p}`}
              className="pointer-events-none absolute inset-0 transition-opacity duration-[2500ms] ease-in-out"
              style={{ opacity: data.phase === p ? 0.95 : 0 }}
            >
              <SceneWeatherLayer weather={PHASE_AMBIENT[p]} densityMul={0.65} />
            </div>
          ))}

          {/* HUD top (absolute over scene) */}
          <div
            className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-4 pb-4"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
          >
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wider text-white/80 drop-shadow">
                Expedição ativa
              </div>
              <h2 className="mt-0.5 text-[17px] font-semibold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                {active.title}
              </h2>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {data.ready ? "Pronto para coletar" : `Volta em ${fmtRemaining(data.remaining)}`}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Walking pet — bottom of the scene */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
            <div className="relative" style={{ animation: "scene-walk 1.4s ease-in-out infinite" }}>
              {petImage ? (
                <img
                  src={petImage}
                  alt={petName}
                  className="h-20 w-20 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
                  <Footprints className="size-7" />
                </div>
              )}
              {/* Shadow under pet */}
              <div className="mx-auto mt-1 h-1.5 w-12 rounded-full bg-black/40 blur-[3px]" />
            </div>
          </div>
        </div>

        {/* ===== Progress bar (between scene and feed) ===== */}
        <div className="shrink-0 border-b border-white/10 bg-neutral-950 px-4 py-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 transition-[width] duration-1000"
              style={{ width: `${data.pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10.5px] tabular-nums text-white/60">
            <span>{Math.round(data.pct)}% concluído</span>
            <span className="capitalize">
              {data.phase === "dawn"
                ? "amanhecer"
                : data.phase === "day"
                  ? "dia"
                  : data.phase === "dusk"
                    ? "entardecer"
                    : "noite"}
            </span>
          </div>
        </div>

        {/* ===== Feed (scrollable bottom half) ===== */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-950 px-4 pt-3">
          {!data.ready && (
            <div className="space-y-2 pb-4">
              <p className="px-1 pb-1 text-[10.5px] font-medium uppercase tracking-wider text-white/40">
                Diário da jornada
              </p>
              {data.visible.map((ev, idx) => {
                const Icon = ICON_MAP[ev.icon] ?? Sparkles;
                const isLatest = idx === 0;
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-2xl border p-3 transition-all",
                      isLatest
                        ? "border-indigo-400/40 bg-neutral-900 text-white shadow-lg animate-fade-in"
                        : "border-white/10 bg-neutral-900/70 text-white/85",
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full",
                        isLatest ? "bg-indigo-500/25 text-indigo-200" : "bg-white/10 text-white/70",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug">{ev.text}</p>
                      <p className="mt-0.5 text-[10.5px] text-white/45">{fmtAgo(ev.agoMs)}</p>
                    </div>
                  </div>
                );
              })}
              <p className="pt-2 text-center text-[10.5px] text-white/40">
                Volte mais tarde — a aventura continua.
              </p>
            </div>
          )}

          {data.ready && (
            <div className="space-y-3 pb-4">
              <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-center text-white animate-scale-in">
                <Sparkles className="mx-auto size-5 text-amber-200" />
                <p className="mt-1 text-[14px] font-semibold">{petName} voltou!</p>
                <p className="text-[11.5px] text-white/75">
                  Recompensas prontas pra serem reveladas.
                </p>
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
              {data.visible.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="px-1 text-[10.5px] font-medium uppercase tracking-wider text-white/40">
                    Resumo da jornada
                  </p>
                  {data.visible.map((ev) => {
                    const Icon = ICON_MAP[ev.icon] ?? Sparkles;
                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-neutral-900/70 p-3 text-white/85"
                      >
                        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10">
                          <Icon className="size-3.5" />
                        </div>
                        <p className="text-[12.5px] leading-snug">{ev.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
