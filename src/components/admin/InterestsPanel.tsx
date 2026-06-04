import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import {
  Loader2,
  Heart,
  Sparkles,
  ArrowRight,
  Users as UsersIcon,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PhotoImg } from "@/components/PhotoImg";

type InterestRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

type ProfileLite = {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  sex: string | null;
};

type MatchPair = { user_a: string; user_b: string; id: string; created_at: string };

function pairKey(a: string, b: string) {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InterestsPanel() {
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [intRes, matchRes] = await Promise.all([
        supabase
          .from("interests")
          .select("id, sender_id, receiver_id, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("matches").select("id, user_a, user_b, created_at"),
      ]);
      if (intRes.error) {
        toast.error(intRes.error.message);
        setLoading(false);
        return;
      }
      const ints = (intRes.data ?? []) as InterestRow[];
      const ms = (matchRes.data ?? []) as MatchPair[];
      const ids = Array.from(new Set(ints.flatMap((i) => [i.sender_id, i.receiver_id])));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name, photo_url, sex").in("id", ids)
        : { data: [] as ProfileLite[] };
      const map = new Map<string, ProfileLite>();
      for (const p of (profs ?? []) as ProfileLite[]) map.set(p.id, p);
      setInterests(ints);
      setMatches(ms);
      setProfiles(map);
      setLoading(false);
    })();
  }, []);

  const matchPairs = useMemo(
    () => new Set(matches.map((m) => pairKey(m.user_a, m.user_b))),
    [matches],
  );

  const stats = useMemo(() => {
    const totalInterests = interests.length;
    const totalMatches = matches.length;

    // Reciprocal interests (both directions exist)
    const dirSet = new Set(interests.map((i) => `${i.sender_id}->${i.receiver_id}`));
    let reciprocal = 0;
    for (const i of interests) {
      if (dirSet.has(`${i.receiver_id}->${i.sender_id}`) && i.sender_id < i.receiver_id) {
        reciprocal++;
      }
    }

    // Top senders / receivers
    const senderCount = new Map<string, number>();
    const receiverCount = new Map<string, number>();
    for (const i of interests) {
      senderCount.set(i.sender_id, (senderCount.get(i.sender_id) ?? 0) + 1);
      receiverCount.set(i.receiver_id, (receiverCount.get(i.receiver_id) ?? 0) + 1);
    }
    const topSenders = [...senderCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topReceivers = [...receiverCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Last 7 days
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7d = interests.filter((i) => new Date(i.created_at).getTime() >= weekAgo).length;
    const last24h = interests.filter(
      (i) => new Date(i.created_at).getTime() >= Date.now() - 24 * 60 * 60 * 1000,
    ).length;

    const conversionRate = totalInterests > 0 ? ((totalMatches * 2) / totalInterests) * 100 : 0;

    return {
      totalInterests,
      totalMatches,
      reciprocal,
      topSenders,
      topReceivers,
      last7d,
      last24h,
      conversionRate,
    };
  }, [interests, matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interests;
    return interests.filter((i) => {
      const s = profiles.get(i.sender_id)?.full_name?.toLowerCase() ?? "";
      const r = profiles.get(i.receiver_id)?.full_name?.toLowerCase() ?? "";
      return s.includes(q) || r.includes(q);
    });
  }, [query, interests, profiles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Heart className="h-4 w-4" />}
          label="Total de interesses"
          value={stats.totalInterests}
          tone="rose"
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Matches (recíprocos)"
          value={stats.totalMatches}
          tone="emerald"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Taxa de match"
          value={`${stats.conversionRate.toFixed(1)}%`}
          tone="violet"
          hint="Interesses que viraram match"
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Últimas 24h / 7 dias"
          value={`${stats.last24h} / ${stats.last7d}`}
          tone="sky"
        />
      </div>

      {/* Top users */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopList
          title="Quem mais demonstra interesse"
          icon={<UsersIcon className="h-4 w-4" />}
          entries={stats.topSenders}
          profiles={profiles}
        />
        <TopList
          title="Quem mais recebe interesse"
          icon={<Heart className="h-4 w-4" />}
          entries={stats.topReceivers}
          profiles={profiles}
        />
      </div>

      {/* Search + list */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico de interesses ({filtered.length})
          </h3>
          <Input
            placeholder="Buscar por nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum interesse encontrado.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((i) => {
                const sender = profiles.get(i.sender_id);
                const receiver = profiles.get(i.receiver_id);
                const isMatch = matchPairs.has(pairKey(i.sender_id, i.receiver_id));
                return (
                  <li
                    key={i.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={sender?.full_name} url={sender?.photo_url} />
                      <div className="min-w-0">
                        <Link
                          to="/pretendentes/$id"
                          params={{ id: i.sender_id }}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {sender?.full_name ?? "—"}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {sender?.sex ?? ""}
                        </span>
                      </div>
                      <ArrowRight className="mx-2 h-4 w-4 shrink-0 text-rose-500" />
                      <Avatar name={receiver?.full_name} url={receiver?.photo_url} />
                      <div className="min-w-0">
                        <Link
                          to="/pretendentes/$id"
                          params={{ id: i.receiver_id }}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {receiver?.full_name ?? "—"}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {receiver?.sex ?? ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground sm:flex-col sm:items-end sm:gap-1">
                      <span>{formatDate(i.created_at)}</span>
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-500/20">
                          <Sparkles className="h-3 w-3" /> Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-500/20">
                          Sem retorno
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "rose" | "emerald" | "violet" | "sky";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-600 ring-violet-500/20",
    sky: "bg-sky-500/10 text-sky-600 ring-sky-500/20",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TopList({
  title,
  icon,
  entries,
  profiles,
}: {
  title: string;
  icon: React.ReactNode;
  entries: [string, number][];
  profiles: Map<string, ProfileLite>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </h4>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem dados.</p>
      ) : (
        <ol className="space-y-2">
          {entries.map(([uid, count], idx) => {
            const p = profiles.get(uid);
            return (
              <li key={uid} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                  {idx + 1}
                </span>
                <Avatar name={p?.full_name} url={p?.photo_url} />
                <Link
                  to="/pretendentes/$id"
                  params={{ id: uid }}
                  className="flex-1 truncate text-sm hover:underline"
                >
                  {p?.full_name ?? "—"}
                </Link>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {count}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Avatar({ name, url }: { name?: string | null; url?: string | null }) {
  const fallback = (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-love text-xs font-medium text-white">
      {name?.charAt(0) ?? "?"}
    </div>
  );

  if (url) {
    return (
      <PhotoImg
        src={url}
        alt={name ?? ""}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
        fallback={fallback}
      />
    );
  }
  return fallback;
}
