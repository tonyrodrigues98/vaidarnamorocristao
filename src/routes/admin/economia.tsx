import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  Minus,
  X,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
import { PhotoImg } from "@/components/PhotoImg";
import { useAuth } from "@/lib/auth";
import { extractProfilePhotoPath } from "@/lib/photoUrl";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/economia")({
  component: AdminEconomiaPage,
});

type EconomyTotals = {
  tx_count: number;
  active_users: number;
  coins_in: number;
  coins_out: number;
};

type EconomyByKind = {
  kind: string;
  direction: "in" | "out";
  tx_count: number;
  total: number;
};

type EconomyBalanceDist = {
  users_total: number;
  users_at_cap: number;
  users_400_499: number;
  users_200_399: number;
  users_50_199: number;
  users_under_50: number;
  avg_balance: number;
  median_balance: number;
};

type EconomyDaily = {
  day: string;
  coins_in: number;
  coins_out: number;
  active_users: number;
};

type EconomySummary = {
  window_days: number;
  totals: EconomyTotals;
  by_kind: EconomyByKind[];
  balance_dist: EconomyBalanceDist;
  daily: EconomyDaily[];
};

const WINDOWS = [7, 30, 90] as const;
const TABS = ["overview", "users"] as const;
type Tab = (typeof TABS)[number];

const KIND_LABEL: Record<string, string> = {
  daily_claim: "Resgate diário",
  quiz_bonus: "Quiz Bíblico",
  mission_reward: "Missão do pet",
  achievement_unlock: "Conquista",
  pet_random_event: "Evento do pet",
  sticker_spend: "Sticker enviado",
  pet_care: "Item do pet",
  pet_background: "Fundo do pet",
  profile_background: "Fundo do perfil",
  name_gradient: "Gradiente de nome",
  decoration: "Decoração",
  avatar_item: "Item de avatar",
  virtual_gift: "Presente virtual",
  admin_grant: "Crédito do admin",
};

const fmt = new Intl.NumberFormat("pt-BR");

function kindLabel(kind: string) {
  return KIND_LABEL[kind] ?? kind;
}

function AdminEconomiaPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<EconomySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const { data, error } = await supabase.rpc(
        "admin_economy_summary" as never,
        { _days: days } as never,
      );
      if (cancel) return;
      if (error) {
        setError(error.message);
        setData(null);
      } else {
        setData(data as unknown as EconomySummary);
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [days]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/inicio" />;
  }

  const sinks = data?.by_kind.filter((k) => k.direction === "out") ?? [];
  const faucets = data?.by_kind.filter((k) => k.direction === "in") ?? [];
  const ratio = data && data.totals.coins_out > 0
    ? data.totals.coins_in / data.totals.coins_out
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminTopNav eyebrow="Economia" compact />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Economia da plataforma</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Faucets, sinks, distribuição de saldos e gestão por usuário.
            </p>
          </div>
          {tab === "overview" && (
          <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setDays(w)}
                className={`rounded-full px-3 py-1.5 transition ${
                  days === w
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
          )}
        </header>

        <div className="mb-5 inline-flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={`rounded-full px-3 py-1.5 transition ${tab === "overview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Visão geral
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`rounded-full px-3 py-1.5 transition ${tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Usuários
          </button>
        </div>

        {tab === "users" && <UsersTab />}

        {tab === "overview" && loading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {tab === "overview" && error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            Não foi possível carregar os dados: {error}
          </div>
        )}

        {tab === "overview" && data && !loading && (
          <div className="space-y-6">
            {/* KPIs */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi
                icon={<TrendingUp className="size-4" />}
                label="Moedas geradas"
                value={fmt.format(data.totals.coins_in)}
                tone="positive"
              />
              <Kpi
                icon={<TrendingDown className="size-4" />}
                label="Moedas gastas"
                value={fmt.format(data.totals.coins_out)}
                tone="negative"
              />
              <Kpi
                icon={<Users className="size-4" />}
                label="Usuários ativos"
                value={fmt.format(data.totals.active_users)}
              />
              <Kpi
                icon={<Wallet className="size-4" />}
                label="Razão entra/sai"
                value={ratio === null ? "—" : ratio.toFixed(2) + "×"}
                tone={
                  ratio === null
                    ? undefined
                    : ratio > 1.5
                      ? "warning"
                      : ratio < 0.6
                        ? "negative"
                        : "positive"
                }
              />
            </section>

            {/* Balance distribution */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Distribuição de saldo (todos os usuários)
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-6">
                <DistCell label="Total" value={data.balance_dist.users_total} />
                <DistCell label="< 50" value={data.balance_dist.users_under_50} />
                <DistCell label="50–199" value={data.balance_dist.users_50_199} />
                <DistCell label="200–399" value={data.balance_dist.users_200_399} />
                <DistCell label="400–499" value={data.balance_dist.users_400_499} />
                <DistCell
                  label="No cap (500)"
                  value={data.balance_dist.users_at_cap}
                  highlight
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Saldo médio:{" "}
                  <strong className="text-foreground">
                    {Number(data.balance_dist.avg_balance).toFixed(0)}
                  </strong>
                </span>
                <span>
                  Mediana:{" "}
                  <strong className="text-foreground">
                    {fmt.format(data.balance_dist.median_balance)}
                  </strong>
                </span>
                {data.balance_dist.users_total > 0 && (
                  <span>
                    % no cap:{" "}
                    <strong className="text-foreground">
                      {(
                        (data.balance_dist.users_at_cap /
                          data.balance_dist.users_total) *
                        100
                      ).toFixed(1)}
                      %
                    </strong>
                  </span>
                )}
              </div>
            </section>

            {/* Faucets & Sinks */}
            <section className="grid gap-4 md:grid-cols-2">
              <KindList
                title="Faucets (entradas)"
                icon={<ArrowDownLeft className="size-4 text-emerald-600" />}
                items={faucets}
              />
              <KindList
                title="Sinks (saídas)"
                icon={<ArrowUpRight className="size-4 text-rose-600" />}
                items={sinks}
              />
            </section>

            {/* Daily series */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Atividade diária
              </h2>
              <div className="mt-3 max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 text-left font-medium">Dia</th>
                      <th className="py-2 text-right font-medium">Entrou</th>
                      <th className="py-2 text-right font-medium">Saiu</th>
                      <th className="py-2 text-right font-medium">Ativos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.daily].reverse().map((d) => (
                      <tr key={d.day} className="border-b border-border/60 last:border-0">
                        <td className="py-2 font-mono text-xs">{d.day}</td>
                        <td className="py-2 text-right tabular-nums text-emerald-600">
                          +{fmt.format(d.coins_in)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-rose-600">
                          −{fmt.format(d.coins_out)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {fmt.format(d.active_users)}
                        </td>
                      </tr>
                    ))}
                    {data.daily.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-xs text-muted-foreground"
                        >
                          Sem transações no período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "positive" | "negative" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-rose-600"
        : tone === "warning"
          ? "text-amber-600"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

function DistCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-amber-300 bg-amber-50" : "border-border bg-background"
      }`}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums ${
          highlight ? "text-amber-700" : "text-foreground"
        }`}
      >
        {fmt.format(value)}
      </div>
    </div>
  );
}

function KindList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: EconomyByKind[];
}) {
  const max = items.reduce((m, i) => Math.max(m, i.total), 0) || 1;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Sem registros no período.</p>
        )}
        {items.map((k) => {
          const pct = (k.total / max) * 100;
          return (
            <div key={k.kind}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{kindLabel(k.kind)}</span>
                <span className="tabular-nums text-muted-foreground">
                  {fmt.format(k.total)}{" "}
                  <span className="text-[11px] text-muted-foreground/70">
                    ({fmt.format(k.tx_count)} tx)
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary/70 to-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SearchedUser = {
  user_id: string;
  full_name: string | null;
  photo_url: string | null;
  signed_photo_url?: string | null;
  balance: number;
  claim_streak: number;
  top_role: string;
};

type UserTx = {
  id: string;
  kind: string;
  direction: "in" | "out";
  amount: number;
  balance_after: number;
  title: string;
  subtitle: string | null;
  created_at: string;
};

type UserEconomy = {
  user_id: string;
  balance: number;
  claim_streak: number;
  totals: { coins_in: number; coins_out: number; tx_count: number };
  transactions: UserTx[];
};

async function signEconomyUserPhotos(users: SearchedUser[]): Promise<SearchedUser[]> {
  const paths = users
    .map((u) => extractProfilePhotoPath(u.photo_url))
    .filter((path): path is string => Boolean(path));
  const uniquePaths = Array.from(new Set(paths));
  if (uniquePaths.length === 0) return users;

  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrls(uniquePaths, 60 * 60);

  if (error || !data) return users;

  const signedByPath = new Map<string, string>();
  data.forEach((entry, index) => {
    if (entry.signedUrl) signedByPath.set(uniquePaths[index], entry.signedUrl);
  });

  return users.map((user) => {
    const path = extractProfilePhotoPath(user.photo_url);
    return { ...user, signed_photo_url: path ? signedByPath.get(path) ?? null : user.photo_url };
  });
}

function UsersTab() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchedUser | null>(null);
  const [eco, setEco] = useState<UserEconomy | null>(null);
  const [ecoLoading, setEcoLoading] = useState(false);

  // debounced search
  useEffect(() => {
    let cancel = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc(
        "admin_search_users" as never,
        { _q: q, _limit: 25 } as never,
      );
      if (cancel) return;
      if (error) {
        toast.error("Falha ao buscar usuários: " + error.message);
        setResults([]);
      } else {
        const users = (data ?? []) as unknown as SearchedUser[];
        const signedUsers = await signEconomyUserPhotos(users);
        if (cancel) return;
        setResults(signedUsers);
      }
      setSearching(false);
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q]);

  const loadEconomy = async (uid: string) => {
    setEcoLoading(true);
    const { data, error } = await supabase.rpc(
      "admin_user_economy" as never,
      { _user_id: uid, _limit: 80 } as never,
    );
    if (error) {
      toast.error("Falha ao carregar economia: " + error.message);
      setEco(null);
    } else {
      setEco(data as unknown as UserEconomy);
    }
    setEcoLoading(false);
  };

  const openUser = (u: SearchedUser) => {
    setSelected(u);
    void loadEconomy(u.user_id);
  };

  const closeUser = () => {
    setSelected(null);
    setEco(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, cidade ou ID…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {searching && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!searching && results.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </p>
        )}
        {!searching && results.length > 0 && (
          <ul className="divide-y divide-border">
            {results.map((u) => (
              <li key={u.user_id}>
                <button
                  type="button"
                  onClick={() => openUser(u)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                >
                  <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    <PhotoImg src={u.photo_url} alt="" className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.full_name || "(sem nome)"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.top_role}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {fmt.format(u.balance)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      streak {u.claim_streak}d
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <UserEconomyDrawer
          user={selected}
          eco={eco}
          loading={ecoLoading}
          onClose={closeUser}
          onChanged={() => loadEconomy(selected.user_id)}
        />
      )}
    </div>
  );
}

function UserEconomyDrawer({
  user,
  eco,
  loading,
  onClose,
  onChanged,
}: {
  user: SearchedUser;
  eco: UserEconomy | null;
  loading: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    const n = parseInt(amount.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const grant = async (sign: 1 | -1) => {
    if (parsed === 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc(
      "admin_grant_coins" as never,
      { _user_id: user.user_id, _amount: parsed * sign, _note: note || null } as never,
    );
    setSubmitting(false);
    if (error) {
      toast.error("Falha: " + error.message);
      return;
    }
    const d = data as unknown as { balance: number; delta: number };
    toast.success(
      `${d.delta > 0 ? "+" : ""}${d.delta} moedas · novo saldo ${d.balance}`,
    );
    setAmount("");
    setNote("");
    onChanged();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-10 overflow-hidden rounded-full bg-muted">
              <PhotoImg src={user.photo_url} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user.full_name || "(sem nome)"}
              </p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {user.user_id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {loading || !eco ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <Kpi
                  icon={<Wallet className="size-4" />}
                  label="Saldo atual"
                  value={fmt.format(eco.balance)}
                />
                <Kpi
                  icon={<TrendingUp className="size-4" />}
                  label="Total ganho"
                  value={fmt.format(eco.totals.coins_in)}
                  tone="positive"
                />
                <Kpi
                  icon={<TrendingDown className="size-4" />}
                  label="Total gasto"
                  value={fmt.format(eco.totals.coins_out)}
                  tone="negative"
                />
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recarregar / ajustar moedas
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Use + para creditar ou − para debitar. Sem limite de 500 nas
                  ações administrativas; saldo nunca fica negativo.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    placeholder="Quantidade"
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 120))}
                    placeholder="Motivo (opcional)"
                    className="flex-[2] rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={submitting || parsed === 0}
                    onClick={() => grant(1)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Plus className="size-4" /> Creditar
                  </button>
                  <button
                    type="button"
                    disabled={submitting || parsed === 0}
                    onClick={() => grant(-1)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    <Minus className="size-4" /> Debitar
                  </button>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Últimas {eco.transactions.length} transações
                </h3>
                <div className="max-h-72 overflow-auto rounded-2xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left font-medium">Quando</th>
                        <th className="px-3 py-2 text-left font-medium">Tipo</th>
                        <th className="px-3 py-2 text-right font-medium">Valor</th>
                        <th className="px-3 py-2 text-right font-medium">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eco.transactions.map((t) => (
                        <tr key={t.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium">{t.title}</p>
                            {t.subtitle && (
                              <p className="text-[11px] text-muted-foreground">
                                {t.subtitle}
                              </p>
                            )}
                          </td>
                          <td
                            className={`px-3 py-2 text-right tabular-nums ${t.direction === "in" ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {t.direction === "in" ? "+" : "−"}
                            {fmt.format(t.amount)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {fmt.format(t.balance_after)}
                          </td>
                        </tr>
                      ))}
                      {eco.transactions.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-6 text-center text-xs text-muted-foreground"
                          >
                            Sem transações registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}