import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock, Coins, Layers, Loader2, Moon, PawPrint, TrendingUp } from "lucide-react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import {
  PET_CARE_ACTION_LABEL,
  PET_CARE_LABEL,
  type PetCareKind,
  type PetCareKindWithItems,
} from "@/types/petCare";
import { PET_CARE_ICON } from "@/components/pet/PetNeedsHud";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  kind: string;
  delta: number;
  cost_coins: number;
  created_at: string;
  item_id: string | null;
  item_name: string | null;
};

type DayBucket = { key: string; date: Date; count: number };

const MAX_DAYS = 7;

const USER_TZ =
  (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  "America/Sao_Paulo";

const DAY_KEY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: USER_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKey(d: Date): string {
  return DAY_KEY_FMT.format(d);
}

function dayDiff(aKey: string, bKey: string): number {
  const [ay, am, ad] = aKey.split("-").map(Number);
  const [by, bm, bd] = bKey.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000);
}

function lastSevenDays(): DayBucket[] {
  const todayKey = dayKey(new Date());
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const out: DayBucket[] = [];
  for (let i = 0; i < MAX_DAYS; i++) {
    const utc = new Date(Date.UTC(ty, tm - 1, td - i, 12));
    out.push({ key: dayKey(utc), date: utc, count: 0 });
  }
  return out;
}

function formatDayLabel(key: string, date: Date): string {
  const todayKey = dayKey(new Date());
  const diff = dayDiff(todayKey, key);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return date.toLocaleDateString("pt-BR", {
    timeZone: USER_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: USER_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionLabel(kind: string): string {
  const k = kind as PetCareKindWithItems;
  return PET_CARE_ACTION_LABEL[k] ?? PET_CARE_LABEL[kind as PetCareKind] ?? kind;
}

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function PetCareHistorySheet({ open, onOpenChange }: Props) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(() => dayKey(new Date()));

  // Swipe-to-close (arrastar pra direita)
  const contentRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dragX = useRef(0);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setSelectedDay(dayKey(new Date()));
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - (MAX_DAYS - 1));
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("pet_care_events")
        .select("id, kind, delta, cost_coins, created_at, item_id, pet_care_items(name)")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (!alive) return;
      if (!error && data) {
        setEvents(
          data.map((r) => ({
            id: r.id as string,
            kind: r.kind as string,
            delta: (r.delta as number) ?? 0,
            cost_coins: (r.cost_coins as number) ?? 0,
            created_at: r.created_at as string,
            item_id: (r.item_id as string | null) ?? null,
            item_name:
              (r as { pet_care_items?: { name?: string | null } | null }).pet_care_items?.name ??
              null,
          })),
        );
      } else {
        setEvents([]);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  const days = useMemo<DayBucket[]>(() => {
    const base = lastSevenDays();
    if (!events) return base;
    const counts = new Map<string, number>();
    for (const ev of events) {
      const k = dayKey(new Date(ev.created_at));
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return base.map((d) => ({ ...d, count: counts.get(d.key) ?? 0 }));
  }, [events]);

  const filtered = useMemo(() => {
    if (!events) return [];
    return events.filter((ev) => dayKey(new Date(ev.created_at)) === selectedDay);
  }, [events, selectedDay]);

  const summary = useMemo(() => {
    let gained = 0;
    let spent = 0;
    const kinds = new Set<string>();
    for (const ev of filtered) {
      if (ev.delta > 0) gained += ev.delta;
      if (ev.cost_coins > 0) spent += ev.cost_coins;
      kinds.add(ev.kind);
    }
    return { count: filtered.length, gained, spent, kinds: kinds.size };
  }, [filtered]);

  const todayKey = dayKey(new Date());
  const isToday = selectedDay === todayKey;

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    dragX.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current || !contentRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) < Math.abs(dy)) return; // gesto vertical = scroll
    if (dx > 0) {
      dragX.current = dx;
      contentRef.current.style.transform = `translateX(${dx}px)`;
      contentRef.current.style.transition = "none";
    }
  }
  function onTouchEnd() {
    if (!contentRef.current) return;
    const el = contentRef.current;
    el.style.transition = "transform 200ms ease-out";
    if (dragX.current > 90) {
      el.style.transform = "";
      onOpenChange(false);
    } else {
      el.style.transform = "translateX(0)";
    }
    touchStart.current = null;
    dragX.current = 0;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent ref={contentRef} side="right" className="w-full p-0 sm:max-w-md">
        <div className="flex h-full flex-col">
          <header className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 pr-12">
            <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
              <Clock className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-900">Histórico de cuidado</h2>
              <p className="text-[11px] text-neutral-500">
                Últimos {MAX_DAYS} dias · arraste para fechar
              </p>
            </div>
          </header>

          <div className="overflow-x-auto border-b border-neutral-100 bg-white px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex gap-2">
              {days.map((d) => {
                const active = d.key === selectedDay;
                return (
                  <li key={d.key}>
                    <button
                      type="button"
                      onClick={() => setSelectedDay(d.key)}
                      className={cn(
                        "flex min-w-[78px] flex-col items-center rounded-xl border px-3 py-2 text-left transition",
                        active
                          ? "border-sky-300 bg-sky-50 text-sky-900"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                      )}
                      aria-pressed={active}
                    >
                      <span className="text-[11px] font-medium uppercase tracking-wide">
                        {formatDayLabel(d.key, d.date)}
                      </span>
                      <span className="mt-0.5 text-[11px] text-neutral-500">
                        {d.count === 0 ? "—" : d.count === 1 ? "1 ação" : `${d.count} ações`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            className="flex-1 overflow-y-auto"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {loading && events === null ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-4 animate-spin text-neutral-300" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  {isToday ? <PawPrint className="size-6" /> : <Moon className="size-6" />}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-neutral-800">
                  {isToday ? "Nada por aqui ainda" : "Dia tranquilo"}
                </h3>
                <p className="mt-1 max-w-[240px] text-[12px] text-neutral-500">
                  {isToday
                    ? "Cuide do seu pet para registrar o primeiro evento."
                    : "Seu pet não recebeu cuidados neste dia."}
                </p>
                {isToday ? (
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="mt-4 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-800 transition hover:bg-neutral-50"
                  >
                    Ir para cuidados
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 border-b border-neutral-100 bg-neutral-50/60 px-3 py-3">
                  {[
                    { icon: Activity, label: "Ações", value: summary.count },
                    { icon: TrendingUp, label: "Ganho", value: `+${summary.gained}` },
                    { icon: Coins, label: "Gasto", value: `-${summary.spent}` },
                    { icon: Layers, label: "Tipos", value: summary.kinds },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center rounded-lg border border-neutral-200 bg-white px-1.5 py-2"
                    >
                      <Icon className="size-3.5 text-neutral-400" />
                      <span className="mt-1 text-sm font-semibold text-neutral-900">{value}</span>
                      <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <ul className="divide-y divide-neutral-100">
                  {filtered.map((ev) => {
                    const Icon = PET_CARE_ICON[ev.kind as PetCareKind] ?? Clock;
                    return (
                      <li key={ev.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-neutral-700 ring-1 ring-neutral-200">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-neutral-900">
                            {actionLabel(ev.kind)}
                            {ev.item_name ? (
                              <span className="text-neutral-500">
                                {" · "}
                                {ev.item_name}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {formatTime(ev.created_at)}
                            {ev.delta > 0 ? <> · +{ev.delta}</> : null}
                            {ev.cost_coins > 0 ? <> · -{ev.cost_coins} moedas</> : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
