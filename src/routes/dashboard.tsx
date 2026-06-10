import { PhotoImg } from "@/components/PhotoImg";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ProfileCompletenessAlert } from "@/components/ProfileCompletenessAlert";
import { GradientName } from "@/components/GradientName";
import { fetchNameGradientsByIds, type NameGradient } from "@/lib/nameGradients";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Heart,
  MessageCircle,
  Sparkles,
  Newspaper,
  Eye,
  TrendingUp,
  User as UserIcon,
  Gem,
} from "lucide-react";

// Heavy recharts bundle (~140KB) lazy-loaded only when this route renders.
const DashboardCharts = lazy(() => import("@/components/dashboard/DashboardCharts"));

type Profile = {
  status: "pending" | "approved" | "rejected" | "banned";
  full_name: string | null;
  rejection_reason: string | null;
  equipped_name_gradient_id?: string | null;
};
type ViewRow = {
  id: string;
  viewer_id: string;
  viewer_age: number | null;
  viewer_city: string | null;
  viewer_state: string | null;
  created_at: string;
};
type Visitor = {
  id: string;
  full_name: string;
  photo_url: string | null;
  city: string;
  state: string;
  age: number;
  equipped_name_gradient_id?: string | null;
  name_gradient?: NameGradient | null;
};
type LatestNews = { id: string; title: string; content: string; published_at: string };

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

const PERIOD_DAYS = 30;
const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "18-24", min: 18, max: 24 },
  { label: "25-29", min: 25, max: 29 },
  { label: "30-34", min: 30, max: 34 },
  { label: "35-39", min: 35, max: 39 },
  { label: "40-49", min: 40, max: 49 },
  { label: "50+", min: 50, max: 200 },
];

const ROSE = "var(--rose)";
const CORAL = "var(--coral)";
const PETAL = "var(--petal)";

function Dashboard() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [views, setViews] = useState<ViewRow[]>([]);
  const [visitorsMap, setVisitorsMap] = useState<Record<string, Visitor>>({});
  const [stats, setStats] = useState({ interests: 0, matches: 0, unread: 0 });
  const [latestNews, setLatestNews] = useState<LatestNews | null>(null);
  const [profileNameGradient, setProfileNameGradient] = useState<NameGradient | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("daily_posts")
      .select("id, title, content, published_at")
      .eq("kind", "news")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLatestNews((data as LatestNews | null) ?? null));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("status, full_name, rejection_reason, equipped_name_gradient_id")
          .eq("id", user.id)
          .maybeSingle();
        const next = data as Profile | null;
        setProfile(next);
        const gradients = await fetchNameGradientsByIds([next?.equipped_name_gradient_id]);
        setProfileNameGradient(
          next?.equipped_name_gradient_id
            ? (gradients[next.equipped_name_gradient_id] ?? null)
            : null,
        );
      } catch {
        setProfileNameGradient(null);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || profile?.status !== "approved") return;
    const sinceIso = new Date(Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();

    (async () => {
      const [{ data: vw }, intRes, mtsRes] = await Promise.all([
        supabase
          .from("profile_views")
          .select("id, viewer_id, viewer_age, viewer_city, viewer_state, created_at")
          .eq("viewed_id", user.id)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false }),
        supabase
          .from("interests")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id),
        supabase.from("matches").select("id").or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
      ]);
      const list = (vw ?? []) as ViewRow[];
      setViews(list);

      // Unread messages
      const matchIds = (mtsRes.data ?? []).map((m) => m.id);
      let unread = 0;
      if (matchIds.length) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("match_id", matchIds)
          .neq("sender_id", user.id)
          .is("read_at", null);
        unread = count ?? 0;
      }
      setStats({
        interests: intRes.count ?? 0,
        matches: matchIds.length,
        unread,
      });

      // Load visitor profiles (unique ids)
      const uniqIds = Array.from(new Set(list.map((v) => v.viewer_id)));
      if (uniqIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, photo_url, city, state, age, equipped_name_gradient_id")
          .in("id", uniqIds);
        const gradients = await fetchNameGradientsByIds(
          ((profs ?? []) as Visitor[]).map((p) => p.equipped_name_gradient_id),
        );
        const map: Record<string, Visitor> = {};
        for (const p of (profs ?? []) as Visitor[]) {
          map[p.id] = {
            ...p,
            name_gradient: p.equipped_name_gradient_id
              ? (gradients[p.equipped_name_gradient_id] ?? null)
              : null,
          };
        }
        setVisitorsMap(map);
      } else {
        setVisitorsMap({});
      }
    })();
  }, [user, profile?.status]);

  // Aggregations
  const dailySeries = useMemo(() => {
    const days: { date: string; label: string; views: number }[] = [];
    for (let i = PERIOD_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        views: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const v of views) {
      const k = v.created_at.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) days[i].views += 1;
    }
    return days;
  }, [views]);

  const ageBucketSeries = useMemo(() => {
    const counts = AGE_BUCKETS.map((b) => ({ label: b.label, count: 0 }));
    for (const v of views) {
      if (typeof v.viewer_age !== "number") continue;
      const i = AGE_BUCKETS.findIndex((b) => v.viewer_age! >= b.min && v.viewer_age! <= b.max);
      if (i >= 0) counts[i].count += 1;
    }
    return counts;
  }, [views]);

  const topCities = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of views) {
      const key =
        v.viewer_city && v.viewer_state
          ? `${v.viewer_city} · ${v.viewer_state}`
          : (v.viewer_state ?? "—");
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [views]);

  const totalViews = views.length;
  const uniqueViewers = useMemo(() => new Set(views.map((v) => v.viewer_id)).size, [views]);
  const last7 = useMemo(
    () => dailySeries.slice(-7).reduce((a, d) => a + d.views, 0),
    [dailySeries],
  );
  const prev7 = useMemo(
    () => dailySeries.slice(-14, -7).reduce((a, d) => a + d.views, 0),
    [dailySeries],
  );
  const trend = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);

  const recentVisitors = useMemo(() => {
    const seen = new Set<string>();
    const out: { v: ViewRow; p: Visitor }[] = [];
    for (const v of views) {
      if (seen.has(v.viewer_id)) continue;
      const p = visitorsMap[v.viewer_id];
      if (!p) continue;
      seen.add(v.viewer_id);
      out.push({ v, p });
      if (out.length >= 8) break;
    }
    return out;
  }, [views, visitorsMap]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (profile === undefined)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/20 via-background to-background">
        <Header />
      </div>
    );
  if (!profile) return <Navigate to="/onboarding" />;

  const statusInfo = {
    pending: {
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      title: "Perfil em análise",
      text: "Sua inscrição está sendo revisada por nossa equipe. Você será avisado(a) assim que for aprovada.",
    },
    approved: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      title: "Perfil aprovado!",
      text: "Bem-vindo(a) à comunidade. Conheça os pretendentes.",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      title: "Perfil rejeitado",
      text: profile.rejection_reason ?? "Entre em contato com a equipe.",
    },
    banned: {
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50",
      title: "Conta suspensa",
      text: "Sua conta foi suspensa.",
    },
  }[profile.status];

  const Icon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/20 via-background to-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-5 sm:py-10">
        <div className="animate-fade-up">
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-4xl font-black tracking-tight">
            <GradientName
              name={profile.full_name?.split(" ")[0]}
              gradient={profileNameGradient}
              fallback="Bem-vindo(a)"
            />
          </h1>
        </div>

        <div className="glass animate-fade-up mt-6 flex items-start gap-4 rounded-[1.75rem] p-5 shadow-soft sm:rounded-3xl sm:p-6">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusInfo.bg}`}
          >
            <Icon className={`h-6 w-6 ${statusInfo.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{statusInfo.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{statusInfo.text}</p>
            {profile.status === "rejected" && (
              <Button asChild variant="outline" className="mt-4">
                <Link to="/onboarding">Editar perfil</Link>
              </Button>
            )}
          </div>
        </div>

        {profile.status === "approved" && (
          <>
            <div className="mt-6">
              <ProfileCompletenessAlert />
            </div>
            {/* Resumo */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Resumo dos últimos {PERIOD_DAYS} dias</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  Icon={Eye}
                  label="Visitas ao perfil"
                  value={totalViews}
                  hint={`${uniqueViewers} pessoas únicas`}
                />
                <StatCard
                  Icon={TrendingUp}
                  label="Tendência (7d)"
                  value={`${trend > 0 ? "+" : ""}${trend}%`}
                  hint={`${last7} vs ${prev7} visitas`}
                />
                <StatCard
                  Icon={Sparkles}
                  label="Interesses recebidos"
                  value={stats.interests}
                  hint="Total acumulado"
                />
                <StatCard
                  Icon={Heart}
                  label="Matches"
                  value={stats.matches}
                  hint={`${stats.unread} mensagens não lidas`}
                />
              </div>
            </section>

            <Suspense
              fallback={
                <div className="glass mt-8 h-64 animate-pulse rounded-3xl shadow-soft" />
              }
            >
              <DashboardCharts
                dailySeries={dailySeries}
                totalViews={totalViews}
                ageBucketSeries={ageBucketSeries}
                topCities={topCities}
              />
            </Suspense>

            {/* Visitantes recentes */}
            <section className="glass mt-6 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Visitantes recentes</h3>
                  <p className="text-sm text-muted-foreground">
                    Últimas pessoas únicas que viram seu perfil
                  </p>
                </div>
              </div>
              {recentVisitors.length === 0 ? (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Ninguém viu seu perfil ainda. Continue presente — os pretendentes chegam.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {recentVisitors.map(({ v, p }) => (
                    <Link
                      key={v.id}
                      to="/pretendentes/$id"
                      params={{ id: p.id }}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 transition hover:bg-accent"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                        {p.photo_url ? (
                          <PhotoImg
                            src={p.photo_url}
                            alt={p.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-love text-lg text-white">
                            {p.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          <GradientName
                            name={p.full_name.split(" ")[0]}
                            gradient={p.name_gradient}
                          />
                          , {p.age}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.city} · {p.state}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(v.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Atalhos */}
        <section className="mt-10">
          {latestNews && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Última notícia</h2>
              <Link
                to="/noticias"
                className="glass mt-4 flex items-start gap-4 rounded-3xl p-6 shadow-soft transition hover:bg-accent"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--petal)]">
                  <Newspaper className="h-6 w-6 text-[var(--rose)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--rose)]">
                    {new Date(latestNews.published_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                    })}
                  </p>
                  <h3 className="mt-1 truncate text-lg font-semibold">{latestNews.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {latestNews.content}
                  </p>
                </div>
              </Link>
            </div>
          )}
          <h2 className="text-xl font-semibold">Atalhos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashCard
              to="/perfil"
              Icon={UserIcon}
              title="Meu perfil"
              desc="Edite seus dados e preferências"
            />
            <DashCard
              to="/conversas"
              Icon={MessageCircle}
              title="Conversas"
              desc="Suas mensagens privadas"
            />
            <DashCard
              to="/pretendentes"
              Icon={Gem}
              title="Pretendentes"
              desc="Conheça pessoas com a mesma fé"
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashCard
              to="/interesses"
              Icon={Sparkles}
              title="Interesses"
              desc="Quem demonstrou interesse"
            />
            <DashCard
              to="/matches"
              Icon={Users}
              title="Matches"
              desc="Conexões com reciprocidade"
            />
            <DashCard
              to="/noticias"
              Icon={Newspaper}
              title="Notícias & Devocional"
              desc="Reflexões e avisos"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
  hint,
}: {
  Icon: typeof Users;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="glass animate-fade-up rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-[var(--rose)]" />
      </div>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DashCard({
  to,
  Icon,
  title,
  desc,
}: {
  to: string;
  Icon: typeof Users;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="glass group animate-fade-up rounded-2xl p-6 shadow-soft transition hover:shadow-elegant"
    >
      <Icon className="mb-3 h-6 w-6 text-[var(--rose)]" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
