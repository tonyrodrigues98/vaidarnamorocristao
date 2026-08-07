import { Clock3, Gem, Rocket } from "lucide-react";

import type { ArcadeHistoryItem } from "@/lib/petArcade";

export function ArcadeHistory({ items }: { items: ArcadeHistoryItem[] }) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-100 text-neutral-700">
          <Clock3 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-neutral-950">Histórico recente</h2>
          <p className="text-xs text-neutral-500">Últimas aventuras do seu pet</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500">
          Suas rodadas aparecerão aqui.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {items.slice(0, 12).map((item) => {
            const won = item.status === "collected";
            const Icon = item.game_type === "treasure" ? Gem : Rocket;
            return (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    item.game_type === "treasure"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-sky-50 text-sky-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-800">
                    {item.game_type === "treasure" ? "Campo de Tesouros" : "Voo Estelar"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Entrada {item.entry_coins} · {Number(item.multiplier).toFixed(2)}x
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${won ? "text-emerald-600" : "text-neutral-500"}`}
                  >
                    {won ? `+${item.reward_coins}` : "Encerrada"}
                  </p>
                  <p className="text-[10px] uppercase text-neutral-400">
                    {new Date(item.started_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
