import { Clock3, Coins, PawPrint, Sparkles } from "lucide-react";

import type { ArcadeHistoryV2Item, ArcadeGameType } from "@/lib/petArcade";

const LABELS: Record<ArcadeGameType, string> = {
  treasure: "Campo de Tesouros",
  flight: "Voo Estelar",
  plinko: "Chuva de Biscoitos",
  keno: "Números da Sorte",
  wheel: "Roda do Biscoito",
  hilo: "Maior ou Menor",
  towers: "Torre dos Petiscos",
  coinflip: "Moeda do Pet",
  race: "Corrida dos Pets",
  memory: "Memória dos Pets",
  piggybank: "Cofrinho do Pet",
  dice: "Dados da Sorte",
};

export function ArcadeHistoryV2({ items }: { items: ArcadeHistoryV2Item[] }) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-neutral-100 text-neutral-700">
          <Clock3 className="size-5" />
        </span>
        <div>
          <h2 className="font-bold text-neutral-950">Histórico recente</h2>
          <p className="text-xs text-neutral-500">Últimas aventuras do seu pet</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500">
          Suas rodadas aparecerão aqui.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {items.slice(0, 15).map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <PawPrint className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-800">
                  {LABELS[item.game_type]}
                </p>
                <p className="text-xs text-neutral-500">
                  Entrada {item.entry_coins} · {Number(item.current_multiplier).toFixed(2)}x
                </p>
              </div>
              <div className="text-right text-xs font-bold">
                <p className="inline-flex items-center gap-1 text-emerald-600">
                  <Coins className="size-3" /> +{item.reward_coins}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-violet-500">
                  <Sparkles className="size-3" /> +{item.xp_reward} XP
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
