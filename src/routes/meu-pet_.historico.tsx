import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import {
  PET_CARE_ACTION_LABEL,
  PET_CARE_LABEL,
  type PetCareKind,
  type PetCareKindWithItems,
} from "@/types/petCare";
import { PET_CARE_ICON } from "@/components/pet/PetNeedsHud";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meu-pet_/historico")({
  component: PetCareHistoryPage,
});

type Event = {
  id: string;
  kind: string;
  delta: number;
  cost_coins: number;
  created_at: string;
  item_id: string | null;
  item_name: string | null;
};

type DayBucket = {
  key: string; // YYYY-MM-DD em fuso local
  date: Date;
  count: number;
};

const MAX_DAYS = 7;

/**
 * Timezone do usuário (resolvido pelo browser). Usado de forma consistente
 * em TODA agregação para evitar mismatch entre "Hoje" e "Ontem" quando o
 * device cruza meia-noite ou usa DST diferente do servidor.
 */
const USER_TZ =
  (typeof Intl !== "undefined" &&
    Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  "America/Sao_Paulo";

const DAY_KEY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: USER_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** YYYY-MM-DD no fuso do usuário (en-CA garante este formato). */
function dayKey(d: Date): string {
  return DAY_KEY_FMT.format(d);
}

/** Diferença em dias entre dois dayKeys YYYY-MM-DD (independe de DST). */
function dayDiff(aKey: string, bKey: string): number {
  const [ay, am, ad] = aKey.split("-").map(Number);
  const [by, bm, bd] = bKey.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((a - b) / 86_400_000);
}

function lastSevenDays(): DayBucket[] {
  const todayKey = dayKey(new Date());
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const out: DayBucket[] = [];
  for (let i = 0; i < MAX_DAYS; i++) {
    // Construímos a data como meio-dia UTC só para fins de exibição
    // (toLocaleDateString abaixo); o key é o que importa para agrupar.
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

function PetCareHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(() => dayKey(new Date()));

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    (async () => {
      // Limite por janela de 7 dias (cliente filtra por dia local).
      const since = new Date();
      since.setDate(since.getDate() - (MAX_DAYS - 1));
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("pet_care_events")
        .select(
          "id, kind, delta, cost_coins, created_at, item_id, pet_care_items(name)",
        )
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
              (r as { pet_care_items?: { name?: string | null } | null })
                .pet_care_items?.name ?? null,
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
  }, [user]);

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

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-dvh bg-neutral-50 animate-fade-in">
      <Header />
      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4 animate-slide-in-right">
        <div className="flex items-center gap-2">
          <Link
            to="/meu-pet"
            className="inline-flex size-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100"
            aria-label="Voltar para Meu Pet"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-neutral-900">
              Histórico de cuidado
            </h1>
            <p className="text-[12px] text-neutral-500">
              Filtre por dia · últimos {MAX_DAYS} dias
            </p>
          </div>
        </div>

        <section
          className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2"
          aria-label="Selecionar dia"
        >
          <ul className="flex gap-2">
            {days.map((d) => {
              const active = d.key === selectedDay;
              return (
                <li key={d.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(d.key)}
                    className={cn(
                      "flex min-w-[84px] flex-col items-center rounded-xl border px-3 py-2 text-left transition",
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
                      {d.count === 0
                        ? "—"
                        : d.count === 1
                          ? "1 ação"
                          : `${d.count} ações`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white">
          {loading && events === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-4 animate-spin text-neutral-300" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-[12px] text-neutral-400">
              Nenhuma ação registrada neste dia.
            </p>
          ) : (
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
          )}
        </section>
      </main>
    </div>
  );
}