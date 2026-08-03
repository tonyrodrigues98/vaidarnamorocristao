import { PhotoImg } from "@/components/PhotoImg";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AuthenticatedRouteGate } from "@/v2/app/AuthenticatedRouteGate";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MissionsTodayCard } from "@/components/pet/MissionsTodayCard";
import { getActiveCommitmentByUser } from "@/lib/commitments";
import commitmentRing from "@/assets/commitment-ring.webp";
import {
  calculateProfileStrength,
  getProfileStrengthLabel,
  getProfileStrengthNextActions,
  hasClaimedFreeFrameLocal,
  type StrengthAdvanced,
  type StrengthPreferences,
  type ChecklistAction,
} from "@/lib/profileStrength";
import {
  Sparkles,
  ArrowRight,
  BookHeart,
  Heart,
  MessageCircle,
  Compass,
  Bell,
  Frame,
  Ban,
  ClipboardList,
  AlertTriangle,
  MessageSquareWarning,
  Send,
  ChevronRight,
  Stars,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Users,
  Radar,
  Clock,
  Newspaper,
  VenetianMask,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { inicioMetadata } from "@/config/route-metadata";
import {
  NativeInicioView,
  type NativeInicioViewModel,
} from "@/components/home/native/NativeInicioView";
import { useNativeShellRuntime } from "@/components/native-shell/NativeShellRuntimeContext";
import { useRedesignRuntime } from "@/components/redesign-total/RedesignRuntimeContext";
import { RedesignInicioView } from "@/components/redesign-total/home/RedesignInicioView";

export const Route = createFileRoute("/inicio")({
  component: InicioRoute,
  head: () => inicioMetadata,
});

function InicioLoadingState() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 pt-4 pb-24">
        <div className="h-[58dvh] animate-pulse rounded-3xl bg-muted/40" />
        <div className="mt-4 h-24 animate-pulse rounded-2xl bg-muted/30" />
        <div className="mt-3 h-40 animate-pulse rounded-2xl bg-muted/30" />
      </main>
    </div>
  );
}

function InicioRoute() {
  const { user, loading } = useAuth();

  return (
    <AuthenticatedRouteGate
      loading={loading}
      authenticated={Boolean(user)}
      fallback={<InicioLoadingState />}
    >
      {user ? <InicioPage user={user} /> : null}
    </AuthenticatedRouteGate>
  );
}

type Profile = {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  bio: string | null;
  height_cm: number | null;
  status: "pending" | "approved" | "rejected" | "banned";
  city: string | null;
  state: string | null;
  age: number | null;
  sex: "masculino" | "feminino" | null;
  marital?: string | null;
  marital_status?: string | null;
  church?: string | null;
  years_baptized?: number | null;
  banned_reason?: string | null;
  banned_at?: string | null;
  rejection_reason?: string | null;
};

type AdminRequest = {
  id: string;
  kind: "photo" | "bio" | "behavior" | "other";
  message: string;
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
};
type AdminWarning = {
  id: string;
  message: string;
  severity: "amber" | "severe";
  acknowledged_at: string | null;
  created_at: string;
};
type BanAppeal = {
  id: string;
  appeal_text: string;
  status: "pending" | "answered" | "ignored";
  response_text: string | null;
  responded_at: string | null;
  created_at: string;
  kind: "ban" | "rejection";
};
type Devotional = {
  id: string;
  title: string;
  content: string;
  bible_reference: string | null;
  bible_text: string | null;
  published_at: string;
};
type Suggestion = {
  id: string;
  full_name: string;
  age: number | null;
  city: string | null;
  state: string | null;
  photo_url: string | null;
};

type TimePeriod = "dawn" | "morning" | "afternoon" | "night";

type TimeMood = {
  period: TimePeriod;
  greetingLabel: string;
  subline: string;
  devoLine: string;
  backTomorrow: string;
  heroBg: string;
  pill: string;
  title: string;
  sub: string;
  btn: string;
  btnGhost: string;
  Icon: typeof Sun;
  label: string;
};

function getTimeMood(now: Date, firstName: string): TimeMood {
  const h = now.getHours();
  const greet = (g: string) => `${g}, ${firstName}`;

  if (h < 5) {
    return {
      period: "dawn",
      greetingLabel: greet("Boa madrugada"),
      subline: "Mesmo no silêncio, boas histórias podem começar com calma.",
      devoLine: "Uma palavra para acalmar o coração nesta hora silenciosa.",
      backTomorrow: "Cuide do descanso. Amanhã você continua com calma.",
      heroBg:
        "bg-[linear-gradient(160deg,oklch(0.18_0.04_280)_0%,oklch(0.22_0.06_270)_55%,oklch(0.16_0.05_290)_100%)]",
      pill: "border-white/15 bg-white/10 text-white",
      title: "text-white",
      sub: "text-white/75",
      btn: "bg-white text-[oklch(0.22_0.06_280)] hover:bg-white/95",
      btnGhost: "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur",
      Icon: Moon,
      label: "Madrugada",
    };
  }
  if (h < 12) {
    return {
      period: "morning",
      greetingLabel: greet("Bom dia"),
      subline: "Que hoje seja leve, cheio de fé e bons encontros.",
      devoLine: "Comece o dia alinhando o coração.",
      backTomorrow: "Volte mais tarde para ver novas conversas e continuar sua jornada.",
      heroBg:
        "bg-[linear-gradient(160deg,oklch(0.98_0.04_85)_0%,oklch(0.93_0.09_55)_55%,oklch(0.86_0.12_30)_100%)]",
      pill: "border-white/40 bg-white/60 text-[oklch(0.40_0.14_30)]",
      title: "text-[oklch(0.25_0.10_30)]",
      sub: "text-[oklch(0.35_0.08_30)]",
      btn: "bg-[oklch(0.45_0.18_30)] hover:bg-[oklch(0.40_0.18_30)] text-white",
      btnGhost: "bg-white/55 hover:bg-white/75 text-[oklch(0.30_0.10_30)] border-white/60",
      Icon: Sunrise,
      label: "Manhã",
    };
  }
  if (h < 18) {
    return {
      period: "afternoon",
      greetingLabel: greet("Boa tarde"),
      subline: "Ainda dá tempo de viver uma conexão com propósito hoje.",
      devoLine: "Uma pausa para lembrar do que importa.",
      backTomorrow: "Amanhã pode trazer novas sugestões e um novo devocional.",
      heroBg:
        "bg-[linear-gradient(160deg,oklch(0.94_0.10_35)_0%,oklch(0.80_0.16_20)_55%,oklch(0.68_0.18_10)_100%)]",
      pill: "border-white/40 bg-white/60 text-[oklch(0.35_0.16_20)]",
      title: "text-white",
      sub: "text-white/85",
      btn: "bg-white text-[oklch(0.35_0.16_20)] hover:bg-white/95",
      btnGhost: "bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur",
      Icon: Sun,
      label: "Tarde",
    };
  }
  return {
    period: "night",
    greetingLabel: greet("Boa noite"),
    subline: "Finalize o dia com calma, fé e boas conversas.",
    devoLine: "Termine o dia com calma e fé.",
    backTomorrow: "Descanse em paz. Amanhã a jornada continua.",
    heroBg:
      "bg-[linear-gradient(160deg,oklch(0.22_0.06_280)_0%,oklch(0.28_0.10_300)_55%,oklch(0.30_0.10_330)_100%)]",
    pill: "border-white/15 bg-white/10 text-white",
    title: "text-white",
    sub: "text-white/80",
    btn: "bg-white text-[oklch(0.25_0.10_300)] hover:bg-white/95",
    btnGhost: "bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur",
    Icon: Sunset,
    label: "Noite",
  };
}

function formatClock(now: Date) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Maps a profile-strength action id to the search-params payload used to
// deep-link directly to the right /perfil tab in edit mode. Pretendentes
// links don't take search params.
function actionSearch(id: string): Record<string, unknown> | undefined {
  switch (id) {
    case "photo":
    case "extra_photos":
    case "name":
    case "bio":
    case "city":
    case "marital":
    case "church":
    case "height":
    case "seeking":
      return { tab: "profile", edit: 1 };
    case "looking_for_bio":
      return { tab: "prefs", edit: 1 };
    case "free_frame":
      return { tab: "customizacao" };
    default:
      return undefined;
  }
}

function InicioPage({ user }: { user: User }) {
  const { active: nativeShellActive } = useNativeShellRuntime();
  const { active: totalRedesignActive } = useRedesignRuntime();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [advanced, setAdvanced] = useState<StrengthAdvanced>(null);
  const [prefs, setPrefs] = useState<StrengthPreferences>(null);
  const [photosCount, setPhotosCount] = useState(0);
  const [devo, setDevo] = useState<Devotional | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [unreadConvos, setUnreadConvos] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [newProfiles7d, setNewProfiles7d] = useState(0);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [adminWarnings, setAdminWarnings] = useState<AdminWarning[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [appealText, setAppealText] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);
  const [activeCommitment, setActiveCommitment] = useState<any>(null);
  const [commitmentPartner, setCommitmentPartner] = useState<string | null>(null);
  const [commitmentDays, setCommitmentDays] = useState(0);
  const [frameClaimed, setFrameClaimed] = useState(false);
  const [ownsAnyFrame, setOwnsAnyFrame] = useState(false);
  const [hasSpent, setHasSpent] = useState(false);

  // Live clock — updates every 60s and on visibility change so the
  // greeting/theme transitions naturally from afternoon to night, etc.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setFrameClaimed(hasClaimedFreeFrameLocal(user.id));
  }, [user]);

  // Check if the user already owns at least one frame decoration. If so we
  // treat the "free frame" mission as completed and hide the redeem banner.
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const { count } = await supabase
        .from("user_decorations" as never)
        .select("decoration_id, avatar_decorations!inner(type)", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id)
        .eq("avatar_decorations.type", "frame");
      if (cancel) return;
      setOwnsAnyFrame((count ?? 0) > 0);
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  // Hide the free-frame offer for users who have ever spent coins
  // (i.e. already made any "purchase" inside the app).
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const { count } = await supabase
        .from("coin_transactions" as never)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("direction", "out");
      if (cancel) return;
      setHasSpent((count ?? 0) > 0);
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const commitment = await getActiveCommitmentByUser(user.id);
      setActiveCommitment(commitment);
      if (!commitment) return;
      const partnerId = commitment.user_a === user.id ? commitment.user_b : commitment.user_a;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", partnerId)
        .maybeSingle();
      setCommitmentPartner(data?.full_name ?? null);
      if (commitment.accepted_at) {
        const days = Math.max(
          1,
          Math.floor((Date.now() - new Date(commitment.accepted_at).getTime()) / 86400000),
        );
        setCommitmentDays(days);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [
        { data: p },
        { data: adv },
        { data: pr },
        { data: photos },
        { data: d },
        { data: reqs },
        { data: warns },
        { data: appeals },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, photo_url, bio, height_cm, status, city, state, age, sex, marital, church, years_baptized, banned_reason, banned_at, rejection_reason",
          )
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_advanced" as never)
          .select("seeking, faith_moment, spiritual_routine, worship_style, essential_quality")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_preferences" as never)
          .select("looking_for_bio, age_min, age_max")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_photos" as never)
          .select("id")
          .eq("user_id", user.id),
        supabase
          .from("daily_posts")
          .select("id, title, content, bible_reference, bible_text, published_at")
          .eq("kind", "devotional")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_admin_requests")
          .select("id, kind, message, status, created_at")
          .eq("user_id", user.id)
          .neq("status", "resolved")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_admin_warnings")
          .select("id, message, severity, acknowledged_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_ban_appeals")
          .select("id, appeal_text, status, response_text, responded_at, created_at, kind")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (cancel) return;
      setProfile(p as Profile | null);
      setAdvanced((adv as StrengthAdvanced) ?? null);
      setPrefs((pr as StrengthPreferences) ?? null);
      setPhotosCount(Array.isArray(photos) ? photos.length : 0);
      setDevo(d as Devotional | null);
      setAdminRequests((reqs ?? []) as AdminRequest[]);
      setAdminWarnings((warns ?? []) as AdminWarning[]);
      setBanAppeals((appeals ?? []) as BanAppeal[]);

      if ((p as Profile | null)?.status === "approved") {
        const targetSex = (p as Profile).sex === "masculino" ? "feminino" : "masculino";
        const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [{ data: sugg }, newProfilesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, age, city, state, photo_url")
            .eq("status", "approved")
            .eq("sex", targetSex)
            .neq("id", user.id)
            .not("photo_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved")
            .gte("created_at", sinceWeek),
        ]);
        if (cancel) return;
        setSuggestion((sugg as Suggestion | null) ?? null);
        setNewProfiles7d(newProfilesRes.count ?? 0);

        const [convRes, notifRes] = await Promise.all([
          supabase
            .from("conversations" as never)
            .select("id", { count: "exact", head: true })
            .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
          supabase
            .from("notifications" as never)
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("read_at", null),
        ]);
        if (cancel) return;
        setUnreadConvos(convRes.count ?? 0);
        setUnreadNotifs(notifRes.count ?? 0);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  const firstName = useMemo(
    () => (profile?.full_name ?? "").split(" ")[0] || "amig@",
    [profile?.full_name],
  );
  const mood = useMemo(() => getTimeMood(now, firstName), [now, firstName]);
  const clock = useMemo(() => formatClock(now), [now]);

  const strength = useMemo(
    () => calculateProfileStrength(profile ?? null, advanced, prefs, photosCount),
    [profile, advanced, prefs, photosCount],
  );
  const strengthLabel = useMemo(() => getProfileStrengthLabel(strength), [strength]);

  const nextActions: ChecklistAction[] = useMemo(
    () =>
      getProfileStrengthNextActions(profile ?? null, advanced, prefs, photosCount, {
        freeFrameAvailable: !frameClaimed && !ownsAnyFrame && !hasSpent,
        sawSuggestion: !!suggestion,
      }),
    [profile, advanced, prefs, photosCount, frameClaimed, ownsAnyFrame, hasSpent, suggestion],
  );

  if (profile === undefined) {
    return <InicioLoadingState />;
  }
  if (!profile) return <Navigate to="/onboarding" />;

  const isApproved = profile.status === "approved";
  const isBanned = profile.status === "banned";
  const isRejected = profile.status === "rejected";
  const isPending = profile.status === "pending";
  const activeWarnings = adminWarnings.filter((w) => !w.acknowledged_at);
  const banAppealsList = banAppeals.filter((a) => a.kind !== "rejection");
  const rejectionAppealsList = banAppeals.filter((a) => a.kind === "rejection");
  const latestAppeal = banAppealsList[0] ?? null;
  const latestRejectionAppeal = rejectionAppealsList[0] ?? null;
  const canAppeal = isBanned && (!latestAppeal || latestAppeal.status === "ignored");
  const canReverify =
    isRejected && (!latestRejectionAppeal || latestRejectionAppeal.status === "ignored");

  // Status line shown discretely in the hero
  let heroStatus = "Você já pode conhecer pessoas com propósito.";
  if (isBanned) heroStatus = "Sua conta está suspensa — fale com o suporte abaixo.";
  else if (isRejected) heroStatus = "Seu perfil precisa de ajustes para ser aprovado.";
  else if (isPending) heroStatus = "Seu perfil está em análise.";
  else if (strength < 60) heroStatus = "Seu perfil ainda pode ficar mais forte.";

  // Primary CTA logic
  let primaryCta: { to: any; params?: any; label: string } = {
    to: "/perfil",
    label: "Completar perfil",
  };
  if (isBanned) {
    primaryCta = { to: "/suporte", label: "Falar com o suporte" };
  } else if (isRejected) {
    primaryCta = { to: "/perfil", label: "Revisar meu perfil" };
  } else if (!isApproved) {
    primaryCta = { to: "/perfil", label: "Continuar perfil" };
  } else if (strength < 50) {
    primaryCta = { to: "/perfil", label: "Completar perfil" };
  } else if (devo) {
    primaryCta = { to: "/devocional", label: "Ler devocional" };
  } else {
    primaryCta = { to: "/pretendentes", label: "Explorar pretendentes" };
  }
  const secondaryCta: { to: any; label: string } = isApproved
    ? { to: "/conversas", label: "Conversas" }
    : { to: "/perfil", label: "Meu perfil" };

  async function acknowledgeWarning(id: string) {
    const { error } = await supabase
      .from("user_admin_warnings")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAdminWarnings((prev) =>
      prev.map((w) => (w.id === id ? { ...w, acknowledged_at: new Date().toISOString() } : w)),
    );
  }
  async function resolveRequest(id: string) {
    const { error } = await supabase
      .from("user_admin_requests")
      .update({ status: "resolved" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAdminRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success("Solicitação marcada como resolvida");
  }
  async function submitAppeal(kind: "ban" | "rejection" = "ban") {
    if (!user) return;
    const txt = appealText.trim();
    if (txt.length < 10) {
      toast.error("Escreva sua apelação com mais detalhes.");
      return;
    }
    setAppealBusy(true);
    if (kind === "rejection") {
      const { error: rpcError } = await supabase.rpc("request_reverification", { _message: txt });
      setAppealBusy(false);
      if (rpcError) {
        toast.error(rpcError.message);
        return;
      }
      setAppealText("");
      toast.success("Pedido de reanálise enviado. Seu perfil voltou para análise.");
      setTimeout(() => window.location.reload(), 600);
      return;
    }
    const { data, error } = await supabase
      .from("user_ban_appeals")
      .insert({ user_id: user.id, appeal_text: txt, kind })
      .select("id, appeal_text, status, response_text, responded_at, created_at, kind")
      .single();
    setAppealBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBanAppeals((prev) => [data as BanAppeal, ...prev]);
    setAppealText("");
    toast.success("Apelação enviada. A equipe vai analisar.");
  }

  if (nativeShellActive) {
    const toNativeAppeal = (appeal: BanAppeal | null) =>
      appeal
        ? {
            appealText: appeal.appeal_text,
            status: appeal.status,
            responseText: appeal.response_text,
            createdAt: appeal.created_at,
          }
        : null;
    const nativeModel: NativeInicioViewModel = {
      status: profile.status,
      firstName,
      greeting: mood.greetingLabel,
      greetingDetail: mood.subline,
      bannedReason: profile.banned_reason ?? null,
      rejectionReason: profile.rejection_reason ?? null,
      warnings: activeWarnings.map((warning) => ({
        id: warning.id,
        message: warning.message,
        severity: warning.severity,
      })),
      requests: adminRequests.map((request) => ({
        id: request.id,
        kind: request.kind,
        message: request.message,
        createdAt: request.created_at,
      })),
      latestAppeal: toNativeAppeal(latestAppeal),
      latestRejectionAppeal: toNativeAppeal(latestRejectionAppeal),
      canAppeal,
      canReverify,
      appealText,
      appealBusy,
      devotional: devo
        ? {
            title: devo.title,
            bibleReference: devo.bible_reference,
            bibleText: devo.bible_text,
          }
        : null,
      strength,
      strengthLabel: strengthLabel.label,
      nextProfileAction: nextActions[0]
        ? {
            title: nextActions[0].title,
            description: nextActions[0].description,
          }
        : null,
      unreadConversations: unreadConvos,
      newProfiles: newProfiles7d,
      suggestion: suggestion
        ? {
            id: suggestion.id,
            firstName: suggestion.full_name.split(" ")[0],
            age: suggestion.age,
            location: [suggestion.city, suggestion.state].filter(Boolean).join(" · ") || null,
          }
        : null,
      commitment: activeCommitment
        ? {
            matchId: activeCommitment.match_id,
            partnerName: commitmentPartner,
            days: commitmentDays,
          }
        : null,
      onAppealTextChange: setAppealText,
      onAcknowledgeWarning: acknowledgeWarning,
      onResolveRequest: resolveRequest,
      onSubmitAppeal: submitAppeal,
    };

    return totalRedesignActive ? (
      <RedesignInicioView model={nativeModel} />
    ) : (
      <NativeInicioView model={nativeModel} />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />

      <main className="mx-auto w-full max-w-2xl pb-28 md:max-w-4xl md:px-6 md:pt-8">
        {/* HERO — entrada emocional da home */}
        <section
          className={`relative overflow-hidden ${mood.heroBg} px-5 pb-8 pt-[max(env(safe-area-inset-top),1rem)] min-h-[58dvh] flex flex-col rounded-b-[2rem] md:rounded-3xl md:min-h-[42dvh] md:px-8 md:pt-10 animate-in fade-in duration-500`}
        >
          {/* Mini header dentro do hero (mobile) */}
          <div className="relative z-10 flex items-center justify-between md:hidden">
            <Link
              to="/perfil"
              className="app-pressable flex items-center gap-2"
              aria-label="Meu perfil"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/30 text-sm font-bold text-white backdrop-blur">
                {profile.photo_url ? (
                  <PhotoImg src={profile.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  firstName.charAt(0).toUpperCase()
                )}
              </span>
            </Link>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur ${mood.pill}`}
            >
              <mood.Icon className="h-3 w-3" /> {mood.label}
              <span className="ml-1 inline-flex items-center gap-0.5 opacity-80">
                <Clock className="h-2.5 w-2.5" />
                {clock}
              </span>
            </div>
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="app-pressable relative flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifs > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[oklch(0.62_0.22_15)] px-1 text-[9px] font-bold text-white">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </Link>
          </div>

          {/* Decorações por horário */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          {(mood.period === "night" || mood.period === "dawn") && (
            <>
              {[
                { top: "14%", left: "60%", size: 7, delay: "0s" },
                { top: "22%", left: "78%", size: 5, delay: "0.6s" },
                { top: "9%", left: "30%", size: 6, delay: "1.2s" },
                { top: "40%", left: "88%", size: 5, delay: "1.8s" },
                { top: "30%", left: "12%", size: 4, delay: "2.4s" },
              ].map((s, i) => (
                <Stars
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute animate-pulse text-white/80"
                  style={{
                    top: s.top,
                    left: s.left,
                    width: s.size * 2,
                    height: s.size * 2,
                    animationDelay: s.delay,
                  }}
                />
              ))}
            </>
          )}
          {mood.period === "morning" && (
            <div
              aria-hidden
              className="pointer-events-none absolute -top-10 right-6 h-40 w-40 rounded-full bg-[oklch(0.95_0.15_75)]/70 blur-2xl"
            />
          )}

          <div className="relative z-10 mt-auto pt-10 md:pt-0">
            <h1
              className={`text-[28px] font-extrabold leading-[1.1] tracking-tight md:text-4xl ${mood.title}`}
            >
              {mood.greetingLabel}
            </h1>
            <p className={`mt-2 max-w-md text-[15px] leading-relaxed md:text-base ${mood.sub}`}>
              {mood.subline}
            </p>
            <p
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur ${mood.pill}`}
            >
              <Sparkles className="h-3 w-3" />
              {heroStatus}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild size="lg" className={`app-pressable rounded-full px-5 ${mood.btn}`}>
                <Link to={primaryCta.to} params={primaryCta.params}>
                  {primaryCta.label}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className={`app-pressable rounded-full px-5 ${mood.btnGhost}`}
              >
                <Link to={secondaryCta.to}>{secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="space-y-5 px-4 pt-5 md:px-0">
          {/* ACTIVE WARNINGS — prioridade máxima */}
          {activeWarnings.length > 0 && (
            <section className="space-y-2.5">
              {activeWarnings.map((w) => (
                <div
                  key={w.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                    w.severity === "severe"
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-amber-500/40 bg-amber-500/10"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">
                      {w.severity === "severe" ? "Aviso sério da moderação" : "Aviso da moderação"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{w.message}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeWarning(w.id)}
                    className="shrink-0"
                  >
                    Entendi
                  </Button>
                </div>
              ))}
            </section>
          )}

          {/* BAN PANEL */}
          {isBanned && (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/5 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-600">
                  <Ban className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-red-700 dark:text-red-300">
                    Conta suspensa
                  </h2>
                  {profile.banned_reason && (
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      <span className="font-semibold">Motivo:</span> {profile.banned_reason}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Se acredita que houve um engano, envie uma apelação acolhedora.
                  </p>
                </div>
              </div>
              {latestAppeal && (
                <div className="mt-4 rounded-2xl border border-border/60 bg-background/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Sua apelação · {new Date(latestAppeal.created_at).toLocaleDateString("pt-BR")} ·{" "}
                    {latestAppeal.status === "pending" && "aguardando"}
                    {latestAppeal.status === "answered" && "respondida"}
                    {latestAppeal.status === "ignored" && "encerrada"}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm">{latestAppeal.appeal_text}</p>
                  {latestAppeal.status === "answered" && latestAppeal.response_text && (
                    <div className="mt-2 rounded-xl bg-[var(--petal)]/40 p-2.5 text-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--rose)]">
                        Resposta da equipe
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{latestAppeal.response_text}</p>
                    </div>
                  )}
                </div>
              )}
              {canAppeal && (
                <div className="mt-4">
                  <label className="text-sm font-semibold">Recorrer da decisão</label>
                  <Textarea
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    maxLength={2000}
                    placeholder="Conte com calma o que aconteceu..."
                    className="mt-2 min-h-[100px]"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button onClick={() => submitAppeal("ban")} disabled={appealBusy} size="sm">
                      <Send className="mr-2 h-3.5 w-3.5" /> Enviar apelação
                    </Button>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to="/suporte">
                    <MessageSquareWarning className="mr-2 h-3.5 w-3.5" /> Falar com o suporte
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* REJECTED PANEL */}
          {isRejected && (
            <section className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-amber-700 dark:text-amber-300">
                    Conta negada
                  </h2>
                  {profile.rejection_reason && (
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-500/10 p-2 text-sm">
                      <span className="font-semibold">Motivo:</span> {profile.rejection_reason}
                    </p>
                  )}
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link to="/perfil">Editar meu perfil</Link>
                    </Button>
                  </div>
                </div>
              </div>
              {latestRejectionAppeal && (
                <div className="mt-4 rounded-2xl border border-border/60 bg-background/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Solicitação ·{" "}
                    {new Date(latestRejectionAppeal.created_at).toLocaleDateString("pt-BR")} ·{" "}
                    {latestRejectionAppeal.status === "pending" && "aguardando"}
                    {latestRejectionAppeal.status === "answered" && "respondida"}
                    {latestRejectionAppeal.status === "ignored" && "encerrada"}
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm">
                    {latestRejectionAppeal.appeal_text}
                  </p>
                  {latestRejectionAppeal.status === "answered" &&
                    latestRejectionAppeal.response_text && (
                      <div className="mt-2 rounded-xl bg-[var(--petal)]/40 p-2.5 text-sm">
                        <p className="mt-1 whitespace-pre-wrap">
                          {latestRejectionAppeal.response_text}
                        </p>
                      </div>
                    )}
                </div>
              )}
              {canReverify && (
                <div className="mt-4">
                  <label className="text-sm font-semibold">Pedir nova análise</label>
                  <Textarea
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    maxLength={2000}
                    placeholder="Conte o que mudou no seu perfil..."
                    className="mt-2 min-h-[100px]"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      onClick={() => submitAppeal("rejection")}
                      disabled={appealBusy}
                      size="sm"
                    >
                      <Send className="mr-2 h-3.5 w-3.5" /> Verificar Novamente
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ADMIN REQUESTS */}
          {adminRequests.length > 0 && (
            <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--petal)] text-[var(--rose)]">
                  <ClipboardList className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-sm font-semibold">Solicitações da equipe</h2>
              </div>
              <ul className="mt-3 space-y-2">
                {adminRequests.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-2xl border border-border/50 bg-background/40 p-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--rose)]">
                      {r.kind === "photo" && "Foto"}
                      {r.kind === "bio" && "Biografia"}
                      {r.kind === "behavior" && "Comportamento"}
                      {r.kind === "other" && "Outro"}
                      {" · "}
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{r.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(r.kind === "photo" || r.kind === "bio") && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-full text-xs"
                        >
                          <Link to="/perfil">Ir para o perfil</Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => resolveRequest(r.id)}
                        className="h-7 rounded-full text-xs"
                      >
                        Marcar como resolvida
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* PROPÓSITO FIRMADO */}
          {activeCommitment && (
            <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 shadow-soft">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl"
              />
              <div className="relative flex items-center gap-3">
                <img src={commitmentRing} alt="" className="h-12 w-12 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                    Propósito Firmado
                  </p>
                  <h2 className="mt-0.5 truncate text-sm font-bold leading-tight md:text-base">
                    {commitmentPartner
                      ? `Em propósito com ${commitmentPartner}`
                      : "Você está em propósito"}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Vocês estão caminhando há {commitmentDays}{" "}
                    {commitmentDays === 1 ? "dia" : "dias"}.
                  </p>
                </div>
                <Button asChild size="sm" className="shrink-0 rounded-full">
                  <Link to="/proposito/$matchId" params={{ matchId: activeCommitment.match_id }}>
                    Página
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* MISSÃO DE HOJE */}
          {isApproved && <MissionsTodayCard />}

          {!isBanned && !isRejected && nextActions.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-baseline justify-between px-1">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Missão de hoje
                </h2>
                <span className="text-[10px] text-muted-foreground/80">
                  Um passo simples para sua jornada
                </span>
              </div>
              <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
                {nextActions.map((a) => {
                  const Icon = a.icon;
                  const search = actionSearch(a.id);
                  return (
                    <Link
                      key={a.id}
                      to={a.to}
                      search={search as never}
                      className="app-card-interactive flex min-w-[240px] shrink-0 items-start gap-3 rounded-2xl border border-border/60 bg-card p-3.5 shadow-soft md:min-w-0"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--petal)] text-[var(--rose)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight">{a.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {a.description}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* RADAR DE CONEXÃO */}
          {isApproved && (
            <section>
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <Radar className="h-3.5 w-3.5 text-[var(--rose)]" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Radar de conexão
                </h2>
              </div>
              {suggestion ? (
                <Link
                  to="/pretendentes/$id"
                  params={{ id: suggestion.id }}
                  className="app-card-interactive group relative block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft"
                >
                  <div className="relative aspect-[16/12] w-full overflow-hidden bg-muted md:aspect-[16/9]">
                    {suggestion.photo_url ? (
                      <PhotoImg
                        src={suggestion.photo_url}
                        alt={suggestion.full_name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-love text-5xl text-white">
                        {suggestion.full_name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                        <Sparkles className="h-3 w-3" /> Uma possibilidade para hoje
                      </span>
                      <p className="text-lg font-bold leading-tight">
                        {suggestion.full_name.split(" ")[0]}
                        {suggestion.age ? `, ${suggestion.age}` : ""}
                      </p>
                      {(suggestion.city || suggestion.state) && (
                        <p className="text-xs opacity-90">
                          {[suggestion.city, suggestion.state].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 max-w-sm text-[13px] opacity-90">
                        Uma possibilidade para conhecer com calma.
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/pretendentes"
                  className="app-card-interactive flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--petal)] text-[var(--rose)]">
                    <Compass className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Seu radar está buscando novas conexões</p>
                    <p className="text-xs text-muted-foreground">
                      Explore pretendentes para encontrar pessoas com propósito.
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
            </section>
          )}

          {/* PALAVRA PARA HOJE */}
          {devo ? (
            <section>
              <Link
                to="/devocional"
                className="app-card-interactive block overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[oklch(0.98_0.02_60)] via-[oklch(0.97_0.04_30)] to-[oklch(0.95_0.06_15)] p-5 shadow-soft"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-[var(--rose)] backdrop-blur">
                    <BookHeart className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[oklch(0.40_0.12_25)]">
                    Palavra para hoje
                  </p>
                </div>
                <p className="mt-2 text-[12px] italic text-[oklch(0.40_0.10_25)]/80">
                  {mood.devoLine}
                </p>
                {devo.bible_reference && (
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--rose)]">
                    {devo.bible_reference}
                  </p>
                )}
                <h3 className="mt-1.5 text-lg font-bold leading-snug">{devo.title}</h3>
                {devo.bible_text && (
                  <p className="mt-2 line-clamp-3 text-sm italic leading-relaxed text-foreground/75">
                    “{devo.bible_text}”
                  </p>
                )}
                <p className="mt-3 inline-flex items-center text-sm font-semibold text-[oklch(0.45_0.18_25)]">
                  Ler devocional <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </p>
              </Link>
            </section>
          ) : (
            isApproved && (
              <section className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground shadow-soft">
                <div className="flex items-center gap-2">
                  <BookHeart className="h-4 w-4 text-[var(--rose)]" />
                  <p className="font-semibold text-foreground">Palavra para hoje</p>
                </div>
                <p className="mt-1 text-xs">O devocional estará disponível em breve.</p>
              </section>
            )
          )}

          {/* SEU PERFIL NO APP */}
          {!isBanned && !isRejected && (
            <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Seu perfil no app
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">
                    Seu perfil está {strength}% forte
                    <span className="ml-1.5 text-muted-foreground">· {strengthLabel.label}</span>
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 rounded-full text-xs"
                >
                  <Link to="/perfil">Melhorar</Link>
                </Button>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--coral)] to-[var(--rose)] transition-all duration-700"
                  style={{ width: `${Math.max(4, strength)}%` }}
                />
              </div>
              {nextActions[0] && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {nextActions[0].description}{" "}
                  <span className="font-medium text-foreground">{nextActions[0].title}.</span>
                </p>
              )}
            </section>
          )}

          {/* AGORA NO VAIDARNAMORO */}
          {isApproved && (
            <section>
              <h2 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Agora no VaiDarNamoro
              </h2>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <ActivityChip
                  to="/pretendentes"
                  icon={<Heart className="h-4 w-4" />}
                  label="Pretendentes"
                  hint={newProfiles7d > 0 ? `${newProfiles7d} novos (7d)` : "Explorar"}
                />
                <ActivityChip
                  to="/conversas"
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="Conversas"
                  hint={unreadConvos > 0 ? `${unreadConvos} ativas` : "Abrir"}
                />
                <ActivityChip
                  to="/conversas/comunidade"
                  icon={<Users className="h-4 w-4" />}
                  label="Comunidade"
                  hint="Ativa agora"
                />
                <ActivityChip
                  to="/notificacoes"
                  icon={<Bell className="h-4 w-4" />}
                  label="Notificações"
                  hint={unreadNotifs > 0 ? `${unreadNotifs} novas` : "Ver"}
                  highlight={unreadNotifs > 0}
                />
                <ActivityChip
                  to="/dashboard"
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Métricas"
                  hint="Visitas e tendências"
                />
                <ActivityChip
                  to="/interesses"
                  icon={<Sparkles className="h-4 w-4" />}
                  label="Interesses"
                  hint="Quem te quer"
                />
                <ActivityChip
                  to="/matches"
                  icon={<Heart className="h-4 w-4" />}
                  label="Matches"
                  hint="Conexões mútuas"
                />
                <ActivityChip
                  to="/recados"
                  icon={<VenetianMask className="h-4 w-4" />}
                  label="Recados"
                  hint="Mensagens anônimas"
                />
                <ActivityChip
                  to="/noticias"
                  icon={<Newspaper className="h-4 w-4" />}
                  label="Notícias"
                  hint="Da comunidade"
                />
              </div>
            </section>
          )}

          {/* MOLDURA GRÁTIS */}
          {isApproved && !frameClaimed && !ownsAnyFrame && !hasSpent && (
            <section>
              <Link
                to="/perfil"
                search={{ tab: "customizacao" } as never}
                className="app-card-interactive flex items-center gap-3 rounded-2xl border border-[var(--rose)]/30 bg-gradient-to-br from-[var(--petal)]/60 to-white p-4 shadow-soft"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--rose)] shadow-sm">
                  <Frame className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Escolha sua primeira moldura</p>
                  <p className="text-xs text-muted-foreground">
                    Personalize seu perfil com uma moldura comum ou rara grátis.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--rose)] px-3 py-1 text-[11px] font-semibold text-white">
                  Resgatar
                </span>
              </Link>
            </section>
          )}

          {/* VOLTE AMANHÃ */}
          {!isBanned && !isRejected && (
            <p className="pt-2 text-center text-xs text-muted-foreground">{mood.backTomorrow}</p>
          )}
        </div>
      </main>
    </div>
  );
}

function ActivityChip({
  to,
  icon,
  label,
  hint,
  highlight,
}: {
  to: any;
  icon: React.ReactNode;
  label: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`app-pressable flex items-center gap-2.5 rounded-2xl border bg-card p-3 shadow-sm ${
        highlight ? "border-[var(--rose)]/50" : "border-border/60"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          highlight
            ? "bg-[var(--rose)]/15 text-[var(--rose)]"
            : "bg-[var(--petal)] text-[var(--rose)]"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold leading-tight">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </Link>
  );
}
