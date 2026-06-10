import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PretendenteCarousel } from "@/components/pretendentes/PretendenteCarousel";
import { PretendenteFeaturedCard } from "@/components/pretendentes/PretendenteFeaturedCard";
import { useAuth } from "@/lib/auth";
import { getActiveCommitmentByUser } from "@/lib/commitments";
import { Header } from "@/components/layout/Header";
import { MobileAppHeader } from "@/components/mobile/MobileAppHeader";
import { PretendentesSkeleton } from "@/components/ui/AppSkeletons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BR_STATES } from "@/lib/constants";
import {
  ArrowRight,
  Gem,
  Heart,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_PRIORITY, type AppRole, type RoleColor } from "@/lib/roles";
import { computeAffinity, type AffinityChip } from "@/lib/affinity";
import { LOVE_LANGUAGE, MINISTRY, type AdvancedProfile } from "@/lib/profileAdvanced";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { markHomeChecklistStep } from "@/lib/homeChecklist";

type Profile = {
  id: string;
  full_name: string;
  age: number;
  city: string;
  state: string;
  church: string;
  bio: string | null;
  photo_url: string | null;
  sex: "masculino" | "feminino";
  marital: "solteiro" | "divorciado";
  verified?: boolean;
  created_at?: string;
};
type StaffInfo = { role: AppRole; color: RoleColor | null };
type MyPrefs = { state: string | null; ageMin: number | null; ageMax: number | null };

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  state: fallback(z.string(), "all").default("all"),
  marital: fallback(z.enum(["all", "solteiro", "divorciado"]), "all").default("all"),
  ageMin: fallback(z.number().int().min(18).max(110).optional(), undefined),
  ageMax: fallback(z.number().int().min(18).max(110).optional(), undefined),
  church: fallback(z.string(), "").default(""),
  ministry: fallback(z.string(), "all").default("all"),
  loveLang: fallback(z.string(), "all").default("all"),
  verified: fallback(z.boolean(), false).default(false),
  sort: fallback(z.enum(["affinity", "recent", "geographic"]), "affinity").default("affinity"),
});

export const Route = createFileRoute("/pretendentes/")({
  component: () => (
    <RequireApproved>
      <List />
    </RequireApproved>
  ),
  validateSearch: zodValidator(searchSchema),
});

function List() {
  const { user, loading, role, rolesLoaded } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/pretendentes/" });

  function update<K extends keyof typeof search>(key: K, value: (typeof search)[K] | undefined) {
    navigate({
      search: (prev: typeof search) => ({ ...prev, [key]: value }) as any,
      replace: true,
    });
  }
  function clearAll() {
    navigate({ search: { sort: search.sort } as any, replace: true });
  }

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [activeCommitment, setActiveCommitment] = useState<any>(null);
  const [mySex, setMySex] = useState<"masculino" | "feminino" | null>(null);
  const [myPrefs, setMyPrefs] = useState<MyPrefs>({ state: null, ageMin: null, ageMax: null });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [staffMap, setStaffMap] = useState<Record<string, StaffInfo>>({});
  const [myAdvanced, setMyAdvanced] = useState<AdvancedProfile | null>(null);
  const [advancedMap, setAdvancedMap] = useState<Record<string, AdvancedProfile>>({});
  const [extraPhotos, setExtraPhotos] = useState<Record<string, string[]>>({});

  const [ageMinInput, setAgeMinInput] = useState<string>(
    search.ageMin != null ? String(search.ageMin) : "",
  );
  const [ageMaxInput, setAgeMaxInput] = useState<string>(
    search.ageMax != null ? String(search.ageMax) : "",
  );

  function commitAge(field: "ageMin" | "ageMax", raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (field === "ageMin") setAgeMinInput(digits);
    else setAgeMaxInput(digits);
    if (digits === "") {
      update(field, undefined);
      return;
    }
    const n = Number(digits);
    if (Number.isFinite(n) && n >= 18 && n <= 110) {
      update(field, n);
    }
  }

  useEffect(() => {
    if (!user) return;
    if (!rolesLoaded) return;
    markHomeChecklistStep(user.id, "explore");
    (async () => {
      const commitment = await getActiveCommitmentByUser(user.id);
      setActiveCommitment(commitment);
      const isSuperAdmin = role === "super_admin";
      if (commitment && !isSuperAdmin) {
        setProfiles([]);
        setLoadingList(false);
        return;
      }
      const { data: me } = await supabase
        .from("profiles")
        .select("status, sex, state")
        .eq("id", user.id)
        .maybeSingle();
      setMyStatus(me?.status ?? null);
      setMySex(me?.sex ?? null);
      const { data: prefs } = await supabase
        .from("profile_preferences")
        .select("age_min, age_max")
        .eq("user_id", user.id)
        .maybeSingle();
      setMyPrefs({
        state: me?.state ?? null,
        ageMin: prefs?.age_min ?? null,
        ageMax: prefs?.age_max ?? null,
      });
      if (me?.status === "approved") {
        const targetSex = me.sex === "masculino" ? "feminino" : "masculino";
        const [profsRes, blocksRes, blockedByRes, hiddenRes, rolesRes, myAdvRes, commitmentsRes] =
          await Promise.all([
            supabase
              .from("profiles")
              .select(
                "id, full_name, age, city, state, church, bio, photo_url, sex, marital, verified, created_at",
              )
              .eq("status", "approved")
              .eq("sex", targetSex)
              .neq("id", user.id)
              .order("created_at", { ascending: false }),
            supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
            supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id),
            supabase.rpc("get_hidden_staff_ids"),
            supabase.from("user_roles").select("user_id, role, badge_color").neq("role", "user"),
            supabase.from("profile_advanced").select("*").eq("user_id", user.id).maybeSingle(),
            supabase
              .from("relationship_commitments")
              .select("user_a,user_b")
              .eq("status", "active"),
          ]);
        const hidden = new Set<string>([
          ...(blocksRes.data ?? []).map((b: any) => b.blocked_id),
          ...(blockedByRes.data ?? []).map((b: any) => b.blocker_id),
          ...(((hiddenRes as any).data ?? []) as any[])
            .map((x: any) =>
              typeof x === "string" ? x : (x.get_hidden_staff_ids ?? x.user_id ?? ""),
            )
            .filter(Boolean),
        ]);
        const map: Record<string, StaffInfo> = {};
        for (const row of (rolesRes.data ?? []) as Array<{
          user_id: string;
          role: AppRole;
          badge_color: string | null;
        }>) {
          const existing = map[row.user_id];
          if (!existing || ROLE_PRIORITY.indexOf(row.role) < ROLE_PRIORITY.indexOf(existing.role)) {
            map[row.user_id] = {
              role: row.role,
              color: (row.badge_color as RoleColor | null) ?? null,
            };
          }
        }
        setStaffMap(map);
        const committedUsers = new Set<string>();

        for (const row of commitmentsRes.data ?? []) {
          committedUsers.add(row.user_a);

          committedUsers.add(row.user_b);
        }

        const visible = ((profsRes.data ?? []) as Profile[]).filter((p) => {
          if (hidden.has(p.id)) return false;
          if (!isSuperAdmin && committedUsers.has(p.id)) return false;
          return true;
        });
        setProfiles(visible);
        setMyAdvanced(((myAdvRes as any)?.data ?? null) as AdvancedProfile | null);
        const ids = visible.map((p) => p.id);
        if (ids.length > 0) {
          const [{ data: advs }, { data: extraPhotosData }] = await Promise.all([
            supabase.from("profile_advanced").select("*").in("user_id", ids),
            supabase
              .from("profile_photos")
              .select("user_id, url, sort_order, created_at")
              .in("user_id", ids)
              .order("sort_order", { ascending: true })
              .order("created_at", { ascending: true }),
          ]);
          const m: Record<string, AdvancedProfile> = {};
          for (const a of (advs ?? []) as AdvancedProfile[]) m[a.user_id] = a;
          setAdvancedMap(m);
          const ph: Record<string, string[]> = {};
          for (const r of (extraPhotosData ?? []) as Array<{ user_id: string; url: string }>) {
            (ph[r.user_id] ||= []).push(r.url);
          }
          setExtraPhotos(ph);
        }
      }
      setLoadingList(false);
    })();
  }, [user, role, rolesLoaded]);

  // Compute affinity per profile (memoized)
  const affinityByProfile = useMemo(() => {
    const out: Record<string, AffinityChip[]> = {};
    for (const p of profiles) {
      out[p.id] = computeAffinity(myAdvanced, advancedMap[p.id]);
    }
    return out;
  }, [profiles, myAdvanced, advancedMap]);

  // Total possible affinity points (rough): use max chip count seen, fallback 10
  const maxScore = useMemo(() => {
    let m = 0;
    for (const id in affinityByProfile) m = Math.max(m, affinityByProfile[id].length);
    return Math.max(m, 10);
  }, [affinityByProfile]);

  const filtered = useMemo(() => {
    const list = profiles.filter((p) => {
      if (search.q) {
        const qq = search.q.toLowerCase();
        if (!p.full_name.toLowerCase().includes(qq) && !p.city.toLowerCase().includes(qq))
          return false;
      }
      if (search.state !== "all" && p.state !== search.state) return false;
      if (search.marital !== "all" && p.marital !== search.marital) return false;
      if (search.ageMin != null && p.age < search.ageMin) return false;
      if (search.ageMax != null && p.age > search.ageMax) return false;
      if (search.church && !p.church.toLowerCase().includes(search.church.toLowerCase()))
        return false;
      if (search.verified && !p.verified) return false;
      if (search.ministry !== "all") {
        const adv = advancedMap[p.id];
        if (!adv || adv.ministry !== search.ministry) return false;
      }
      if (search.loveLang !== "all") {
        const adv = advancedMap[p.id];
        if (!adv || adv.love_language !== search.loveLang) return false;
      }
      return true;
    });

    // Sort
    if (search.sort === "affinity") {
      list.sort((a, b) => {
        const aff = (affinityByProfile[b.id]?.length ?? 0) - (affinityByProfile[a.id]?.length ?? 0);
        if (aff !== 0) return aff;
        // tiebreaker: same state first
        if (myPrefs.state) {
          const aSame = a.state === myPrefs.state ? 0 : 1;
          const bSame = b.state === myPrefs.state ? 0 : 1;
          if (aSame !== bSame) return aSame - bSame;
        }
        return 0;
      });
    } else if (search.sort === "recent") {
      list.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    } else if (search.sort === "geographic" && myPrefs.state) {
      list.sort((a, b) => {
        const aSame = a.state === myPrefs.state ? 0 : 1;
        const bSame = b.state === myPrefs.state ? 0 : 1;
        return aSame - bSame;
      });
    }
    return list;
  }, [profiles, search, advancedMap, affinityByProfile, myPrefs.state]);

  const topMatches = useMemo(() => {
    return [...filtered]
      .sort(
        (a, b) => (affinityByProfile[b.id]?.length ?? 0) - (affinityByProfile[a.id]?.length ?? 0),
      )
      .slice(0, 10);
  }, [filtered, affinityByProfile]);

  const nearbyProfiles = useMemo(() => {
    return filtered.filter((p) => p.state === myPrefs.state).slice(0, 10);
  }, [filtered, myPrefs.state]);

  const newestProfiles = useMemo(() => {
    return [...filtered]
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, 10);
  }, [filtered]);

  function isSuggestion(p: Profile): boolean {
    if (!myPrefs.state) return false;
    if (p.state !== myPrefs.state) return false;
    if (myPrefs.ageMin != null && p.age < myPrefs.ageMin) return false;
    if (myPrefs.ageMax != null && p.age > myPrefs.ageMax) return false;
    return true;
  }

  const hasFilters =
    !!search.q ||
    search.state !== "all" ||
    search.marital !== "all" ||
    search.ageMin != null ||
    search.ageMax != null ||
    !!search.church ||
    search.ministry !== "all" ||
    search.loveLang !== "all" ||
    search.verified;

  const isSuperAdmin = role === "super_admin";
  const canBrowsePretendentes = (!activeCommitment || isSuperAdmin) && myStatus === "approved";
  const audienceLabel =
    mySex === "masculino" ? "Mulheres" : mySex === "feminino" ? "Homens" : "Pessoas";

  if (!loading && !user) return <Navigate to="/auth/login" />;

  if (user && !rolesLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-background to-background dark:from-rose-950/10 dark:via-background dark:to-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PretendentesSkeleton cards={3} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-background to-background dark:from-rose-950/10 dark:via-background dark:to-background">
      <Header />
      <MobileAppHeader title="Pretendentes" subtitle="Conheça pessoas com propósito" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-card/70 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-rose-300/25 blur-3xl dark:bg-rose-700/20" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-800/20" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-rose-50/80 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-200">
                <Heart className="h-3.5 w-3.5" />
                Encontros com propósito
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Pretendentes
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {audienceLabel} com perfis cristãos aprovados na plataforma, organizados por
                afinidade, região e detalhes do perfil para ajudar você a conhecer alguém com calma
                e segurança.
              </p>
            </div>
            {canBrowsePretendentes && (
              <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border/60 bg-background/70 p-4 text-center shadow-sm backdrop-blur md:min-w-[280px]">
                <div>
                  <p className="text-2xl font-semibold">{filtered.length}</p>
                  <p className="text-xs text-muted-foreground">perfis visíveis</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{topMatches.length}</p>
                  <p className="text-xs text-muted-foreground">destaques</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {activeCommitment && !isSuperAdmin ? (
          <section className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-8 text-center shadow-soft backdrop-blur dark:border-emerald-800/40 dark:from-emerald-950/30 dark:via-background dark:to-rose-950/20 sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400/20 via-white to-rose-400/20 shadow-inner dark:via-white/10">
              <Gem className="h-10 w-10 text-emerald-600 dark:text-emerald-300" />
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight">Propósito Firmado</h2>

            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Você está em um propósito ativo. Por isso, a área de pretendentes fica pausada
              enquanto esse compromisso estiver firmado.
            </p>

            <Button asChild size="lg" className="mt-7 rounded-full px-6">
              <Link
                to="/proposito/$matchId"
                params={{
                  matchId: activeCommitment.match_id,
                }}
              >
                Ver Página do Casal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/60 px-4 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-white/5 dark:text-emerald-200">
              <Lock className="h-3.5 w-3.5" />
              Pretendentes pausados durante o compromisso
            </div>
          </section>
        ) : myStatus !== "approved" ? (
          <section className="mt-8 rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-soft backdrop-blur">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <ShieldCheck className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-muted-foreground">
              Você precisa ter o perfil aprovado para ver os pretendentes.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-6 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-soft backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Input
                  placeholder="Buscar por nome ou cidade..."
                  value={search.q}
                  onChange={(e) => update("q", e.target.value)}
                  className="h-11 rounded-2xl bg-background/80 lg:max-w-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setFiltersOpen((o) => !o)}
                >
                  <SlidersHorizontal className="mr-1 h-4 w-4" /> Filtros
                </Button>
                {hasFilters && (
                  <Button variant="ghost" size="sm" className="rounded-full" onClick={clearAll}>
                    <X className="mr-1 h-4 w-4" /> Limpar
                  </Button>
                )}
                <Button
                  variant={search.verified ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => update("verified", !search.verified)}
                >
                  <ShieldCheck className="mr-1 h-4 w-4" /> Verificados
                </Button>
                <div className="flex flex-1 items-center gap-2 lg:justify-end">
                  <Select value={search.sort} onValueChange={(v) => update("sort", v as any)}>
                    <SelectTrigger className="h-11 rounded-2xl bg-background/80 sm:w-[190px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="affinity">Afinidade</SelectItem>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="geographic">Mais próximos</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="rounded-full bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {filtered.length}
                  </span>
                </div>
              </div>
            </div>

            {filtersOpen && (
              <div className="mt-4 grid gap-3 rounded-3xl border border-border/60 bg-background/65 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <div>
                  <label className="text-xs text-muted-foreground">Estado</label>
                  <Select value={search.state} onValueChange={(v) => update("state", v)}>
                    <SelectTrigger className="mt-1 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {BR_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Estado civil</label>
                  <Select value={search.marital} onValueChange={(v) => update("marital", v as any)}>
                    <SelectTrigger className="mt-1 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Idade mín.</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    placeholder="18"
                    value={ageMinInput}
                    className="mt-1 rounded-2xl"
                    onChange={(e) => commitAge("ageMin", e.target.value)}
                    onBlur={() => {
                      if (ageMinInput === "") return;
                      const n = Number(ageMinInput);
                      if (!Number.isFinite(n) || n < 18 || n > 110) {
                        setAgeMinInput("");
                        update("ageMin", undefined);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Idade máx.</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    placeholder="110"
                    value={ageMaxInput}
                    className="mt-1 rounded-2xl"
                    onChange={(e) => commitAge("ageMax", e.target.value)}
                    onBlur={() => {
                      if (ageMaxInput === "") return;
                      const n = Number(ageMaxInput);
                      if (!Number.isFinite(n) || n < 18 || n > 110) {
                        setAgeMaxInput("");
                        update("ageMax", undefined);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Igreja</label>
                  <Input
                    value={search.church}
                    onChange={(e) => update("church", e.target.value)}
                    placeholder="Ex: Batista"
                    className="mt-1 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ministério</label>
                  <Select value={search.ministry} onValueChange={(v) => update("ministry", v)}>
                    <SelectTrigger className="mt-1 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {MINISTRY.map((m) => (
                        <SelectItem key={m.v} value={m.v}>
                          {m.l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Linguagem do amor</label>
                  <Select value={search.loveLang} onValueChange={(v) => update("loveLang", v)}>
                    <SelectTrigger className="mt-1 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {LOVE_LANGUAGE.map((m) => (
                        <SelectItem key={m.v} value={m.v}>
                          {m.l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </>
        )}

        {canBrowsePretendentes &&
          (loadingList ? (
            <div className="mt-8">
              <PretendentesSkeleton cards={3} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-border/70 bg-card/80 p-10 text-center shadow-soft backdrop-blur sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-4 text-xl font-semibold">
                {hasFilters
                  ? "Nenhum perfil corresponde aos filtros."
                  : "Ainda não há pretendentes para mostrar."}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Ajuste a busca ou volte mais tarde para encontrar novos perfis aprovados.
              </p>
              {hasFilters && (
                <Button variant="outline" className="mt-5 rounded-full" onClick={clearAll}>
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mt-8 overflow-hidden rounded-3xl border border-rose-200/60 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-8 text-white shadow-elegant dark:border-rose-900/40">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">
                    <Sparkles className="h-3.5 w-3.5" />
                    Descobertas
                  </p>

                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                    Pessoas compatíveis com você
                  </h2>

                  <p className="mt-3 text-white/90">
                    Baseado na sua fé, afinidade, localização e interesses.
                  </p>
                </div>
              </div>
              <PretendenteCarousel
                title="Mais compatíveis"
                subtitle="Perfis com maior afinidade"
                profiles={topMatches}
                affinityByProfile={affinityByProfile}
                maxScore={maxScore}
                myAdvanced={myAdvanced}
                extraPhotos={extraPhotos}
                staffMap={staffMap}
                isSuggestion={isSuggestion}
              />

              <PretendenteCarousel
                title="Perto de você"
                subtitle="Pessoas da mesma região"
                profiles={nearbyProfiles}
                affinityByProfile={affinityByProfile}
                maxScore={maxScore}
                myAdvanced={myAdvanced}
                extraPhotos={extraPhotos}
                staffMap={staffMap}
                isSuggestion={isSuggestion}
              />

              <PretendenteCarousel
                title="Novos na plataforma"
                subtitle="Perfis adicionados recentemente"
                profiles={newestProfiles}
                affinityByProfile={affinityByProfile}
                maxScore={maxScore}
                myAdvanced={myAdvanced}
                extraPhotos={extraPhotos}
                staffMap={staffMap}
                isSuggestion={isSuggestion}
              />
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p, i) => {
                  const chips = affinityByProfile[p.id] ?? [];
                  const score =
                    maxScore > 0 ? Math.min(99, Math.round((chips.length / maxScore) * 100)) : 0;
                  const showScore = chips.length >= 3 && score >= 50 && !!myAdvanced;
                  return (
                    <PretendenteFeaturedCard
                      key={p.id}
                      profile={p}
                      photos={[...(p.photo_url ? [p.photo_url] : []), ...(extraPhotos[p.id] ?? [])]}
                      score={score}
                      showScore={showScore}
                      chips={chips}
                      eager={i < 3}
                      isSuggestion={isSuggestion(p)}
                      staff={staffMap[p.id]}
                    />
                  );
                })}
              </div>
            </>
          ))}
      </main>
    </div>
  );
}

function AffinityChips({ chips }: { chips: AffinityChip[] }) {
  if (!chips.length) return null;
  const visible = chips.slice(0, 4);
  const extra = chips.length - visible.length;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {visible.map((c) => (
        <span
          key={c.key}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--rose)]/30 bg-[var(--rose)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--rose)] sm:text-[10px]"
          title="Vocês têm em comum"
        >
          <Sparkles className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{c.label}</span>
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:text-[10px]">
          +{extra}
        </span>
      )}
    </div>
  );
}
