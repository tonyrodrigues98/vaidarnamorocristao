import { PhotoImg } from "@/components/PhotoImg";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { StickersChatBanner } from "@/components/StickersChatBanner";
import { AnonymousMessagesBanner } from "@/components/AnonymousMessagesBanner";
import { getHomeChecklistSteps, type HomeChecklistStep } from "@/lib/homeChecklist";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  BookHeart,
  Users,
  Heart,
  MessageCircle,
  Camera,
  Globe,
  Compass,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  Hand,
  Ban,
  ClipboardList,
  AlertTriangle,
  MessageSquareWarning,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/inicio")({
  component: InicioPage,
  head: () => ({
    meta: [
      { title: "Início — VaiDarNamoro" },
      { name: "description", content: "Seu espaço dentro do VaiDarNamoro. Bem-vindo(a) de volta." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

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
type ActivityState = {
  explored: boolean;
  interestSent: boolean;
  community: boolean;
  devotional: boolean;
};

const TIPS = [
  {
    icon: Camera,
    title: "Capriche nas fotos",
    text: "Use luz natural, mostre seu sorriso e evite filtros pesados. A primeira impressão importa.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança em primeiro lugar",
    text: "Nunca compartilhe dados sensíveis no início. Conheça a pessoa devagar e com calma.",
  },
  {
    icon: BookHeart,
    title: "Conexões com propósito",
    text: "Comece conversas com perguntas reais sobre fé, sonhos e o dia a dia — fuja do 'oi'.",
  },
  {
    icon: Sparkles,
    title: "Mostre quem você é",
    text: "Seu testemunho, versículo favorito e linguagem do amor falam mais que mil fotos.",
  },
  {
    icon: Heart,
    title: "Demonstre interesse",
    text: "Não tenha medo de dar o primeiro passo. Um interesse pode mudar uma história.",
  },
];

function greeting(name: string | null) {
  const h = new Date().getHours();
  const first = (name ?? "").split(" ")[0] || "por aqui";
  if (h < 5) return `Boa madrugada, ${first}`;
  if (h < 12) return `Bom dia, ${first}`;
  if (h < 18) return `Boa tarde, ${first}`;
  return `Boa noite, ${first}`;
}
function subGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Que seu dia comece com leveza e propósito.";
  if (h < 18) return "Que bom ter você por aqui de novo.";
  return "Esperamos que seu dia tenha sido abençoado.";
}

function getHeroTheme() {
  const h = new Date().getHours();
  const isNight = h >= 18 || h < 5;
  return {
    isNight,
    sectionClass: isNight ? "bg-gradient-night" : "bg-gradient-warm",
    blobA: isNight ? "bg-[oklch(0.82_0.08_285)]" : "bg-[var(--petal)]",
    blobB: isNight ? "bg-[oklch(0.92_0.06_40)]/60" : "bg-[var(--coral)]/20",
    titleStyle: isNight ? { color: "oklch(0.18 0.04 270)" } : undefined,
  };
}

function InicioPage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [advCount, setAdvCount] = useState<{ done: number; total: number }>({ done: 0, total: 8 });
  const [devo, setDevo] = useState<Devotional | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activity, setActivity] = useState<ActivityState>({
    explored: false,
    interestSent: false,
    community: false,
    devotional: false,
  });
  const [completedSteps, setCompletedSteps] = useState<Set<HomeChecklistStep>>(new Set());
  const [community, setCommunity] = useState({ newProfiles: 0, online: 0, newComments: 0 });
  const [tipIndex, setTipIndex] = useState(0);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [adminWarnings, setAdminWarnings] = useState<AdminWarning[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [appealText, setAppealText] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setCompletedSteps(new Set());
      return;
    }
    setCompletedSteps(getHomeChecklistSteps(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [
        { data: p },
        { data: adv },
        { data: d },
        viewedRes,
        interestRes,
        communityRes,
        prayedRes,
        reactionRes,
        { data: reqs },
        { data: warns },
        { data: appeals },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, photo_url, bio, height_cm, status, city, state, age, sex, banned_reason, banned_at, rejection_reason")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_advanced")
          .select(
            "life_verse, testimony, seeking, essential_quality, hobbies, love_language, wants_marriage, wants_children",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("daily_posts")
          .select("id, title, content, bible_reference, bible_text, published_at")
          .eq("kind", "devotional")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profile_views").select("id").eq("viewer_id", user.id).limit(1),
        supabase.from("interests").select("id").eq("sender_id", user.id).limit(1),
        supabase.from("global_messages").select("id").eq("sender_id", user.id).limit(1),
        supabase.from("devotional_prayed").select("id").eq("user_id", user.id).limit(1),
        supabase.from("devotional_reactions").select("post_id").eq("user_id", user.id).limit(1),
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
      setDevo(d as Devotional | null);
      setAdminRequests((reqs ?? []) as AdminRequest[]);
      setAdminWarnings((warns ?? []) as AdminWarning[]);
      setBanAppeals((appeals ?? []) as BanAppeal[]);
      setActivity({
        explored: !!viewedRes.data?.length || !!interestRes.data?.length,
        interestSent: !!interestRes.data?.length,
        community: !!communityRes.data?.length,
        devotional: !!prayedRes.data?.length || !!reactionRes.data?.length,
      });
      const fields = adv
        ? [
            adv.life_verse,
            adv.testimony,
            adv.seeking,
            adv.essential_quality,
            adv.hobbies,
            adv.love_language,
            adv.wants_marriage,
            adv.wants_children,
          ]
        : [];
      setAdvCount({ done: fields.filter(Boolean).length, total: 8 });

      if ((p as Profile | null)?.status === "approved") {
        const targetSex = (p as Profile).sex === "masculino" ? "feminino" : "masculino";
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [{ data: sugg }, newProfilesRes, newCommentsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, age, city, state, photo_url")
            .eq("status", "approved")
            .eq("sex", targetSex)
            .neq("id", user.id)
            .not("photo_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved")
            .gte("created_at", sinceWeek),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .gte("created_at", since24h),
        ]);
        if (cancel) return;
        setSuggestions((sugg as Suggestion[] | null) ?? []);
        setCommunity({
          newProfiles: newProfilesRes.count ?? 0,
          online: 0,
          newComments: newCommentsRes.count ?? 0,
        });
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user]);

  const checklist = useMemo(() => {
    const p = profile;
    return [
      {
        key: "photo",
        label: "Adicione uma boa foto",
        done: !!p?.photo_url,
        to: "/perfil" as const,
      },
      {
        key: "bio",
        label: "Capriche na sua bio",
        done: !!(p?.bio && p.bio.trim().length >= 30),
        to: "/perfil" as const,
      },
      {
        key: "advanced",
        label: "Conte sobre você (testemunho, versículo…)",
        done: advCount.done >= 5,
        to: "/perfil" as const,
      },
      {
        key: "interest",
        label: "Demonstre interesse",
        done: activity.interestSent,
        to: "/pretendentes" as const,
      },
      {
        key: "explore",
        label: "Explore pretendentes",
        done: activity.explored || completedSteps.has("explore"),
        to: "/pretendentes" as const,
        manual: true,
      },
      {
        key: "community",
        label: "Participe da comunidade",
        done: activity.community,
        to: "/comunidade" as const,
        manual: true,
      },
      {
        key: "devotional",
        label: "Leia o devocional do dia",
        done: activity.devotional || completedSteps.has("devotional"),
        to: "/devocional" as const,
        manual: true,
      },
    ];
  }, [profile, advCount, activity, completedSteps]);

  const completion = useMemo(() => {
    const p = profile;
    if (!p) return 0;
    const baseChecks = [!!p.photo_url, !!(p.bio && p.bio.trim().length >= 30), !!p.height_cm];
    const total = baseChecks.length + advCount.total;
    const done = baseChecks.filter(Boolean).length + advCount.done;
    return Math.round((done / total) * 100);
  }, [profile, advCount]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (profile === undefined) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="h-40 animate-pulse rounded-3xl bg-muted/40" />
        </div>
      </div>
    );
  }
  if (!profile) return <Navigate to="/onboarding/etapa-1" />;

  const firstName = (profile.full_name ?? "").split(" ")[0] || "amig@";
  const isApproved = profile.status === "approved";
  const isBanned = profile.status === "banned";
  const isRejected = profile.status === "rejected";
  const activeWarnings = adminWarnings.filter((w) => !w.acknowledged_at);
  const banAppealsList = banAppeals.filter((a) => a.kind !== "rejection");
  const rejectionAppealsList = banAppeals.filter((a) => a.kind === "rejection");
  const latestAppeal = banAppealsList[0] ?? null;
  const latestRejectionAppeal = rejectionAppealsList[0] ?? null;
  const canAppeal = isBanned && (!latestAppeal || latestAppeal.status === "ignored");
  const canReverify =
    isRejected && (!latestRejectionAppeal || latestRejectionAppeal.status === "ignored");

  async function acknowledgeWarning(id: string) {
    const { error } = await supabase
      .from("user_admin_warnings")
      .update({ acknowledged_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    setAdminWarnings((prev) =>
      prev.map((w) => (w.id === id ? { ...w, acknowledged_at: new Date().toISOString() } : w)),
    );
  }
  async function resolveRequest(id: string) {
    const { error } = await supabase
      .from("user_admin_requests")
      .update({ status: "resolved" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    setAdminRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success("Solicitação marcada como resolvida");
  }
  async function submitAppeal(kind: "ban" | "rejection" = "ban") {
    if (!user) return;
    const txt = appealText.trim();
    if (txt.length < 10) { toast.error("Escreva sua apelação com mais detalhes."); return; }
    setAppealBusy(true);
    if (kind === "rejection") {
      const { error: rpcError } = await supabase.rpc("request_reverification", { _message: txt });
      setAppealBusy(false);
      if (rpcError) { toast.error(rpcError.message); return; }
      setAppealText("");
      toast.success("Pedido de reanálise enviado. Seu perfil voltou para análise.");
      // O perfil agora é 'pending' — recarrega para sair do modo rejeitado
      setTimeout(() => window.location.reload(), 600);
      return;
    }
    const { data, error } = await supabase
      .from("user_ban_appeals")
      .insert({ user_id: user.id, appeal_text: txt, kind })
      .select("id, appeal_text, status, response_text, responded_at, created_at, kind")
      .single();
    setAppealBusy(false);
    if (error) { toast.error(error.message); return; }
    setBanAppeals((prev) => [data as BanAppeal, ...prev]);
    setAppealText("");
    toast.success("Apelação enviada. A equipe vai analisar.");
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {/* AVISOS SÉRIOS DA EQUIPE */}
        {activeWarnings.length > 0 && (
          <section className="mb-6 space-y-3">
            {activeWarnings.map((w) => (
              <div
                key={w.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 shadow-soft ${
                  w.severity === "severe"
                    ? "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-200"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {w.severity === "severe" ? "Aviso sério da moderação" : "Aviso da moderação"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{w.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeWarning(w.id)}
                  className="shrink-0 bg-background/50"
                >
                  Entendi
                </Button>
              </div>
            ))}
          </section>
        )}

        {/* HERO */}
        {(() => { const hero = getHeroTheme(); return (
        <section className={`relative overflow-hidden rounded-[2rem] border border-border/60 ${hero.sectionClass} px-6 py-10 shadow-soft sm:px-10 sm:py-14`}>
          {!hero.isNight && (
            <>
              <div
                aria-hidden
                className={`pointer-events-none absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full ${hero.blobA} opacity-70 blur-3xl`}
              />
              <div
                aria-hidden
                className={`pointer-events-none absolute -bottom-24 -right-16 h-[380px] w-[380px] rounded-full ${hero.blobB} blur-3xl`}
              />
            </>
          )}
          {hero.isNight && (
            <>
              {/* Lua crescente */}
              <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="pointer-events-none absolute top-6 right-6 h-24 w-24 sm:h-32 sm:w-32"
                style={{ filter: "drop-shadow(0 4px 18px oklch(0.94 0.08 85 / 0.45))" }}
              >
                <defs>
                  <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="oklch(0.96 0.09 85)" />
                    <stop offset="100%" stopColor="oklch(0.88 0.10 75)" />
                  </radialGradient>
                </defs>
                <path
                  d="M44 8a24 24 0 1 0 12 42A20 20 0 0 1 44 8z"
                  fill="url(#moonGlow)"
                />
              </svg>
              {/* Estrelinhas cintilantes */}
              {[
                { top: "18%", left: "55%", size: 8, delay: "0s" },
                { top: "8%", left: "42%", size: 6, delay: "0.6s" },
                { top: "62%", left: "82%", size: 7, delay: "1.2s" },
                { top: "78%", left: "70%", size: 5, delay: "1.8s" },
                { top: "48%", left: "92%", size: 6, delay: "2.4s" },
                { top: "34%", left: "78%", size: 5, delay: "0.3s" },
                { top: "86%", left: "58%", size: 7, delay: "1.5s" },
              ].map((s, i) => (
                <svg
                  key={i}
                  aria-hidden
                  viewBox="0 0 10 10"
                  className="pointer-events-none absolute animate-pulse"
                  style={{
                    top: s.top,
                    left: s.left,
                    width: s.size,
                    height: s.size,
                    animationDelay: s.delay,
                    animationDuration: "2.5s",
                  }}
                >
                  <path
                    d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z"
                    fill="oklch(0.96 0.08 85)"
                    opacity="0.85"
                  />
                </svg>
              ))}
            </>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute top-10 right-1/3 h-2 w-2 animate-pulse rounded-full bg-[var(--rose)]/60"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-16 left-1/4 h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--coral)]/70"
            style={{ animationDelay: "1.2s" }}
          />

          <div className="relative">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-[var(--rose)]/15 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rose)] backdrop-blur dark:bg-white/10">
              <Sparkles className="h-3 w-3" /> Seu espaço
            </div>
            <h1
              className="animate-fade-up mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl"
              style={{ animationDelay: "60ms", ...hero.titleStyle }}
            >
              {greeting(profile.full_name)}{" "}
              <Hand className="ml-1 inline-block h-7 w-7 -translate-y-0.5 text-[var(--rose)] sm:h-9 sm:w-9" aria-hidden />
            </h1>
            <p
              className="animate-fade-up mt-3 max-w-xl text-base text-muted-foreground sm:text-lg"
              style={{ animationDelay: "140ms" }}
            >
              {subGreeting()}{" "}
              {isApproved
                ? "Sua jornada continua — explore, converse e deixe Deus surpreender você."
                : isBanned
                  ? "Sua conta está temporariamente suspensa. Você ainda pode falar com a gente e enviar uma apelação abaixo."
                  : isRejected
                    ? "Sua conta foi negada. Revise suas informações e clique em Verificar Novamente para uma reanálise."
                    : "Logo seu perfil será revisado e você poderá começar a explorar."}
            </p>

            <div
              className="animate-fade-up mt-7 flex flex-wrap gap-3"
              style={{ animationDelay: "220ms" }}
            >
              {isBanned ? (
                <Button asChild size="lg" variant="outline" className="rounded-full px-6 backdrop-blur bg-white/40 dark:bg-white/5">
                  <Link to="/suporte">
                    <MessageSquareWarning className="mr-2 h-4 w-4" /> Falar com o suporte
                  </Link>
                </Button>
              ) : isApproved ? (
                <>
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link to="/pretendentes">
                      <Compass className="mr-2 h-4 w-4" /> Ver pretendentes
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6 backdrop-blur bg-white/40 dark:bg-white/5"
                  >
                    <Link to="/devocional">
                      <BookHeart className="mr-2 h-4 w-4" /> Devocional do dia
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="lg" className="rounded-full px-6">
                  <Link to="/perfil">Continuar perfil</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
        ); })()}

        {/* BANNER STICKERS CHAT GLOBAL */}
        <div className="mt-8 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <StickersChatBanner />
        </div>

        {/* BANNER RECADOS ANÔNIMOS */}
        <div className="mt-8 animate-fade-up" style={{ animationDelay: "350ms" }}>
          <AnonymousMessagesBanner />
        </div>

        {/* PAINEL DE BANIMENTO */}
        {isBanned && (
          <section className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/5 p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-600">
                <Ban className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Conta suspensa
                </h2>
                {profile.banned_reason && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-red-900/80 dark:text-red-200/80">
                    <span className="font-semibold">Motivo:</span> {profile.banned_reason}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Sentimos muito por isso. Se você acredita que houve um engano,
                  envie uma apelação acolhedora e a equipe vai analisar.
                </p>
              </div>
            </div>

            {latestAppeal && (
              <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sua apelação · {new Date(latestAppeal.created_at).toLocaleString("pt-BR")} ·{" "}
                  {latestAppeal.status === "pending" && "aguardando resposta"}
                  {latestAppeal.status === "answered" && "respondida"}
                  {latestAppeal.status === "ignored" && "encerrada"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{latestAppeal.appeal_text}</p>
                {latestAppeal.status === "answered" && latestAppeal.response_text && (
                  <div className="mt-3 rounded-xl bg-[var(--petal)]/40 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
                      Resposta da equipe
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{latestAppeal.response_text}</p>
                  </div>
                )}
              </div>
            )}

            {canAppeal && (
              <div className="mt-5">
                <label className="text-sm font-semibold">Recorrer da decisão</label>
                <Textarea
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  maxLength={2000}
                  placeholder="Conte com calma o que aconteceu e por que acredita que houve engano..."
                  className="mt-2 min-h-[120px]"
                />
                <div className="mt-3 flex justify-end">
                  <Button onClick={() => submitAppeal("ban")} disabled={appealBusy}>
                    <Send className="mr-2 h-4 w-4" /> Enviar apelação
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SOLICITAÇÕES DA EQUIPE */}
        {isRejected && (
          <section className="mt-6 rounded-3xl border border-amber-500/40 bg-amber-500/5 p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                  Conta negada
                </h2>
                <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
                  Revise sua conta e tente novamente.
                </p>
                {profile.rejection_reason && (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-500/10 p-2 text-sm text-amber-900 dark:text-amber-200">
                    <span className="font-semibold">Motivo:</span> {profile.rejection_reason}
                  </p>
                )}
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/perfil">Editar meu perfil</Link>
                  </Button>
                </div>
              </div>
            </div>

            {latestRejectionAppeal && (
              <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sua solicitação · {new Date(latestRejectionAppeal.created_at).toLocaleString("pt-BR")} ·{" "}
                  {latestRejectionAppeal.status === "pending" && "aguardando resposta"}
                  {latestRejectionAppeal.status === "answered" && "respondida"}
                  {latestRejectionAppeal.status === "ignored" && "encerrada"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{latestRejectionAppeal.appeal_text}</p>
                {latestRejectionAppeal.status === "answered" && latestRejectionAppeal.response_text && (
                  <div className="mt-3 rounded-xl bg-[var(--petal)]/40 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
                      Resposta da equipe
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{latestRejectionAppeal.response_text}</p>
                  </div>
                )}
              </div>
            )}

            {canReverify && (
              <div className="mt-5">
                <label className="text-sm font-semibold">Pedir nova análise</label>
                <Textarea
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  maxLength={2000}
                  placeholder="Conte o que mudou no seu perfil ou justifique para reanálise..."
                  className="mt-2 min-h-[120px]"
                />
                <div className="mt-3 flex justify-end">
                  <Button onClick={() => submitAppeal("rejection")} disabled={appealBusy}>
                    <Send className="mr-2 h-4 w-4" /> Verificar Novamente
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {adminRequests.length > 0 && (
          <section className="mt-6 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                <ClipboardList className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold">Solicitações da equipe</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pequenos ajustes pedidos pela moderação para manter o espaço saudável.
            </p>
            <ul className="mt-4 space-y-3">
              {adminRequests.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-border/50 bg-background/40 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rose)]">
                    {r.kind === "photo" && "Foto"}
                    {r.kind === "bio" && "Biografia"}
                    {r.kind === "behavior" && "Comportamento"}
                    {r.kind === "other" && "Outro"}
                    {" · "}
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{r.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(r.kind === "photo" || r.kind === "bio") && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/perfil">Ir para o perfil</Link>
                      </Button>
                    )}
                    <Button size="sm" onClick={() => resolveRequest(r.id)}>
                      Marcar como resolvida
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* GRID */}
        {!isBanned && !isRejected && <>
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* CHECKLIST */}
          <div className="animate-fade-up rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold">Como começar</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pequenos passos que abrem grandes histórias.
            </p>
            <ul className="mt-5 space-y-2">
              {checklist.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-border/60 hover:bg-muted/40"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                        item.done
                          ? "bg-[var(--rose)]/15 text-[var(--rose)]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </span>
                    <span
                      className={`flex-1 text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}
                    >
                      {item.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PERFIL */}
          <div
            className="animate-fade-up rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-love text-lg font-bold text-white">
                {profile.photo_url ? (
                  <PhotoImg src={profile.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  firstName.charAt(0).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">Seu perfil</p>
                <h3 className="truncate text-base font-semibold">{profile.full_name ?? "Você"}</h3>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Completude</span>
                <span className="text-2xl font-extrabold tracking-tight">{completion}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--coral)] to-[var(--rose)] transition-all duration-700"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {completion >= 90
                  ? "Seu perfil está brilhando ✨"
                  : "Perfis completos recebem mais interesses."}
              </p>
            </div>

            <Button
              asChild
              className="mt-5 w-full rounded-full"
              variant={completion >= 90 ? "outline" : "default"}
            >
              <Link to="/perfil">{completion >= 90 ? "Ver meu perfil" : "Completar perfil"}</Link>
            </Button>
          </div>
        </section>

        {/* DEVOCIONAL + COMUNIDADE */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* DEVOCIONAL */}
          <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur lg:col-span-2">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[var(--petal)] opacity-60 blur-3xl"
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                  <BookHeart className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold">Devocional do dia</h2>
              </div>
              {devo ? (
                <>
                  {devo.bible_reference && (
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)]">
                      {devo.bible_reference}
                    </p>
                  )}
                  {devo.bible_text && (
                    <blockquote className="mt-2 border-l-2 border-[var(--rose)]/40 pl-4 text-base italic leading-relaxed text-foreground/90 sm:text-lg">
                      “{devo.bible_text}”
                    </blockquote>
                  )}
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{devo.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {devo.content}
                  </p>
                  <div className="mt-5">
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full bg-white/50 backdrop-blur dark:bg-white/5"
                    >
                      <Link to="/devocional">
                        Ler agora <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  Em breve, um novo devocional para o seu dia.
                </p>
              )}
            </div>
          </div>

          {/* COMUNIDADE VIVA */}
          <div
            className="animate-fade-up rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                <Flame className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold">Comunidade viva</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">O que está acontecendo agora.</p>

            <ul className="mt-5 space-y-3">
              <PulseRow
                icon={<Users className="h-4 w-4" />}
                label="Novos perfis (7d)"
                value={community.newProfiles}
              />
              <PulseRow
                icon={<MessageCircle className="h-4 w-4" />}
                label="Mensagens (24h)"
                value={community.newComments}
              />
              <PulseRow
                icon={<Globe className="h-4 w-4" />}
                label="Espaço da comunidade"
                value="ativo"
                cta={{ to: "/comunidade", label: "Entrar" }}
              />
            </ul>
          </div>
        </section>

        {/* POSSÍVEIS CONEXÕES */}
        {isApproved && suggestions.length > 0 && (
          <section className="mt-8 animate-fade-up">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Possíveis conexões</h2>
                <p className="text-sm text-muted-foreground">
                  Pessoas que podem combinar com você.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-full">
                <Link to="/pretendentes">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.slice(0, 3).map((s) => (
                <Link
                  key={s.id}
                  to="/pretendentes/$id"
                  params={{ id: s.id }}
                  className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
                    {s.photo_url ? (
                      <PhotoImg
                        src={s.photo_url}
                        alt={s.full_name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-love text-4xl text-white">
                        {s.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="truncate text-base font-semibold">
                      {s.full_name.split(" ")[0]}
                      {s.age ? `, ${s.age}` : ""}
                    </p>
                    {(s.city || s.state) && (
                      <p className="truncate text-xs opacity-80">
                        {[s.city, s.state].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* DICAS */}
        <section className="mt-10 animate-fade-up">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Dicas da plataforma</h2>
              <p className="text-sm text-muted-foreground">
                Pequenos guias para uma jornada mais leve.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTipIndex((i) => (i - 1 + TIPS.length) % TIPS.length)}
                aria-label="Dica anterior"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 backdrop-blur transition hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTipIndex((i) => (i + 1) % TIPS.length)}
                aria-label="Próxima dica"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 backdrop-blur transition hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${tipIndex * 100}%)` }}
            >
              {TIPS.map((t, i) => (
                <div key={i} className="w-full shrink-0 px-1">
                  <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur sm:p-8">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--petal)] opacity-60 blur-3xl"
                    />
                    <div className="relative flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                        <t.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold sm:text-lg">{t.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {t.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-1.5">
            {TIPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTipIndex(i)}
                aria-label={`Ir para dica ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === tipIndex ? "w-6 bg-[var(--rose)]" : "w-1.5 bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        </section>
        </>}
      </main>
    </div>
  );
}

function PulseRow({
  icon,
  label,
  value,
  cta,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  cta?: { to: "/comunidade"; label: string };
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-3 py-2.5 backdrop-blur">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--petal)] text-[var(--rose)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
      </div>
      {cta ? (
        <Button asChild size="sm" variant="ghost" className="h-7 rounded-full px-3 text-xs">
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      ) : (
        <span className="text-sm font-bold tabular-nums">{value}</span>
      )}
    </li>
  );
}
