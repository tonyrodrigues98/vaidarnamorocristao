import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Sparkles, CheckCircle2, Circle, ArrowRight, BookHeart, Users,
  Heart, MessageCircle, Camera, Globe, Compass, ShieldCheck, ChevronLeft, ChevronRight, Flame,
} from "lucide-react";

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

const TIPS = [
  { icon: Camera, title: "Capriche nas fotos", text: "Use luz natural, mostre seu sorriso e evite filtros pesados. A primeira impressão importa." },
  { icon: ShieldCheck, title: "Segurança em primeiro lugar", text: "Nunca compartilhe dados sensíveis no início. Conheça a pessoa devagar e com calma." },
  { icon: BookHeart, title: "Conexões com propósito", text: "Comece conversas com perguntas reais sobre fé, sonhos e o dia a dia — fuja do 'oi'." },
  { icon: Sparkles, title: "Mostre quem você é", text: "Seu testemunho, versículo favorito e linguagem do amor falam mais que mil fotos." },
  { icon: Heart, title: "Demonstre interesse", text: "Não tenha medo de dar o primeiro passo. Um interesse pode mudar uma história." },
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

function InicioPage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [advCount, setAdvCount] = useState<{ done: number; total: number }>({ done: 0, total: 8 });
  const [devo, setDevo] = useState<Devotional | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [community, setCommunity] = useState({ newProfiles: 0, online: 0, newComments: 0 });
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      const [{ data: p }, { data: adv }, { data: d }] = await Promise.all([
        supabase.from("profiles")
          .select("id, full_name, photo_url, bio, height_cm, status, city, state, age, sex")
          .eq("id", user.id).maybeSingle(),
        supabase.from("profile_advanced")
          .select("life_verse, testimony, seeking, essential_quality, hobbies, love_language, wants_marriage, wants_children")
          .eq("user_id", user.id).maybeSingle(),
        supabase.from("daily_posts")
          .select("id, title, content, bible_reference, bible_text, published_at")
          .eq("kind", "devotional").eq("published", true)
          .order("published_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (cancel) return;
      setProfile(p as Profile | null);
      setDevo(d as Devotional | null);
      const fields = adv ? [adv.life_verse, adv.testimony, adv.seeking, adv.essential_quality, adv.hobbies, adv.love_language, adv.wants_marriage, adv.wants_children] : [];
      setAdvCount({ done: fields.filter(Boolean).length, total: 8 });

      if ((p as Profile | null)?.status === "approved") {
        const targetSex = (p as Profile).sex === "masculino" ? "feminino" : "masculino";
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const sinceWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [{ data: sugg }, newProfilesRes, newCommentsRes] = await Promise.all([
          supabase.from("profiles")
            .select("id, full_name, age, city, state, photo_url")
            .eq("status", "approved").eq("sex", targetSex).neq("id", user.id)
            .not("photo_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase.from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "approved").gte("created_at", sinceWeek),
          supabase.from("messages")
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
    return () => { cancel = true; };
  }, [user]);

  const checklist = useMemo(() => {
    const p = profile;
    return [
      { key: "photo", label: "Adicione uma boa foto", done: !!p?.photo_url, to: "/perfil" as const },
      { key: "bio", label: "Capriche na sua bio", done: !!(p?.bio && p.bio.trim().length >= 30), to: "/perfil" as const },
      { key: "advanced", label: "Conte sobre você (testemunho, versículo…)", done: advCount.done >= 5, to: "/perfil" as const },
      { key: "explore", label: "Explore pretendentes", done: false, to: "/pretendentes" as const },
      { key: "community", label: "Participe da comunidade", done: false, to: "/comunidade" as const },
      { key: "devotional", label: "Leia o devocional do dia", done: false, to: "/devocional" as const },
    ];
  }, [profile, advCount]);

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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-warm px-6 py-10 shadow-soft sm:px-10 sm:py-14">
          <div aria-hidden className="pointer-events-none absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-[var(--petal)] opacity-70 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 h-[380px] w-[380px] rounded-full bg-[var(--coral)]/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute top-10 right-1/3 h-2 w-2 animate-pulse rounded-full bg-[var(--rose)]/60" />
          <div aria-hidden className="pointer-events-none absolute bottom-16 left-1/4 h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--coral)]/70" style={{ animationDelay: "1.2s" }} />

          <div className="relative">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-[var(--rose)]/15 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rose)] backdrop-blur dark:bg-white/10">
              <Sparkles className="h-3 w-3" /> Seu espaço
            </div>
            <h1 className="animate-fade-up mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl" style={{ animationDelay: "60ms" }}>
              {greeting(profile.full_name)} <span className="inline-block">👋</span>
            </h1>
            <p className="animate-fade-up mt-3 max-w-xl text-base text-muted-foreground sm:text-lg" style={{ animationDelay: "140ms" }}>
              {subGreeting()} {isApproved ? "Sua jornada continua — explore, converse e deixe Deus surpreender você." : "Logo seu perfil será revisado e você poderá começar a explorar."}
            </p>

            <div className="animate-fade-up mt-7 flex flex-wrap gap-3" style={{ animationDelay: "220ms" }}>
              {isApproved ? (
                <>
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link to="/pretendentes"><Compass className="mr-2 h-4 w-4" /> Ver pretendentes</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full px-6 backdrop-blur bg-white/40 dark:bg-white/5">
                    <Link to="/devocional"><BookHeart className="mr-2 h-4 w-4" /> Devocional do dia</Link>
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

        {/* GRID */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* CHECKLIST */}
          <div className="animate-fade-up rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold">Como começar</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Pequenos passos que abrem grandes histórias.</p>
            <ul className="mt-5 space-y-2">
              {checklist.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-border/60 hover:bg-muted/40"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      item.done ? "bg-[var(--rose)]/15 text-[var(--rose)]" : "bg-muted text-muted-foreground"
                    }`}>
                      {item.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </span>
                    <span className={`flex-1 text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}>
                      {item.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PERFIL */}
          <div className="animate-fade-up rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-love text-lg font-bold text-white">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
                ) : firstName.charAt(0).toUpperCase()}
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
                {completion >= 90 ? "Seu perfil está brilhando ✨" : "Perfis completos recebem mais interesses."}
              </p>
            </div>

            <Button asChild className="mt-5 w-full rounded-full" variant={completion >= 90 ? "outline" : "default"}>
              <Link to="/perfil">{completion >= 90 ? "Ver meu perfil" : "Completar perfil"}</Link>
            </Button>
          </div>
        </section>

        {/* DEVOCIONAL + COMUNIDADE */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* DEVOCIONAL */}
          <div className="animate-fade-up relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur lg:col-span-2">
            <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[var(--petal)] opacity-60 blur-3xl" />
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
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)]">{devo.bible_reference}</p>
                  )}
                  {devo.bible_text && (
                    <blockquote className="mt-2 border-l-2 border-[var(--rose)]/40 pl-4 text-base italic leading-relaxed text-foreground/90 sm:text-lg">
                      “{devo.bible_text}”
                    </blockquote>
                  )}
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{devo.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{devo.content}</p>
                  <div className="mt-5">
                    <Button asChild variant="outline" className="rounded-full bg-white/50 backdrop-blur dark:bg-white/5">
                      <Link to="/devocional">Ler agora <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">Em breve, um novo devocional para o seu dia.</p>
              )}
            </div>
          </div>

          {/* COMUNIDADE VIVA */}
          <div className="animate-fade-up rounded-3xl border border-border/60 bg-card/70 p-6 shadow-soft backdrop-blur" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                <Flame className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold">Comunidade viva</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">O que está acontecendo agora.</p>

            <ul className="mt-5 space-y-3">
              <PulseRow icon={<Users className="h-4 w-4" />} label="Novos perfis (7d)" value={community.newProfiles} />
              <PulseRow icon={<MessageCircle className="h-4 w-4" />} label="Mensagens (24h)" value={community.newComments} />
              <PulseRow icon={<Globe className="h-4 w-4" />} label="Espaço da comunidade" value="ativo" cta={{ to: "/comunidade", label: "Entrar" }} />
            </ul>
          </div>
        </section>

        {/* POSSÍVEIS CONEXÕES */}
        {isApproved && suggestions.length > 0 && (
          <section className="mt-8 animate-fade-up">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Possíveis conexões</h2>
                <p className="text-sm text-muted-foreground">Pessoas que podem combinar com você.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-full">
                <Link to="/pretendentes">Ver todos <ArrowRight className="ml-1 h-4 w-4" /></Link>
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
                      <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-love text-4xl text-white">
                        {s.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="truncate text-base font-semibold">
                      {s.full_name.split(" ")[0]}{s.age ? `, ${s.age}` : ""}
                    </p>
                    {(s.city || s.state) && (
                      <p className="truncate text-xs opacity-80">{[s.city, s.state].filter(Boolean).join(" · ")}</p>
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
              <p className="text-sm text-muted-foreground">Pequenos guias para uma jornada mais leve.</p>
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
                    <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--petal)] opacity-60 blur-3xl" />
                    <div className="relative flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--petal)] text-[var(--rose)]">
                        <t.icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold sm:text-lg">{t.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
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
      </main>
    </div>
  );
}

function PulseRow({
  icon, label, value, cta,
}: {
  icon: React.ReactNode; label: string; value: number | string;
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