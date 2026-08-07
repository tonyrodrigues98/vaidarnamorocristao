import { useEffect, useState } from "react";
import { ChevronDown, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PET_CARE_ACTION_LABEL,
  PET_CARE_LABEL,
  type PetCareKind,
  type PetCareKindWithItems,
} from "@/types/petCare";
import { PET_CARE_ICON } from "./PetNeedsHud";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  kind: string;
  delta: number;
  cost_coins: number;
  created_at: string;
  item_id: string | null;
  item_name?: string | null;
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function actionLabel(kind: string): string {
  const k = kind as PetCareKindWithItems;
  return PET_CARE_ACTION_LABEL[k] ?? PET_CARE_LABEL[kind as PetCareKind] ?? kind;
}

/**
 * Histórico das últimas ações de cuidado feitas neste pet.
 * Renderiza a partir de `pet_care_events` (RLS owner-only).
 * Colapsado por padrão para não poluir o /meu-pet.
 */
export function PetCareHistoryCard({
  userPetId,
  refreshKey,
}: {
  userPetId: string;
  refreshKey?: number;
}) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<Event[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("pet_care_events")
        .select("id, kind, delta, cost_coins, created_at, item_id, pet_care_items(name)")
        .eq("user_pet_id", userPetId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!alive) return;
      if (!error && data) {
        setEvents(
          data.map((r) => ({
            id: r.id as string,
            kind: r.kind as string,
            delta: r.delta as number,
            cost_coins: r.cost_coins as number,
            created_at: r.created_at as string,
            item_id: r.item_id as string | null,
            item_name:
              (r as { pet_care_items?: { name?: string | null } | null }).pet_care_items?.name ??
              null,
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [open, userPetId, refreshKey]);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50"
        aria-expanded={open}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
          <Clock className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-neutral-900">Histórico de cuidado</div>
          <div className="text-[12px] text-neutral-500">Últimas ações com este pet</div>
        </div>
        <ChevronDown
          className={cn("size-4 text-neutral-400 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="border-t border-neutral-100 px-4 py-3">
          {loading && events === null ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-4 animate-spin text-neutral-300" />
            </div>
          ) : !events || events.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-neutral-400">
              Nenhuma ação registrada ainda. Comece pelo menu circular!
            </p>
          ) : (
            <ul className="space-y-2">
              {events.map((ev) => {
                const Icon = PET_CARE_ICON[ev.kind as PetCareKind] ?? Clock;
                return (
                  <li
                    key={ev.id}
                    className="flex items-center gap-3 rounded-xl bg-neutral-50/60 px-3 py-2"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-700 ring-1 ring-neutral-200">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-neutral-900">
                        {actionLabel(ev.kind)}
                        {ev.item_name ? (
                          <span className="text-neutral-500"> · {ev.item_name}</span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {relTime(ev.created_at)}
                        {ev.delta > 0 ? <> · +{ev.delta}</> : null}
                        {ev.cost_coins > 0 ? <> · -{ev.cost_coins} moedas</> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
