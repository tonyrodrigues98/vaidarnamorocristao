import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckCircle2, XCircle, Users, Heart, MessageCircle, Sparkles,
  Globe, Newspaper, Eye, TrendingUp, User as UserIcon, Gem,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

type Profile = {
  status: "pending" | "approved" | "rejected" | "banned";
  full_name: string | null;
  rejection_reason: string | null;
};
type ViewRow = {
  id: string;
  viewer_id: string;
  viewer_age: number | null;
  viewer_city: string | null;
  viewer_state: string | null;
  created_at: string;
};
type Visitor = { id: string; full_name: string; photo_url: string | null; city: string; state: string; age: number };

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

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("status, full_name, rejection_reason").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  useEffect(() => {
    if (!user || profile?.status !== "approved") return;
    const sinceIso = new Date(Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();

    (async () => {
      const [{ data: vw }, intRes, mtsRes] = await Promise.all([
        supabase.from("profile_views")
          .select("id, viewer_id, viewer_age, viewer_city, viewer_state, created_at")
          .eq("viewed_id", user.id)
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false }),
        supabase.from("interests")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id),
        supabase.from("matches")
          .select("id")
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
      ]);
      const list = (vw ?? []) as ViewRow[];
      setViews(list);

      // Unread messages
      const matchIds = (mtsRes.data ?? []).map((m) => m.id);
      let unread = 0;
      if (matchIds.length) {
        const { count } = await supabase.from("messages")
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
          .select("id, full_name, photo_url, city, state, age")
          .in("id", uniqIds);
        const map: Record<string, Visitor> = {};
        for (const p of (profs ?? []) as Visitor[]) map[p.id] = p;
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
      const key = v.viewer_city && v.viewer_state ? `${v.viewer_city} · ${v.viewer_state}` : v.viewer_state ?? "—";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [views]);

  const totalViews = views.length;
  const uniqueViewers = useMemo(() => new Set(views.map((v) => v.viewer_id)).size, [views]);
  const last7 = useMemo(() => dailySeries.slice(-7).reduce((a, d) => a + d.views, 0), [dailySeries]);
  const prev7 = useMemo(() => dailySeries.slice(-14, -7).reduce((a, d) => a + d.views, 0), [dailySeries]);
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
  if (profile === undefined) return <div className="min-h-screen"><Header /></div>;
  if (!profile) return <Navigate to="/onboarding/etapa-1" />;

  const statusInfo = {
    pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", title: "Perfil em análise", text: "Sua inscrição está sendo revisada por nossa equipe. Você será avisado(a) assim que for aprovada." },
    approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", title: "Perfil aprovado!", text: "Bem-vindo(a) à comunidade. Conheça os pretendentes." },
    rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", title: "Perfil rejeitado", text: profile.rejection_reason ?? "Entre em contato com a equipe." },
    banned: { icon: XCircle, color: "text-red-700", bg: "bg-red-50", title: "Conta suspensa", text: "Sua conta foi suspensa." },
  }[profile.status];

  const Icon = statusInfo.icon;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up">
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-4xl font-semibold">{profile.full_name?.split(" ")[0] ?? "Bem-vindo(a)"}</h1>
        </div>

        <div className="glass animate-fade-up mt-6 flex items-start gap-4 rounded-3xl p-6 shadow-soft">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusInfo.bg}`}>
            <Icon className={`h-6 w-6 ${statusInfo.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{statusInfo.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{statusInfo.text}</p>
            {profile.status === "rejected" && (
              <Button asChild variant="outline" className="mt-4"><Link to="/onboarding/etapa-1">Editar perfil</Link></Button>
            )}
          </div>
        </div>

        {profile.status === "approved" && (
          <>
            {/* Resumo */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Resumo dos últimos {PERIOD_DAYS} dias</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard Icon={Eye} label="Visitas ao perfil" value={totalViews} hint={`${uniqueViewers} pessoas únicas`} />
                <StatCard Icon={TrendingUp} label="Tendência (7d)" value={`${trend > 0 ? "+" : ""}${trend}%`} hint={`${last7} vs ${prev7} visitas`} />
                <StatCard Icon={Sparkles} label="Interesses recebidos" value={stats.interests} hint="Total acumulado" />
                <StatCard Icon={Heart} label="Matches" value={stats.matches} hint={`${stats.unread} mensagens não lidas`} />
              </div>
            </section>

            {/* Gráfico de visitas */}
            <section className="glass animate-fade-up mt-8 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Quem viu seu perfil</h3>
                  <p className="text-sm text-muted-foreground">Visitas por dia</p>
                </div>
                <span className="rounded-full bg-[var(--petal)] px-3 py-1 text-xs font-medium text-[var(--rose)]">
                  {totalViews} visitas
                </span>
              </div>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g-views" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ROSE} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={ROSE} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Area type="monotone" dataKey="views" stroke={ROSE} strokeWidth={2} fill="url(#g-views)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Faixa etária */}
              <section className="glass rounded-3xl p-6 shadow-soft">
                <h3 className="text-lg font-semibold">Faixa etária dos visitantes</h3>
                <p className="text-sm text-muted-foreground">Idade declarada de quem visitou</p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageBucketSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} />
                      <Bar dataKey="count" fill={CORAL} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Top cidades */}
              <section className="glass rounded-3xl p-6 shadow-soft">
                <h3 className="text-lg font-semibold">De onde vêm</h3>
                <p className="text-sm text-muted-foreground">Top 5 localidades dos visitantes</p>
                {topCities.length === 0 ? (
                  <p className="mt-8 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
                ) : (
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topCities} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={2}>
                          {topCities.map((_, i) => (
                            <Cell key={i} fill={i % 2 === 0 ? ROSE : CORAL} fillOpacity={1 - i * 0.15} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            </div>

            {/* Visitantes recentes */}
            <section className="glass mt-6 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Visitantes recentes</h3>
                  <p className="text-sm text-muted-foreground">Últimas pessoas únicas que viram seu perfil</p>
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
                          <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-love text-lg text-white">
                            {p.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.full_name.split(" ")[0]}, {p.age}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.city} · {p.state}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(v.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
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
          <h2 className="text-xl font-semibold">Atalhos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashCard to="/perfil" Icon={UserIcon} title="Meu perfil" desc="Edite seus dados e preferências" />
            <DashCard to="/conversas" Icon={MessageCircle} title="Conversas" desc="Suas mensagens privadas" />
            <DashCard to="/comunidade" Icon={Globe} title="Comunidade" desc="Chat global em tempo real" />
            <DashCard to="/pretendentes" Icon={Gem} title="Pretendentes" desc="Conheça pessoas com a mesma fé" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DashCard to="/interesses" Icon={Sparkles} title="Interesses" desc="Quem demonstrou interesse" />
            <DashCard to="/matches" Icon={Users} title="Matches" desc="Conexões com reciprocidade" />
            <DashCard to="/noticias" Icon={Newspaper} title="Notícias & Devocional" desc="Reflexões e avisos" />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  Icon, label, value, hint,
}: { Icon: typeof Users; label: string; value: number | string; hint?: string }) {
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
  to, Icon, title, desc,
}: { to: string; Icon: typeof Users; title: string; desc: string }) {
  return (
    <Link to={to} className="glass group animate-fade-up rounded-2xl p-6 shadow-soft transition hover:shadow-elegant">
      <Icon className="mb-3 h-6 w-6 text-[var(--rose)]" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
