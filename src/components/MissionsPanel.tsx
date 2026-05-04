import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGE_META, type BadgeCode } from "@/lib/badges";
import { Award, Flame, Heart as HeartIcon, BookOpen, UserCheck, Sparkles } from "lucide-react";

type Missions = {
  profile_complete: boolean;
  prayer_count_7: number;
  prayer_target: number;
  devotional_count_14: number;
  devotional_target: number;
  has_first_match: boolean;
  has_first_devotional: boolean;
  active_streak: number;
  best_streak: number;
};

const STREAK_TIERS = [7, 15, 30, 60, 90, 365];

export function MissionsPanel({ userId }: { userId: string }) {
  const [m, setM] = useState<Missions | null>(null);
  const [badges, setBadges] = useState<BadgeCode[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [missions, ub] = await Promise.all([
      supabase.rpc("get_my_missions"),
      supabase
        .from("user_badges")
        .select("active, expires_at, badges(code)")
        .eq("user_id", userId)
        .eq("active", true),
    ]);
    if (missions.data?.[0]) setM(missions.data[0] as Missions);
    setBadges(
      ((ub.data ?? []) as any[])
        .filter((r) => !r.expires_at || new Date(r.expires_at) > new Date())
        .map((r) => r.badges?.code as BadgeCode)
        .filter(Boolean),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`badges-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_badges", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => {
      ch.unsubscribe();
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading || !m) {
    return <div className="glass animate-pulse rounded-2xl p-6 shadow-soft h-48" />;
  }

  const nextTier = STREAK_TIERS.find((t) => t > m.active_streak) ?? STREAK_TIERS[STREAK_TIERS.length - 1];
  const has = (c: BadgeCode) => badges.includes(c);

  return (
    <div className="space-y-4">
      {/* Badges ativas */}
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Award className="h-5 w-5 text-[var(--rose)]" /> Suas conquistas
        </h3>
        {badges.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Você ainda não tem badges. Complete missões abaixo para ganhar suas primeiras conquistas.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((c) => {
              const b = BADGE_META[c];
              if (!b) return null;
              const Icon = b.icon;
              return (
                <span
                  key={c}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${b.premium ? "shadow-[0_0_12px_rgba(16,185,129,0.45)]" : ""}`}
                  style={{ backgroundColor: b.bg, color: b.fg }}
                  title={b.description}
                >
                  <Icon className="h-3.5 w-3.5" /> {b.name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Missões ativas */}
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-[var(--rose)]" /> Missões em andamento
        </h3>
        <div className="mt-4 space-y-4">
          <Mission
            icon={<UserCheck className="h-4 w-4" />}
            title="Perfil completo"
            done={m.profile_complete}
            value={m.profile_complete ? 1 : 0}
            target={1}
            doneLabel={has("profile_complete") ? "Badge ativa ✓" : "Concluído"}
            todoLabel="Preencha todos os campos do seu perfil"
          />

          <Mission
            icon={<HeartIcon className="h-4 w-4" />}
            title="Orador Ativo"
            done={has("prayer_active")}
            value={Math.min(m.prayer_count_7, m.prayer_target)}
            target={m.prayer_target}
            doneLabel="Badge ativa — continue marcando 'Orei hoje'"
            todoLabel={`Você marcou ${m.prayer_count_7}, faltam ${Math.max(0, m.prayer_target - m.prayer_count_7)} pra ganhar a badge`}
          />

          <Mission
            icon={<BookOpen className="h-4 w-4" />}
            title="Devocional Ativo"
            done={has("devotional_active")}
            value={Math.min(m.devotional_count_14, m.devotional_target)}
            target={m.devotional_target}
            doneLabel="Badge ativa — continue interagindo"
            todoLabel={`${m.devotional_count_14}/${m.devotional_target} interações nos últimos 14 dias`}
          />

          <Mission
            icon={<Flame className="h-4 w-4" />}
            title={`Dias ativos (próxima meta: ${nextTier})`}
            done={false}
            value={Math.min(m.active_streak, nextTier)}
            target={nextTier}
            doneLabel=""
            todoLabel={`Streak atual: ${m.active_streak} · Recorde: ${m.best_streak}`}
          />
        </div>
      </div>

      {/* Recompensas pessoais */}
      <div className="glass rounded-2xl p-5 shadow-soft">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <HeartIcon className="h-5 w-5 text-[var(--rose)]" /> Recompensas pessoais
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Reward label="Primeiro match" achieved={m.has_first_match} icon={<HeartIcon className="h-5 w-5" />} />
          <Reward label="Primeiro devocional" achieved={m.has_first_devotional} icon={<BookOpen className="h-5 w-5" />} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Visível apenas para você.
        </p>
      </div>
    </div>
  );
}

function Mission({
  icon, title, done, value, target, doneLabel, todoLabel,
}: {
  icon: React.ReactNode; title: string; done: boolean; value: number; target: number;
  doneLabel: string; todoLabel: string;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon} {title}
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{value}/{target}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${done ? "bg-emerald-500" : "bg-[var(--rose)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{done ? doneLabel : todoLabel}</p>
    </div>
  );
}

function Reward({ label, achieved, icon }: { label: string; achieved: boolean; icon: React.ReactNode }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border p-3 ${achieved ? "border-emerald-400/40 bg-emerald-500/5" : "border-border bg-muted/30 opacity-60"}`}
    >
      <div className={achieved ? "text-emerald-500" : "text-muted-foreground"}>{icon}</div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{achieved ? "Conquistado" : "Bloqueado"}</div>
      </div>
    </div>
  );
}