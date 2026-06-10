import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const ROSE = "var(--rose)";
const CORAL = "var(--coral)";

type DailyPoint = { date: string; label: string; views: number };
type AgePoint = { label: string; count: number };
type CityPoint = { name: string; value: number };

export type DashboardChartsProps = {
  dailySeries: DailyPoint[];
  totalViews: number;
  ageBucketSeries: AgePoint[];
  topCities: CityPoint[];
};

/**
 * Heavy recharts bundle isolated here so it only loads on /dashboard.
 * Imported via React.lazy from the route, never at module scope elsewhere.
 */
export default function DashboardCharts({
  dailySeries,
  totalViews,
  ageBucketSeries,
  topCities,
}: DashboardChartsProps) {
  return (
    <>
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
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--popover-foreground)",
                }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke={ROSE}
                strokeWidth={2}
                fill="url(#g-views)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-3xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Faixa etária dos visitantes</h3>
          <p className="text-sm text-muted-foreground">Idade declarada de quem visitou</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageBucketSeries}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="count" fill={CORAL} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass rounded-3xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold">De onde vêm</h3>
          <p className="text-sm text-muted-foreground">Top 5 localidades dos visitantes</p>
          {topCities.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCities}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {topCities.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i % 2 === 0 ? ROSE : CORAL}
                        fillOpacity={1 - i * 0.15}
                      />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </>
  );
}