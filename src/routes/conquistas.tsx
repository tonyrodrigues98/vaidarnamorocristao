import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Trophy } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { getMyXpState, levelTitle, type XpState } from "@/lib/xp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/conquistas")({ component: ConquistasPage });

type Achievement = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  goal: number;
  xp_reward: number;
  coin_reward: number;
  sort_order: number;
};

function ConquistasPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Achievement[]>([]);
  const [xp, setXp] = useState<XpState | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data }, state] = await Promise.all([
          supabase
            .from("pet_achievements" as never)
            .select("*")
            .eq("active", true)
            .order("sort_order"),
          getMyXpState().catch(() => null),
        ]);
        if (!alive) return;
        setItems((data ?? []) as Achievement[]);
        setXp(state);
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  const level = xp?.level ?? 1;

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          to="/meu-pet"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="size-3.5" />
          Voltar
        </Link>

        <header className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
            <Trophy className="size-3.5" />
            Conquistas
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Suas conquistas</h1>
          {xp && (
            <p className="mt-2 text-sm text-neutral-500">
              Nível {level} · {levelTitle(level)} · {xp.xp_total} XP no total
            </p>
          )}
        </header>

        {busy ? (
          <div className="py-20 text-center text-sm text-neutral-400">Carregando…</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((a) => {
              const unlocked = isUnlocked(a, level);
              const IconCmp =
                (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[a.icon] ??
                Trophy;
              return (
                <article
                  key={a.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 transition",
                    unlocked
                      ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
                      : "border-neutral-200 bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      unlocked ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-400",
                    )}
                  >
                    {unlocked ? <IconCmp className="size-5" /> : <Lock className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={cn("text-sm font-semibold", !unlocked && "text-neutral-500")}>
                      {a.name}
                    </h3>
                    {a.description && (
                      <p className="mt-0.5 text-xs text-neutral-500">{a.description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                      {a.xp_reward > 0 && <span>+{a.xp_reward} XP</span>}
                      {a.coin_reward > 0 && <span>+{a.coin_reward} moedas</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Conquistas baseadas em nível são desbloqueadas automaticamente.
 * As demais ficam pendentes até o sistema de rastreamento (Fase 1.5) entrar.
 */
function isUnlocked(a: Achievement, level: number): boolean {
  if (a.category === "level") return level >= a.goal;
  return false;
}