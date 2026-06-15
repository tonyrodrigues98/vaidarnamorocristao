import { useQuery } from "@tanstack/react-query";
import { Flame, Shield, Trophy } from "lucide-react";
import { getPetStreak, nextStreakMarker } from "@/lib/petStreak";

export function PetStreakCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["pet", "streak", refreshKey],
    queryFn: getPetStreak,
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="h-[88px] animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50" />
    );
  }

  const next = nextStreakMarker(data.current);
  const remaining = next ? next - data.current : 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <div
          className={
            "flex size-12 shrink-0 items-center justify-center rounded-xl " +
            (data.cared_today
              ? "bg-orange-50 text-orange-600"
              : "bg-neutral-100 text-neutral-400")
          }
        >
          <Flame className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">{data.current}</span>
            <span className="text-sm text-neutral-500">
              {data.current === 1 ? "dia seguido" : "dias seguidos"}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {data.cared_today
              ? "Cuidado de hoje registrado."
              : "Cuide do seu pet hoje para manter o streak."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-[11px]">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5 text-neutral-600"
            title="Escudo: protege uma falha por semana"
          >
            <Shield className="size-3" />
            {data.shield}
          </span>
          {data.best > 0 && (
            <span className="inline-flex items-center gap-1 text-neutral-500">
              <Trophy className="size-3" />
              recorde {data.best}
            </span>
          )}
        </div>
      </div>
      {next && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              Próximo marco: <strong className="text-neutral-700">{next} dias</strong>
            </span>
            <span>faltam {remaining}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${Math.min(100, (data.current / next) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}