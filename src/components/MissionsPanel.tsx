import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGE_META, type BadgeCode } from "@/lib/badges";
import { Award, Flame, Heart as HeartIcon, BookOpen, UserCheck, Sparkles, Gem } from "lucide-react";

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
  advanced_sections: number;
  advanced_target: number;
};

type ExtraProgress = {
  faithful_heart: number;
  intercessor: number;
  spiritual_mentor: number;
  bridge_builder: number;
  open_heart: number;
  attentive_chatter: number;
  magnetic_profile: number;
  faith_ambassador: number;
  community_veteran: number;
};

const SELECTED_REWARDS: Array<{ code: BadgeCode; target: number; progress: keyof ExtraProgress }> = [
  { code: "faithful_heart", target: 30, progress: "faithful_heart" },
  { code: "intercessor", target: 50, progress: "intercessor" },
  { code: "spiritual_mentor", target: 25, progress: "spiritual_mentor" },
  { code: "bridge_builder", target: 5, progress: "bridge_builder" },
  { code: "open_heart", target: 10, progress: "open_heart" },
  { code: "attentive_chatter", target: 14, progress: "attentive_chatter" },
  { code: "magnetic_profile", target: 50, progress: "magnetic_profile" },
  { code: "faith_ambassador", target: 1, progress: "faith_ambassador" },
  { code: "community_veteran", target: 180, progress: "community_veteran" },
];

const STREAK_TIERS = [7, 15, 30, 60, 90, 365];

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentDailyStreak(days: string[]) {
  const set = new Set(days);
  let cursor = new Date();
  let count = 0;
  while (set.has(toDayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function currentMessageStreak(createdAts: string[]) {
  return currentDailyStreak(createdAts.map((d) => toDayKey(new Date(d))));
}

export function MissionsPanel({ userId }: { userId: string }) {
  const [m, setM] = useState<Missions | null>(null);
  const [badges, setBadges] = useState<BadgeCode[]>([]);
  const [extraProgress, setExtraProgress] = useState<ExtraProgress | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [missions, ub, prayers, comments, matchesA, matchesB, interests, messages, views, advanced, activity, profile] = await Promise.all([
      supabase.rpc("get_my_missions"),
      supabase
        .from("user_badges")
        .select("active, expires_at, badges(code)")
        .eq("user_id", userId)
        .eq("active", true),
      supabase.from("prayer_request_prayed").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("devotional_comments").select("id", { count: "exact", head: true }).eq("user_id", userId).is("deleted_at", null),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_a", userId),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("user_b", userId),
      supabase.from("interests").select("id", { count: "exact", head: true }).eq("sender_id", userId),
      supabase.from("messages").select("created_at").eq("sender_id", userId).order("created_at", { ascending: false }).limit(120),
      supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("viewed_id", userId),
      supabase.from("profile_advanced").select("testimony, life_verse, faith_moment").eq("user_id", userId).maybeSingle(),
      supabase.from("user_activity").select("day").eq("user_id", userId).order("day", { ascending: true }),
      supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle(),
    ]);
    if (missions.data?.[0]) setM(missions.data[0] as Missions);
    setBadges(
      ((ub.data ?? []) as any[])
        .filter((r) => !r.expires_at || new Date(r.expires_at) > new Date())
        .map((r) => r.badges?.code as BadgeCode)
        .filter(Boolean),
    );
    const activeStreak = currentDailyStreak((activity.data ?? []).map((r) => r.day));
    const messageStreak = currentMessageStreak(((messages.data ?? []) as Array<{ created_at: string }>).map((r) => r.created_at));
    const adv = advanced.data as { testimony: string | null; life_verse: string | null; faith_moment: string | null } | null;
    setExtraProgress({
      faithful_heart: activeStreak,
      intercessor: prayers.count ?? 0,
      spiritual_mentor: comments.count ?? 0,
      bridge_builder: (matchesA.count ?? 0) + (matchesB.count ?? 0),
      open_heart: interests.count ?? 0,
      attentive_chatter: messageStreak,
      magnetic_profile: views.count ?? 0,
      faith_ambassador: adv?.testimony?.trim() && adv.life_verse?.trim() && adv.faith_moment ? 1 : 0,
      community_veteran: Math.max(0, Math.floor((Date.now() - new Date(profile.data?.created_at ?? new Date()).getTime()) / 86_400_000)),
    });
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
            icon={<Gem className="h-4 w-4" />}
            title="Perfil Avançado"
            done={has("advanced_profile")}
            value={Math.min(m.advanced_sections, m.advanced_target)}
            target={m.advanced_target}
            doneLabel="Badge ativa — perfil profundo ✓"
            todoLabel={`${m.advanced_sections}/${m.advanced_target} seções preenchidas em "Perfil profundo"`}
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
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SELECTED_REWARDS.map((reward) => {
            const meta = BADGE_META[reward.code];
            if (!meta) return null;
            const value = Math.min(extraProgress?.[reward.progress] ?? 0, reward.target);
            return (
              <RewardBadge
                key={reward.code}
                code={reward.code}
                value={value}
                target={reward.target}
                achieved={has(reward.code)}
              />
            );
          })}
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