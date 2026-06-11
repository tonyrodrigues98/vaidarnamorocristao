import { friendlyError } from "@/lib/errors";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getActiveCommitmentByUser } from "@/lib/commitments";
import { Header } from "@/components/layout/Header";
import { ProfileSkeleton } from "@/components/ui/AppSkeletons";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  MapPin,
  Church,
  Heart,
  Flag,
  Ban,
  MessageCircle,
  Check,
  Gift,
  Sparkles,
  Baby,
  Globe2,
  ShieldOff,
  Ruler,
  HandHeart,
  Quote,
  CalendarHeart,
  Cake,
  Target,
  Users2,
  Gem,
  UserX,
} from "lucide-react";
import { RoleBadge } from "@/components/RoleBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { OnlineDot } from "@/components/OnlineDot";
import { UserBadges } from "@/components/UserBadges";
import { EquippedPetBadge } from "@/components/EquippedPetBadge";
import { ProfileAdvancedView } from "@/components/ProfileAdvancedView";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { ROLE_PRIORITY, type AppRole, type RoleColor } from "@/lib/roles";
import { SendAnonymousButton } from "@/components/anonymous/SendAnonymousButton";
import { GiftHighlights } from "@/components/gifts/GiftHighlights";
import type { ProfileBackground } from "@/lib/profileBackgrounds";
import { GradientName } from "@/components/GradientName";
import { fetchNameGradientsByIds, type NameGradient } from "@/lib/nameGradients";
import { PHOTO_CATEGORIES, normalizeCategory } from "@/lib/photoCategories";
import {
  getPurposeCompatibility,
  type CompatPrefs,
  type CompatProfile,
} from "@/lib/purposeCompatibility";
import { Handshake, MessageSquareHeart } from "lucide-react";

type Full = {
  id: string;
  full_name: string;
  age: number;
  height_cm: number | null;
  city: string;
  state: string;
  church: string;
  bio: string | null;
  photo_url: string | null;
  marital: string;
  years_baptized: number;
  sex: string;
  verified?: boolean;
  equipped_background_id?: string | null;
  equipped_frame_id?: string | null;
  equipped_aura_id?: string | null;
  equipped_name_gradient_id?: string | null;
};
type Prefs = {
  age_min: number;
  age_max: number;
  accepts_children: boolean;
  desired_quality: string | null;
  looking_for_bio: string | null;
  location_scope: string;
  custom_states: string[] | null;
};

export const Route = createFileRoute("/pretendentes/$id")({
  component: () => (
    <RequireApproved>
      <Detail />
    </RequireApproved>
  ),
});

function Detail() {
  const { id } = Route.useParams();
  const { user, loading, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Full | null | undefined>(undefined);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [interestSent, setInterestSent] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasCommitment, setHasCommitment] = useState(false);
  const [profileCommitted, setProfileCommitted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportAlsoBlock, setReportAlsoBlock] = useState(true);
  const [mySex, setMySex] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<{ role: AppRole; color: RoleColor | null } | null>(
    null,
  );
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [categorizedPhotos, setCategorizedPhotos] = useState<
    Array<{ url: string; category: string | null }>
  >([]);
  const [equippedBackground, setEquippedBackground] = useState<ProfileBackground | null>(null);
  const [profileNameGradient, setProfileNameGradient] = useState<NameGradient | null>(null);
  const [myProfile, setMyProfile] = useState<CompatProfile | null>(null);
  const [myPrefs, setMyPrefs] = useState<CompatPrefs | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role, badge_color")
        .eq("user_id", id);
      const rows = (data ?? []) as Array<{ role: AppRole; badge_color: string | null }>;
      let best: { role: AppRole; color: RoleColor | null } | null = null;
      for (const r of rows) {
        if (r.role === "user") continue;
        if (!best || ROLE_PRIORITY.indexOf(r.role) < ROLE_PRIORITY.indexOf(best.role)) {
          best = { role: r.role, color: (r.badge_color as RoleColor | null) ?? null };
        }
      }
      setTargetRole(best);
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const active = await getActiveCommitmentByUser(user.id);
      setHasCommitment(!!active);
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("sex")
        .eq("id", user.id)
        .maybeSingle();
      setMySex((data?.sex as string | undefined) ?? null);
    })();
  }, [user]);

  // Snapshot do perfil/preferências do usuário logado para a comparação de
  // "Compatibilidade de Propósito". Campos mínimos, sem mexer em banco.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: mp }, { data: mpref }] = await Promise.all([
        supabase
          .from("profiles")
          .select("age, city, state, church, years_baptized")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_preferences")
          .select("age_min, age_max, accepts_children")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setMyProfile((mp ?? null) as CompatProfile | null);
      setMyPrefs((mpref ?? null) as CompatPrefs | null);
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();
      setProfile(prof as Full | null);
      const gradientId = (prof as Full | null)?.equipped_name_gradient_id;
      const gradients = await fetchNameGradientsByIds([gradientId]);
      setProfileNameGradient(gradientId ? (gradients[gradientId] ?? null) : null);
      const backgroundId = (prof as Full | null)?.equipped_background_id;
      if (backgroundId) {
        const { data: bg } = await supabase
          .from("profile_backgrounds" as never)
          .select("*")
          .eq("id", backgroundId)
          .eq("is_active", true)
          .maybeSingle();
        setEquippedBackground((bg ?? null) as unknown as ProfileBackground | null);
      } else {
        setEquippedBackground(null);
      }
      const { data: pr } = await supabase
        .from("profile_preferences")
        .select(
          "age_min,age_max,accepts_children,desired_quality,looking_for_bio,location_scope,custom_states",
        )
        .eq("user_id", id)
        .maybeSingle();
      setPrefs((pr ?? null) as Prefs | null);
      const { data: ph } = await supabase
        .from("profile_photos")
        .select("url, sort_order, created_at, category")
        .eq("user_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      const rows = (ph ?? []) as Array<{ url: string; category: string | null }>;
      setExtraPhotos(rows.map((r) => r.url));
      setCategorizedPhotos(rows);
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      const activeCommitment = await getActiveCommitmentByUser(id);
      setProfileCommitted(!!activeCommitment);
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [intRes, matchRes, blockRes] = await Promise.all([
        supabase
          .from("interests")
          .select("id")
          .eq("sender_id", user.id)
          .eq("receiver_id", id)
          .maybeSingle(),
        supabase
          .from("matches")
          .select("id")
          .or(`and(user_a.eq.${user.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${user.id})`)
          .maybeSingle(),
        supabase
          .from("blocks")
          .select("id")
          .eq("blocker_id", user.id)
          .eq("blocked_id", id)
          .maybeSingle(),
      ]);
      setInterestSent(!!intRes.data);
      setMatchId(matchRes.data?.id ?? null);
      setBlocked(!!blockRes.data);
    })();
  }, [user, id]);

  // Register a profile view (throttled to once per 30 min per pair, viewer-side).
  useEffect(() => {
    if (!user || user.id === id) return;
    const key = `pv:${user.id}:${id}`;
    const last =
      typeof window !== "undefined" ? Number(window.sessionStorage.getItem(key) ?? 0) : 0;
    if (Date.now() - last < 30 * 60 * 1000) return;
    (async () => {
      const { data: me } = await supabase
        .from("profiles")
        .select("age, city, state")
        .eq("id", user.id)
        .maybeSingle();
      const { error } = await supabase.from("profile_views").insert({
        viewer_id: user.id,
        viewed_id: id,
        viewer_age: me?.age ?? null,
        viewer_city: me?.city ?? null,
        viewer_state: me?.state ?? null,
      });
      if (!error && typeof window !== "undefined") {
        window.sessionStorage.setItem(key, String(Date.now()));
      }
    })();
  }, [user, id]);

  async function demonstrarInteresse() {
    if (!user) return;

    if (hasCommitment) {
      toast.error("Você já firmou propósito com outra pessoa.");

      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("interests")
      .insert({ sender_id: user.id, receiver_id: id });
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Interesse enviado 💗");
    setInterestSent(true);
    // refresh match
    const { data: m } = await supabase
      .from("matches")
      .select("id")
      .or(`and(user_a.eq.${user.id},user_b.eq.${id}),and(user_a.eq.${id},user_b.eq.${user.id})`)
      .maybeSingle();
    if (m) setMatchId(m.id);
  }

  async function bloquear() {
    if (!user) return;
    if (!confirm("Bloquear este perfil? Vocês não aparecerão mais um para o outro.")) return;
    setBusy(true);
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: id });
    setBusy(false);
    toast.success("Perfil bloqueado");
    setBlocked(true);
  }

  async function desbloquear() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", id);
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Perfil desbloqueado");
    setBlocked(false);
  }

  async function enviarDenuncia() {
    if (!user || reportReason.trim().length < 3) {
      toast.error("Descreva o motivo (mín. 3 caracteres)");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: id,
      reason: reportReason.trim().slice(0, 1000),
    });
    if (error) {
      setBusy(false);
      toast.error(friendlyError(error));
      return;
    }
    if (reportAlsoBlock && !blocked) {
      await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: id });
      setBlocked(true);
    }
    setBusy(false);
    toast.success(
      reportAlsoBlock
        ? "Denúncia enviada e perfil bloqueado."
        : "Denúncia enviada. Nossa equipe vai analisar.",
    );
    setReportReason("");
    setReportOpen(false);
  }

  const compatibility = useMemo(() => {
    if (!profile) return null;
    const targetProfile: CompatProfile = {
      age: profile.age,
      city: profile.city,
      state: profile.state,
      church: profile.church,
      years_baptized: profile.years_baptized,
    };
    const targetPrefs: CompatPrefs | null = prefs
      ? {
          age_min: prefs.age_min,
          age_max: prefs.age_max,
          accepts_children: prefs.accepts_children,
        }
      : null;
    return getPurposeCompatibility({
      currentProfile: myProfile,
      currentPrefs: myPrefs,
      targetProfile,
      targetPrefs,
    });
  }, [profile, prefs, myProfile, myPrefs]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (profile === undefined)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mt-6 grid gap-8 md:grid-cols-[2fr_3fr]">
            <ProfileSkeleton />
            <ProfileSkeleton />
          </div>
        </main>
      </div>
    );
  if (!profile)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-12">
          <AppEmptyState
            icon={<UserX className="h-6 w-6" />}
            title="Perfil não encontrado"
            description="Esse perfil pode estar indisponível, removido ou fora dos critérios atuais."
            actionLabel="Voltar para pretendentes"
            actionTo="/pretendentes"
          />
        </main>
      </div>
    );

  if (blocked)
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="rounded-[2rem] border border-border/70 bg-card/85 p-8 shadow-[0_20px_70px_rgba(31,41,55,0.08)] backdrop-blur dark:bg-card/80 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <Ban className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold">Perfil bloqueado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Você bloqueou este perfil. Mensagens e informações ficam ocultas até você desbloquear.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={desbloquear} disabled={busy} className="w-full">
                <ShieldOff className="mr-2 h-4 w-4" /> Desbloquear
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/pretendentes">Voltar</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );

  const hasPremiumBackground = Boolean(equippedBackground?.image_url);

  const showCompatibility =
    !!user &&
    !!profile &&
    user.id !== profile.id &&
    !!compatibility &&
    compatibility.hasEnoughData &&
    (compatibility.commonPoints.length > 0 || compatibility.conversationPoints.length > 0);

  const actionCardClass = hasPremiumBackground
    ? "rounded-[2rem] border border-white/60 bg-card/82 p-4 text-foreground shadow-[0_20px_70px_rgba(31,41,55,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-card/72 dark:shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
    : "rounded-[2rem] border border-border/70 bg-card/85 p-4 shadow-[0_20px_70px_rgba(31,41,55,0.08)] backdrop-blur dark:bg-card/80 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]";
  const surfaceClass = hasPremiumBackground
    ? "rounded-[2rem] border border-white/60 bg-card/86 p-5 text-foreground shadow-[0_20px_70px_rgba(31,41,55,0.12)] backdrop-blur-xl sm:p-6 dark:border-white/10 dark:bg-card/78 dark:shadow-[0_24px_80px_rgba(0,0,0,0.38)]"
    : "rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-[0_20px_70px_rgba(31,41,55,0.08)] backdrop-blur sm:p-6 dark:bg-card/80 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]";
  const hasHiddenPrimaryActions =
    (profile && mySex && profile.sex === mySex) || Boolean(targetRole && !isAdmin);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Header />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[380px] bg-white dark:bg-[linear-gradient(120deg,rgba(10,16,34,0.98),rgba(17,31,63,0.82)_34%,rgba(18,44,82,0.78)_70%,rgba(42,35,22,0.44))]"
      />

      {equippedBackground?.image_url && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[380px] overflow-hidden"
        >
          <img src={equippedBackground.image_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/28 via-white/14 to-background/82 dark:from-black/52 dark:via-black/26 dark:to-background/86" />

          <div className="absolute inset-0 bg-gradient-to-r from-background/38 via-transparent to-background/42 dark:from-black/34 dark:via-transparent dark:to-black/38" />
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        {/* Voltar */}
        <Link
          to="/pretendentes"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm shadow-sm transition ${
            hasPremiumBackground
              ? "border border-border/60 bg-card/75 text-foreground backdrop-blur-xl hover:bg-card/90 dark:border-white/10 dark:bg-card/60 dark:hover:bg-card/80"
              : "border border-border/60 bg-card/75 text-muted-foreground backdrop-blur hover:text-foreground"
          }`}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        {/* Hero premium: fundo como ambientacao, foto/moldura/aura como foco */}
        <section
          className={`relative mt-4 overflow-visible rounded-[2.25rem] border pt-36 shadow-[0_24px_90px_rgba(31,41,55,0.10)] backdrop-blur-xl sm:pt-44 lg:pt-52 dark:shadow-[0_28px_90px_rgba(0,0,0,0.42)] ${
            hasPremiumBackground
              ? "border-white/60 bg-card/86 dark:border-white/10 dark:bg-card/76"
              : "border-border/70 bg-card/90 dark:bg-card/82"
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-52 overflow-hidden rounded-t-[2.25rem] sm:h-64 lg:h-72">
            {equippedBackground?.image_url ? (
              <img
                src={equippedBackground.image_url}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(239,246,255,0.88)_48%,rgba(254,243,199,0.78))] dark:bg-[linear-gradient(135deg,rgba(51,25,40,0.86),rgba(15,35,58,0.82)_52%,rgba(64,47,24,0.62))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-white/18 via-white/10 to-card/72 dark:from-black/42 dark:via-black/22 dark:to-card/78" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/86 via-card/36 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-card/28 to-transparent dark:from-black/24" />
            <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-card/28 to-transparent dark:from-black/24" />
          </div>

          <div className="relative z-10 grid gap-5 p-4 pt-0 sm:p-6 sm:pt-0 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.1fr)_minmax(320px,0.7fr)] xl:items-start">
            <div className="relative -mt-20 overflow-visible rounded-[2rem] p-0 sm:-mt-24 lg:-mt-28">
              <div className="relative overflow-visible rounded-[1.65rem] p-0">
                <div className="relative z-10 flex min-h-[170px] items-center justify-center overflow-visible py-0 sm:min-h-[220px] lg:min-h-[245px]">
                  <div className="sm:hidden">
                    <DecoratedAvatar
                      photoUrl={profile.photo_url}
                      fallback={profile.full_name.charAt(0)}
                      alt={profile.full_name}
                      size={122}
                      frameId={profile.equipped_frame_id ?? null}
                      auraId={profile.equipped_aura_id ?? null}
                      isCommitted={profileCommitted}
                    />
                  </div>
                  <div className="hidden sm:block lg:hidden">
                    <DecoratedAvatar
                      photoUrl={profile.photo_url}
                      fallback={profile.full_name.charAt(0)}
                      alt={profile.full_name}
                      size={154}
                      frameId={profile.equipped_frame_id ?? null}
                      auraId={profile.equipped_aura_id ?? null}
                      isCommitted={profileCommitted}
                    />
                  </div>
                  <div className="hidden lg:block">
                    <DecoratedAvatar
                      photoUrl={profile.photo_url}
                      fallback={profile.full_name.charAt(0)}
                      alt={profile.full_name}
                      size={162}
                      frameId={profile.equipped_frame_id ?? null}
                      auraId={profile.equipped_aura_id ?? null}
                      isCommitted={profileCommitted}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Identidade */}
              <div
                className={
                  hasPremiumBackground
                    ? "rounded-[2rem] border border-white/60 bg-card/82 p-5 text-foreground shadow-[0_20px_70px_rgba(31,41,55,0.14)] backdrop-blur-xl sm:p-7 dark:border-white/10 dark:bg-card/70 dark:shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
                    : "rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-[0_20px_70px_rgba(31,41,55,0.08)] backdrop-blur sm:p-7 dark:bg-card/80"
                }
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h1 className="text-3xl font-black leading-tight text-foreground sm:text-4xl">
                      <GradientName name={profile.full_name} gradient={profileNameGradient} />,{" "}
                      {profile.age}
                    </h1>
                    {profile.verified && <VerifiedBadge size="md" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {targetRole && (
                      <RoleBadge role={targetRole.role} color={targetRole.color} size="sm" />
                    )}
                    <OnlineDot userId={profile.id} size="sm" showLabel />
                  </div>
                  <UserBadges userId={profile.id} size="sm" max={6} />

                  {profileCommitted && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200">
                      <Gem className="h-3.5 w-3.5" />
                      Em Propósito Firmado
                    </div>
                  )}

                  {/* Chips de informações principais */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile.city && (
                      <Chip icon={<MapPin className="h-3.5 w-3.5" />} tone="rose">
                        {profile.city}, {profile.state}
                      </Chip>
                    )}
                    {profile.height_cm && (
                      <Chip icon={<Ruler className="h-3.5 w-3.5" />} tone="sky">
                        {profile.height_cm} cm
                      </Chip>
                    )}
                    {profile.church && (
                      <Chip icon={<Church className="h-3.5 w-3.5" />} tone="violet">
                        {profile.church}
                      </Chip>
                    )}
                    <Chip icon={<Sparkles className="h-3.5 w-3.5" />} tone="amber">
                      {profile.marital === "solteiro"
                        ? "Solteiro(a)"
                        : profile.marital === "viuvo"
                          ? "Viúvo(a)"
                          : "Divorciado(a)"}
                    </Chip>
                    {profile.years_baptized ? (
                      <Chip icon={<CalendarHeart className="h-3.5 w-3.5" />} tone="emerald">
                        {profile.years_baptized} anos de batismo
                      </Chip>
                    ) : null}
                  </div>

                  {/* Bio completa renderizada na seção "Sobre" abaixo */}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!hasHiddenPrimaryActions && (
                <div className={actionCardClass}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {profileCommitted ? (
                      <Button size="lg" className="app-pressable w-full sm:col-span-2" disabled variant="outline">
                        <Gem className="mr-2 h-4 w-4" />
                        Usuario em Proposito
                      </Button>
                    ) : matchId ? (
                      <Button size="lg" className="app-pressable w-full shadow-glow sm:col-span-2" asChild>
                        <Link to="/conversas/$matchId" params={{ matchId }}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Conversar
                        </Link>
                      </Button>
                    ) : interestSent ? (
                      <Button size="lg" variant="outline" className="app-pressable w-full sm:col-span-2" disabled>
                        <Check className="mr-2 h-4 w-4" /> Interesse enviado
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="app-pressable w-full shadow-glow sm:col-span-2"
                        disabled={busy}
                        onClick={demonstrarInteresse}
                      >
                        <Heart className="mr-2 h-4 w-4" /> Demonstrar interesse
                      </Button>
                    )}

                    {user &&
                      user.id !== profile.id &&
                      !profileCommitted &&
                      mySex &&
                      profile.sex !== mySex && (
                        <div className="sm:col-span-2">
                          <SendAnonymousButton receiverId={profile.id} />
                        </div>
                      )}

                    {user && user.id !== profile.id && !profileCommitted && (
                      <Button
                        variant="outline"
                        className="app-pressable w-full border-pink-400/50 bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20"
                        asChild
                      >
                        <Link to="/presentes" search={{ to: profile.id } as never}>
                          <Gift className="mr-2 h-4 w-4" />
                          Enviar Presente
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="app-pressable w-full"
                      onClick={() => toast.success("Oracao registrada com carinho")}
                    >
                      <HandHeart className="mr-2 h-4 w-4" /> Orar por ele(a)
                    </Button>
                  </div>

                  <div className="mt-4">
                    <GiftHighlights userId={profile.id} />
                  </div>
                </div>
              )}

              {hasHiddenPrimaryActions && (
                <div className={actionCardClass}>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Algumas ações ficam ocultas conforme as regras de segurança e elegibilidade do
                    Vai Dar Namoro Cristão.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`mt-6 ${surfaceClass}`}>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--rose)]/10 text-[var(--rose)]">
              <Sparkles className="h-4 w-4" />
            </span>
            Fotos
          </h2>
          <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-muted/45 p-2 dark:bg-background/25">
            <div className="overflow-hidden rounded-[1.15rem]">
              <PhotoCarousel
                photos={[...(profile.photo_url ? [profile.photo_url] : []), ...extraPhotos]}
                alt={profile.full_name}
                eager
                className="aspect-[4/3] bg-muted sm:aspect-[16/10]"
                imgClassName="object-contain"
                fallback={
                  <div className="flex h-full w-full items-center justify-center bg-gradient-love">
                    <span className="text-4xl text-white">{profile.full_name.charAt(0)}</span>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {categorizedPhotos.some((p) => !!p.category) && (
          <section className={`mt-6 ${surfaceClass}`}>
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
              </span>
              Fé e vida
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Um pouco da caminhada e dos momentos dessa pessoa.
            </p>
            <div className="space-y-5">
              {PHOTO_CATEGORIES.map((cat) => {
                const photosInCat = categorizedPhotos.filter(
                  (p) => normalizeCategory(p.category) === cat.value,
                );
                if (photosInCat.length === 0) return null;
                return (
                  <div key={cat.value} className="min-w-0">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {cat.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {photosInCat.map((p) => (
                        <div
                          key={p.url}
                          className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted"
                        >
                          <img
                            src={p.url}
                            alt={cat.label}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {profileCommitted && (
          <div
            className="
      mt-6
      overflow-hidden
      rounded-[2rem]
      border
      border-emerald-200/70
      bg-gradient-to-br
      from-emerald-50
      via-card
      to-emerald-50
      p-6
      shadow-[0_20px_70px_rgba(31,41,55,0.08)] dark:border-emerald-400/25 dark:from-emerald-500/15 dark:via-card/80 dark:to-teal-500/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]
    "
          >
            <div className="flex items-start gap-4">
              <div
                className="
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-emerald-100
          text-emerald-700
          dark:bg-emerald-400/15
          dark:text-emerald-200
        "
              >
                <Gem className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Propósito Firmado
                </h3>

                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-100/80">
                  Este usuário está em um propósito ativo e não está disponível para novas conexões
                  românticas.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Bio */}
        {profile.bio && (
          <section className={`mt-6 ${surfaceClass}`}>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--rose)]/10 text-[var(--rose)]">
                <Quote className="h-4 w-4" />
              </span>
              Sobre mim
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{profile.bio}</p>
          </section>
        )}

        {showCompatibility && compatibility && (
          <section className={`mt-6 ${surfaceClass}`}>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Handshake className="h-4 w-4" />
              </span>
              Compatibilidade de propósito
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Alguns pontos reais que podem ajudar vocês a conversarem melhor.
            </p>

            {compatibility.commonPoints.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Pontos em comum
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {compatibility.commonPoints.map((item) => (
                    <li
                      key={item.key}
                      className="min-w-0 rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 text-sm dark:border-emerald-400/20 dark:bg-emerald-400/5"
                    >
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {compatibility.conversationPoints.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  <MessageSquareHeart className="h-3.5 w-3.5" />
                  Vale conversar sobre
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {compatibility.conversationPoints.map((item) => (
                    <li
                      key={item.key}
                      className="min-w-0 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 text-sm dark:border-amber-400/20 dark:bg-amber-400/5"
                    >
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-[11px] leading-snug text-muted-foreground/80">
              Esta é uma leitura simples baseada nos dados de perfil. Não é uma promessa de
              compatibilidade — converse com calma e oração.
            </p>
          </section>
        )}

        {/* Mais sobre */}
        <div className={`mt-6 ${surfaceClass}`}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-foreground">Mais sobre</h2>
          </div>
          <ProfileAdvancedView userId={profile.id} />
        </div>

        {/* Preferências */}
        {prefs && (
          <section className={`mt-6 ${surfaceClass}`}>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
                <Target className="h-4 w-4" />
              </span>
              O que está buscando
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <Chip icon={<Cake className="h-3.5 w-3.5" />} tone="rose">
                {prefs.age_min}–{prefs.age_max} anos
              </Chip>
              <Chip
                icon={<Baby className="h-3.5 w-3.5" />}
                tone={prefs.accepts_children ? "emerald" : "slate"}
              >
                {prefs.accepts_children ? "Aceita filhos" : "Sem filhos"}
              </Chip>
              <Chip icon={<Globe2 className="h-3.5 w-3.5" />} tone="sky">
                {prefs.location_scope === "personalizado"
                  ? (prefs.custom_states ?? []).length > 0
                    ? (prefs.custom_states ?? []).join(", ")
                    : "—"
                  : prefs.location_scope === "regiao"
                    ? "Mesma região"
                    : prefs.location_scope === "brasil"
                      ? "Brasil todo"
                      : prefs.location_scope === "mundo"
                        ? "Mundo todo"
                        : prefs.location_scope}
              </Chip>
            </div>

            {(prefs.desired_quality || prefs.looking_for_bio) && (
              <dl className="mt-5 space-y-4 text-sm">
                {prefs.desired_quality && (
                  <div className="rounded-xl bg-amber-500/5 p-3.5 ring-1 ring-amber-500/15">
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" /> Qualidade que mais valoriza
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">{prefs.desired_quality}</dd>
                  </div>
                )}
                {prefs.looking_for_bio && (
                  <div className="rounded-xl bg-[var(--rose)]/5 p-3.5 ring-1 ring-[var(--rose)]/15">
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--rose)]">
                      <Users2 className="h-3.5 w-3.5" /> Sobre o que busca
                    </dt>
                    <dd className="mt-1 leading-relaxed text-foreground/90">
                      {prefs.looking_for_bio}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </section>
        )}

        {/* Ações secundárias */}
        <div className={`mt-6 ${surfaceClass}`}>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-300">
              <Flag className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-foreground">Segurança</h2>
          </div>
          <div className="flex gap-2">
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="app-pressable flex-1 text-muted-foreground">
                  <Flag className="mr-1 h-4 w-4" /> Denunciar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Denunciar perfil</DialogTitle>
                </DialogHeader>
                <Textarea
                  rows={4}
                  maxLength={1000}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Conte o que aconteceu..."
                />
                <label className="mt-2 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
                  <Checkbox
                    checked={reportAlsoBlock}
                    onCheckedChange={(c) => setReportAlsoBlock(c === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">Também bloquear este perfil</span>
                    <span className="block text-xs text-muted-foreground">
                      As mensagens e o perfil ficarão ocultos. Você poderá desbloquear depois.
                    </span>
                  </span>
                </label>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReportOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={enviarDenuncia} disabled={busy}>
                    Enviar denúncia
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              className="app-pressable flex-1 text-muted-foreground"
              disabled={busy || blocked}
              onClick={bloquear}
            >
              <Ban className="mr-1 h-4 w-4" /> {blocked ? "Bloqueado" : "Bloquear"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

type ChipTone = "rose" | "sky" | "violet" | "amber" | "emerald" | "slate";
const CHIP_TONES: Record<ChipTone, string> = {
  rose: "bg-[var(--rose)]/10 text-[var(--rose)] ring-[var(--rose)]/20",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20",
};

function Chip({
  icon,
  tone = "rose",
  children,
}: {
  icon?: React.ReactNode;
  tone?: ChipTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${CHIP_TONES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
