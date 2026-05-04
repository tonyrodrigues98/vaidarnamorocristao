import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BR_STATES } from "@/lib/constants";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/RoleBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ROLE_PRIORITY, type AppRole, type RoleColor } from "@/lib/roles";
import { UserBadges } from "@/components/UserBadges";
import { OnlineDot } from "@/components/OnlineDot";
import { Sparkles } from "lucide-react";
import { computeAffinity, type AffinityChip } from "@/lib/affinity";
import type { AdvancedProfile } from "@/lib/profileAdvanced";

type Profile = {
  id: string; full_name: string; age: number; city: string; state: string;
  church: string; bio: string | null; photo_url: string | null; sex: "masculino" | "feminino";
  marital: "solteiro" | "divorciado"; verified?: boolean;
};
type StaffInfo = { role: AppRole; color: RoleColor | null };
type MyPrefs = { state: string | null; ageMin: number | null; ageMax: number | null };

export const Route = createFileRoute("/pretendentes/")({ component: () => (<RequireApproved><List /></RequireApproved>) });

function List() {
  const { user, loading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [mySex, setMySex] = useState<"masculino" | "feminino" | null>(null);
  const [myPrefs, setMyPrefs] = useState<MyPrefs>({ state: null, ageMin: null, ageMax: null });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [f, setF] = useState({ search: "", state: "all", marital: "all", ageMin: "", ageMax: "", church: "" });
  const [staffMap, setStaffMap] = useState<Record<string, StaffInfo>>({});
  const [myAdvanced, setMyAdvanced] = useState<AdvancedProfile | null>(null);
  const [advancedMap, setAdvancedMap] = useState<Record<string, AdvancedProfile>>({});
  const [onlyVerified, setOnlyVerified] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("pretendentes:onlyVerified") === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pretendentes:onlyVerified", onlyVerified ? "1" : "0");
  }, [onlyVerified]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: me } = await supabase.from("profiles").select("status, sex, state").eq("id", user.id).maybeSingle();
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
        const [profsRes, blocksRes, blockedByRes, hiddenRes, rolesRes, myAdvRes] = await Promise.all([
          supabase.from("profiles")
            .select("id, full_name, age, city, state, church, bio, photo_url, sex, marital, verified")
            .eq("status", "approved").eq("sex", targetSex).neq("id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
          supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id),
          supabase.rpc("get_hidden_staff_ids"),
          supabase.from("user_roles").select("user_id, role, badge_color").neq("role", "user"),
          supabase.from("profile_advanced").select("*").eq("user_id", user.id).maybeSingle(),
        ]);
        const hidden = new Set<string>([
          ...(blocksRes.data ?? []).map((b: any) => b.blocked_id),
          ...(blockedByRes.data ?? []).map((b: any) => b.blocker_id),
          ...(((hiddenRes as any).data ?? []) as any[]).map((x: any) =>
            typeof x === "string" ? x : (x.get_hidden_staff_ids ?? x.user_id ?? "")
          ).filter(Boolean),
        ]);
        const map: Record<string, StaffInfo> = {};
        for (const row of (rolesRes.data ?? []) as Array<{ user_id: string; role: AppRole; badge_color: string | null }>) {
          const existing = map[row.user_id];
          if (!existing || ROLE_PRIORITY.indexOf(row.role) < ROLE_PRIORITY.indexOf(existing.role)) {
            map[row.user_id] = { role: row.role, color: (row.badge_color as RoleColor | null) ?? null };
          }
        }
        setStaffMap(map);
        const visible = ((profsRes.data ?? []) as Profile[]).filter((p) => !hidden.has(p.id));
        setProfiles(visible);
        setMyAdvanced(((myAdvRes as any)?.data ?? null) as AdvancedProfile | null);
        // Batch-load advanced profiles for affinity chips (RLS already restricts to approved)
        const ids = visible.map((p) => p.id);
        if (ids.length > 0) {
          const { data: advs } = await supabase
            .from("profile_advanced")
            .select("*")
            .in("user_id", ids);
          const m: Record<string, AdvancedProfile> = {};
          for (const a of (advs ?? []) as AdvancedProfile[]) m[a.user_id] = a;
          setAdvancedMap(m);
        }
      }
      setLoadingList(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const list = profiles.filter((p) => {
      if (f.search) {
        const q = f.search.toLowerCase();
        if (!p.full_name.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) return false;
      }
      if (f.state !== "all" && p.state !== f.state) return false;
      if (f.marital !== "all" && p.marital !== f.marital) return false;
      if (f.ageMin && p.age < Number(f.ageMin)) return false;
      if (f.ageMax && p.age > Number(f.ageMax)) return false;
      if (f.church && !p.church.toLowerCase().includes(f.church.toLowerCase())) return false;
      if (onlyVerified && !p.verified) return false;
      return true;
    });
    // Geographic ordering: same state first
    if (myPrefs.state) {
      list.sort((a, b) => {
        const aSame = a.state === myPrefs.state ? 0 : 1;
        const bSame = b.state === myPrefs.state ? 0 : 1;
        return aSame - bSame;
      });
    }
    return list;
  }, [profiles, f, onlyVerified, myPrefs.state]);

  function isSuggestion(p: Profile): boolean {
    if (!myPrefs.state) return false;
    if (p.state !== myPrefs.state) return false;
    if (myPrefs.ageMin != null && p.age < myPrefs.ageMin) return false;
    if (myPrefs.ageMax != null && p.age > myPrefs.ageMax) return false;
    return true;
  }

  const hasFilters = f.search || f.state !== "all" || f.marital !== "all" || f.ageMin || f.ageMax || f.church;
  function clearFilters() { setF({ search: "", state: "all", marital: "all", ageMin: "", ageMax: "", church: "" }); }

  if (!loading && !user) return <Navigate to="/auth/login" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="text-4xl font-semibold">Pretendentes</h1>
          <p className="mt-1 text-muted-foreground">
            {mySex === "masculino" ? "Mulheres" : mySex === "feminino" ? "Homens" : "Pessoas"} cristãs aprovados na plataforma.
          </p>
        </div>

        {myStatus !== "approved" ? (
          <div className="glass mt-8 rounded-2xl p-8 text-center shadow-soft">
            <p className="text-muted-foreground">Você precisa ter o perfil aprovado para ver os pretendentes.</p>
          </div>
        ) : (
          <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Input placeholder="Buscar por nome ou cidade..." value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} className="max-w-sm" />
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen((o) => !o)}>
              <SlidersHorizontal className="mr-1 h-4 w-4" /> Filtros
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-4 w-4" /> Limpar</Button>
            )}
            <Button variant={onlyVerified ? "default" : "outline"} size="sm" onClick={() => setOnlyVerified((v) => !v)}>
              ✔ Verificados
            </Button>
            <span className="ml-auto text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "perfil" : "perfis"}</span>
          </div>

          {filtersOpen && (
            <div className="glass mt-3 grid gap-3 rounded-2xl p-4 shadow-soft sm:grid-cols-2 md:grid-cols-5">
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <Select value={f.state} onValueChange={(v) => setF({ ...f, state: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {BR_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado civil</label>
                <Select value={f.marital} onValueChange={(v) => setF({ ...f, marital: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Idade mín.</label>
                <Input type="number" min={18} max={110} value={f.ageMin} onChange={(e) => setF({ ...f, ageMin: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Idade máx.</label>
                <Input type="number" min={18} max={110} value={f.ageMax} onChange={(e) => setF({ ...f, ageMax: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Igreja</label>
                <Input value={f.church} onChange={(e) => setF({ ...f, church: e.target.value })} placeholder="Ex: Batista" />
              </div>
            </div>
          )}
          </>
        )}

        {myStatus === "approved" && (loadingList ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map((i) => <div key={i} className="glass h-80 animate-pulse rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-12 text-center shadow-soft">
            <p className="text-xl">{hasFilters ? "Nenhum perfil corresponde aos filtros." : "Ainda não há pretendentes para mostrar."}</p>
            {hasFilters && <Button variant="outline" className="mt-4" onClick={clearFilters}>Limpar filtros</Button>}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <Link key={p.id} to="/pretendentes/$id" params={{ id: p.id }}
                className="glass group animate-fade-up overflow-hidden rounded-2xl shadow-soft transition hover:shadow-elegant"
                style={{ animationDelay: `${i * 50}ms` }}>
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-love">
                      <span className="text-5xl text-white">{p.full_name.charAt(0)}</span>
                    </div>
                  )}
                  {isSuggestion(p) && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--rose)] px-2 py-1 text-[10px] font-semibold text-white shadow-md">
                      <Sparkles className="h-3 w-3" /> Sugestão pra você
                    </span>
                  )}
                  <span className="absolute right-2 top-2"><OnlineDot userId={p.id} size="md" /></span>
                </div>
                <div className="p-5">
                  <h3 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
                    {p.full_name.split(" ")[0]}, {p.age}
                    {p.verified && <VerifiedBadge size="md" />}
                    {staffMap[p.id] && (
                      <RoleBadge role={staffMap[p.id].role} color={staffMap[p.id].color} />
                    )}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.city} · {p.state}</p>
                  <p className="mt-1 text-xs text-[var(--rose)]">{p.church}</p>
                  <UserBadges userId={p.id} size="xs" max={2} className="mt-2" />
                  <AffinityChips chips={computeAffinity(myAdvanced, advancedMap[p.id])} />
                  {p.bio && <p className="mt-3 line-clamp-2 text-sm text-foreground/70">{p.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
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
          className="inline-flex items-center gap-1 rounded-full border border-[var(--rose)]/30 bg-[var(--rose)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--rose)]"
          title="Vocês têm em comum"
        >
          <Sparkles className="h-2.5 w-2.5" />
          {c.label}
        </span>
      ))}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
}
