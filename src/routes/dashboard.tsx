import { PhotoImg } from "@/components/PhotoImg";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ProfileCompletenessAlert } from "@/components/ProfileCompletenessAlert";
import { GradientName } from "@/components/GradientName";
import { fetchNameGradientsByIds, type NameGradient } from "@/lib/nameGradients";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { StaleDataNotice } from "@/components/ui/StaleDataNotice";
import { OfflineState } from "@/components/ui/OfflineState";
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
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

// Heavy recharts bundle (~140KB) lazy-loaded only when this route renders
// AND only when there is real data to plot (see render below).
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

type Period = "7d" | "30d" | "90d" | "all";
const PERIOD_OPTIONS: { id: Period; label: string; days: number | null }[] = [
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
  { id: "90d", label: "90 dias", days: 90 },
  { id: "all", label: "Tudo", days: null },
];
const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "18-24", min: 18, max: 24 },
  { label: "25-29", min: 25, max: 29 },
  { label: "30-34", min: 30, max: 34 },
  { label: "35-39", min: 35, max: 39 },
  { label: "40-49", min: 40, max: 49 },
  { label: "50+", min: 50, max: 200 },
];

function Dashboard() {
  const { user, loading } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [period, setPeriod] = useState<Period>("30d");
  const periodConf = PERIOD_OPTIONS.find((p) => p.id === period)!;
  const periodDays = periodConf.days;
  const periodLabel = periodConf.label;

  // Profile + equipped name gradient
  const profileQuery = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchOnReconnect: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("status, full_name, rejection_reason, equipped_name_gradient_id")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      const prof = (data as Profile | null) ?? null;
      const gradients = await fetchNameGradientsByIds([prof?.equipped_name_gradient_id]);
      const nameGradient = prof?.equipped_name_gradient_id
        ? (gradients[prof.equipped_name_gradient_id] ?? null)
        : null;
      return { profile: prof, nameGradient };
    },
  });
  const profile = profileQuery.data?.profile;
  const profileNameGradient = profileQuery.data?.nameGradient ?? null;

  // Latest news (small payload, independent of period)
  const newsQuery = useQuery({
    queryKey: ["dashboard-latest-news", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchOnReconnect: true,
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_posts")
        .select("id, title, content, published_at")
        .eq("kind", "news")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as LatestNews | null) ?? null;
    },
  });
  const latestNews = newsQuery.data ?? null;

  // Main metrics — depends on userId + period (period only affects views series)
  const metricsQuery = useQuery({
    queryKey: ["dashboard-metrics", user?.id, period],
    enabled: !!user && profile?.status === "approved",
    staleTime: 30_000,
    refetchOnReconnect: true,
    queryFn: async () => {
      let viewsBuilder = supabase
        .from("profile_views")
        .select("id, viewer_id, viewer_age, viewer_city, viewer_state, created_at")
        .eq("viewed_id", user!.id)
        .order("created_at", { ascending: false });
      if (periodDays !== null) {
        const sinceIso = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
        viewsBuilder = viewsBuilder.gte("created_at", sinceIso);
      }
      const [{ data: vw }, intRes, mtsRes] = await Promise.all([
        viewsBuilder,
        supabase
          .from("interests")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user!.id),
        supabase.from("matches").select("id").or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`),
      ]);
      const list = (vw ?? []) as ViewRow[];
      const matchIds = (mtsRes.data ?? []).map((m) => m.id);
      let unread = 0;
      if (matchIds.length) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("match_id", matchIds)
          .neq("sender_id", user!.id)
          .is("read_at", null);
        unread = count ?? 0;
      }
      const uniqIds = Array.from(new Set(list.map((v) => v.viewer_id)));
      const visitorsMap: Record<string, Visitor> = {};
      if (uniqIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, photo_url, city, state, age, equipped_name_gradient_id")
          .in("id", uniqIds);
        const gradients = await fetchNameGradientsByIds(
          ((profs ?? []) as Visitor[]).map((p) => p.equipped_name_gradient_id),
        );
        for (const p of (profs ?? []) as Visitor[]) {
          visitorsMap[p.id] = {
            ...p,
            name_gradient: p.equipped_name_gradient_id
              ? (gradients[p.equipped_name_gradient_id] ?? null)
              : null,
          };
        }
      }
      return {
        views: list,
        visitorsMap,
        interests: intRes.count ?? 0,
        matches: matchIds.length,
        unread,
      };
    },
  });

  const views = useMemo(() => metricsQuery.data?.views ?? [], [metricsQuery.data]);
  const visitorsMap = metricsQuery.data?.visitorsMap ?? {};
  const stats = {
    interests: metricsQuery.data?.interests ?? 0,
    matches: metricsQuery.data?.matches ?? 0,
    unread: metricsQuery.data?.unread ?? 0,
  };

  // Aggregations
  const dailySeries = useMemo(() => {
    const days = periodDays ?? 30;
    const out: { date: string; label: string; views: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        date: key,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        views: 0,
      });
    }
    const idx = new Map(out.map((d, i) => [d.date, i]));
    for (const v of views) {
      const k = v.created_at.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) out[i].views += 1;
    }
    return out;
  }, [views, periodDays]);

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
  if (profileQuery.isLoading || profile === undefined)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/20 via-background to-background">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pt-5 sm:py-10">
          <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass h-24 animate-pulse rounded-2xl shadow-soft" />
            ))}
          </div>
        </main>
      </div>
    );
  if (!profile) {
    if (!isOnline) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/20 via-background to-background">
          <Header />
          <main className="mx-auto max-w-6xl px-4 pt-10">
            <OfflineState
              title="Dashboard indisponível offline"
              description="Conecte-se para carregar suas métricas e status do app."
            />
          </main>
        </div>
      );
    }
    return <Navigate to="/onboarding" />;
  }

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
      title: "Perfil aprovado",
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
  const approved = profile.status === "approved";
  const metricsHasCache = !!metricsQuery.data;
  const showOfflineEmpty = !isOnline && approved && !metricsHasCache && !metricsQuery.isLoading;

  // Attention items — only from real signals
  const attention: { id: string; label: string; to: "/conversas" | "/interesses" }[] = [];
  if (approved) {
    if (stats.unread > 0) {
      attention.push({
        id: "unread",
        label: `${stats.unread} ${stats.unread === 1 ? "mensagem não lida" : "mensagens não lidas"}`,
        to: "/conversas",
      });
    }
    if (stats.interests > 0) {
      attention.push({
        id: "interests",
        label: `${stats.interests} ${stats.interests === 1 ? "interesse recebido" : "interesses recebidos"}`,
        to: "/interesses",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--petal)]/20 via-background to-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:py-10">
        <header className="animate-fade-up grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Dashboard</p>
            <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
              Sua atividade e evolução
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              <GradientName
                name={profile.full_name?.split(" ")[0]}
                gradient={profileNameGradient}
                fallback="Bem-vindo(a)"
              />{" "}
              · métricas dos {periodLabel.toLowerCase()}
            </p>
          </div>
        </header>

        {!isOnline && metricsHasCache && (
          <StaleDataNotice
            className="mt-4"
            message="Você está offline. Mostrando métricas carregadas anteriormente."
          />
        )}

        {approved && (
          <nav aria-label="Período" className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {PERIOD_OPTIONS.map((opt) => {
              const active = opt.id === period;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeriod(opt.id)}
                  aria-pressed={active}
                  disabled={!isOnline && !metricsHasCache}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                    active
                      ? "border-[var(--rose)] bg-[var(--rose)] text-white shadow-soft"
                      : "border-border bg-card/60 text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </nav>
        )}

        <div className="glass animate-fade-up mt-4 flex items-start gap-4 rounded-[1.75rem] p-5 shadow-soft sm:rounded-3xl sm:p-6">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusInfo.bg}`}
          >
            <Icon className={`h-6 w-6 ${statusInfo.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold sm:text-lg">{statusInfo.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{statusInfo.text}</p>
            {profile.status === "rejected" && (
              <Button asChild variant="outline" className="mt-4">
                <Link to="/onboarding">Editar perfil</Link>
              </Button>
            )}
          </div>
        </div>

        {approved && (
          <>
            <div className="mt-4">
              <ProfileCompletenessAlert />
            </div>

            {showOfflineEmpty && (
              <div className="mt-6">
                <OfflineState
                  title="Métricas indisponíveis offline"
                  description="Conecte-se para atualizar visitas, interesses e matches."
                />
              </div>
            )}

            {/* KPIs */}
            <section className="mt-6" aria-labelledby="kpis-heading">
              <h2
                id="kpis-heading"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Indicadores principais
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <StatCard
                  Icon={Eye}
                  label="Visitas"
                  value={totalViews}
                  hint={`${uniqueViewers} únicas`}
                  loading={metricsQuery.isLoading}
                />
                <StatCard
                  Icon={TrendingUp}
                  label="Tendência 7d"
                  value={`${trend > 0 ? "+" : ""}${trend}%`}
                  hint={`${last7} vs ${prev7}`}
                  loading={metricsQuery.isLoading}
                />
                <StatCard
                  Icon={Sparkles}
                  label="Interesses"
                  value={stats.interests}
                  hint="Total"
                  loading={metricsQuery.isLoading}
                />
                <StatCard
                  Icon={Heart}
                  label="Matches"
                  value={stats.matches}
                  hint={`${stats.unread} não lidas`}
                  loading={metricsQuery.isLoading}
                />
              </div>
            </section>

            {/* Atenção necessária */}
            <section className="mt-6" aria-labelledby="attention-heading">
              <h2
                id="attention-heading"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Atenção necessária
              </h2>
              {!metricsQuery.isLoading && attention.length === 0 ? (
                <div className="glass mt-3 flex items-center gap-3 rounded-2xl p-4 shadow-soft">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">Tudo certo por aqui.</p>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {attention.map((a) => (
                    <Link
                      key={a.id}
                      to={a.to}
                      className="glass flex items-center gap-3 rounded-2xl p-4 shadow-soft transition hover:bg-accent"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{a.label}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Tendências (charts lazy) — só quando há dados reais */}
            {totalViews > 0 ? (
              <Suspense
                fallback={<div className="glass mt-6 h-64 animate-pulse rounded-3xl shadow-soft" />}
              >
                <DashboardCharts
                  dailySeries={dailySeries}
                  totalViews={totalViews}
                  ageBucketSeries={ageBucketSeries}
                  topCities={topCities}
                />
              </Suspense>
            ) : !metricsQuery.isLoading && !showOfflineEmpty ? (
              <section className="glass mt-6 rounded-3xl p-6 text-center shadow-soft">
                <p className="text-sm text-muted-foreground">
                  Dados insuficientes para exibir tendência. Continue ativo — assim que houver
                  visitas, os gráficos aparecem aqui.
                </p>
              </section>
            ) : null}

            {/* Visitantes recentes */}
            <section className="glass mt-6 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold sm:text-lg">Visitantes recentes</h3>
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
        <section className="mt-8">
          {latestNews && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Última notícia
              </h2>
              <Link
                to="/noticias"
                className="glass mt-3 flex items-start gap-4 rounded-3xl p-5 shadow-soft transition hover:bg-accent sm:p-6"
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
                  <h3 className="mt-1 truncate text-base font-semibold sm:text-lg">
                    {latestNews.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {latestNews.content}
                  </p>
                </div>
              </Link>
            </div>
          )}
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Atalhos
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <DashCard to="/perfil" Icon={UserIcon} title="Meu perfil" desc="Edite seus dados" />
            <DashCard to="/conversas" Icon={MessageCircle} title="Conversas" desc="Mensagens" />
            <DashCard to="/pretendentes" Icon={Gem} title="Pretendentes" desc="Descobrir" />
            <DashCard to="/interesses" Icon={Sparkles} title="Interesses" desc="Quem demonstrou" />
            <DashCard to="/matches" Icon={Users} title="Matches" desc="Reciprocidade" />
            <DashCard to="/noticias" Icon={Newspaper} title="Notícias" desc="Reflexões e avisos" />
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
  loading,
}: {
  Icon: typeof Users;
  label: string;
  value: number | string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="glass animate-fade-up min-w-0 rounded-2xl p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--rose)]" />
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="mt-1 truncate text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
      )}
      {hint && <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p>}
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
      className="glass group animate-fade-up min-w-0 rounded-2xl p-4 shadow-soft transition hover:shadow-elegant"
    >
      <Icon className="mb-2 h-5 w-5 text-[var(--rose)]" />
      <h3 className="truncate text-sm font-semibold sm:text-base">{title}</h3>
      <p className="truncate text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
