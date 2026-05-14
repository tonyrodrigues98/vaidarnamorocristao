import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  Heart, Shield, Sparkles, Users, ArrowRight, LayoutDashboard,
  UserPlus, BadgeCheck, MessageCircle, Compass,
} from "lucide-react";
import { CinematicBackground } from "@/components/cinematic/CinematicBackground";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "VaiDarNamoro — Onde a fé encontra o amor | Namoro Cristão" },
      { name: "description", content: "A plataforma cristã de relacionamentos sérios para solteiros e divorciados. Perfis aprovados manualmente, sem swipe, com propósito eterno. Cadastro gratuito." },
      { name: "keywords", content: "namoro cristão, relacionamento cristão, app cristão de namoro, encontros cristãos, namoro evangélico, casamento cristão, solteiros cristãos" },
      { property: "og:title", content: "VaiDarNamoro — Onde a fé encontra o amor" },
      { property: "og:description", content: "Plataforma cristã de relacionamentos sérios. Perfis aprovados manualmente, sem swipe, com propósito eterno." },
      { property: "og:image", content: "https://vaidarnamoro.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "VaiDarNamoro — Onde a fé encontra o amor" },
      { property: "og:url", content: "https://vaidarnamoro.com/" },
      { name: "twitter:title", content: "VaiDarNamoro — Onde a fé encontra o amor" },
      { name: "twitter:description", content: "Plataforma cristã de relacionamentos sérios. Sem swipe, com propósito." },
      { name: "twitter:image", content: "https://vaidarnamoro.com/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://vaidarnamoro.com/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "VaiDarNamoro",
          url: "https://vaidarnamoro.com/",
          description: "Plataforma cristã de relacionamentos sérios.",
          inLanguage: "pt-BR",
          publisher: {
            "@type": "Organization",
            name: "VaiDarNamoro",
            url: "https://vaidarnamoro.com/",
            logo: { "@type": "ImageObject", url: "https://vaidarnamoro.com/og-image.jpg" },
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "VaiDarNamoro",
          url: "https://vaidarnamoro.com/",
          logo: "https://vaidarnamoro.com/og-image.jpg",
          description: "Plataforma cristã de relacionamentos sérios para solteiros e divorciados que buscam um relacionamento com propósito.",
          areaServed: "BR",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "O VaiDarNamoro é gratuito?", acceptedAnswer: { "@type": "Answer", text: "Sim, o cadastro e o uso da plataforma são totalmente gratuitos." } },
            { "@type": "Question", name: "Quanto tempo leva a aprovação do perfil?", acceptedAnswer: { "@type": "Answer", text: "Nossa equipe revisa cada perfil manualmente em até 48 horas." } },
            { "@type": "Question", name: "Por que aprovação manual?", acceptedAnswer: { "@type": "Answer", text: "Para garantir que cada pessoa aqui é real, cristã e busca um relacionamento sério." } },
            { "@type": "Question", name: "Posso me cadastrar sendo divorciado?", acceptedAnswer: { "@type": "Answer", text: "Sim. Solteiros, viúvos e divorciados são bem-vindos." } },
          ],
        }),
      },
    ],
  }),
});

const HEADLINE = ["Onde", "a", "fé", "encontra"];

function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : "/auth/signup";
  const primaryLabel = user ? "Ir para o Dashboard" : "Começar minha jornada";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="scroll-smooth">
        {/* HERO — cinematic */}
        <section className="relative isolate overflow-hidden">
          <CinematicBackground />

          <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-24 text-center md:pt-36 md:pb-32">
            <span
              className="animate-reveal mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rose)] backdrop-blur-md shadow-soft"
              style={{ animationDelay: "0ms" }}
            >
              <Sparkles className="h-3 w-3" /> Bem-vindo ao VaiDarNamoro
            </span>

            <h1 className="mx-auto max-w-5xl text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl lg:text-[6rem]">
              {HEADLINE.map((w, i) => (
                <span key={i} className="animate-letter mr-3 md:mr-5" style={{ animationDelay: `${120 + i * 110}ms` }}>
                  {w}
                </span>
              ))}
              <br />
              <span className="animate-letter text-gradient" style={{ animationDelay: "640ms" }}>
                o&nbsp;amor.
              </span>
            </h1>

            <p
              className="animate-reveal mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
              style={{ animationDelay: "880ms" }}
            >
              {user
                ? "Que bom te ver de volta. Sua jornada continua aqui — explore conexões, comunidade e propósito."
                : "Um espaço sereno e seguro para cristãos solteiros e divorciados que buscam um relacionamento com propósito eterno."}
            </p>

            <div className="animate-reveal mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "1020ms" }}>
              <Button size="lg" asChild className="h-12 rounded-full px-8 shadow-glow transition-transform hover:-translate-y-0.5">
                <Link to={primaryHref}>
                  {user ? <LayoutDashboard className="mr-1.5 h-4 w-4" /> : null}
                  {primaryLabel} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button size="lg" variant="outline" asChild className="h-12 rounded-full border-border bg-card/60 px-8 backdrop-blur-md hover:bg-[var(--petal)]/40">
                  <Link to="/auth/login">Já tenho conta</Link>
                </Button>
              )}
              {user && (
                <Button size="lg" variant="outline" asChild className="h-12 rounded-full border-border bg-card/60 px-8 backdrop-blur-md hover:bg-[var(--petal)]/40">
                  <a href="#como-comecar">Como começar</a>
                </Button>
              )}
            </div>

            <p className="animate-reveal mt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground" style={{ animationDelay: "1180ms" }}>
              Sem propaganda · Sem swipe · Conexões com propósito
            </p>
          </div>
        </section>

        {/* RESUMO — glassmorphism cards */}
        <section className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--rose)]">O que vive aqui</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
              Uma experiência <span className="text-gradient">desenhada com cuidado</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada parte da plataforma foi pensada para favorecer encontros sérios, com fé e respeito.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Shield, title: "Aprovação manual", text: "Cada perfil passa por revisão humana antes de aparecer publicamente." },
              { icon: Heart, title: "Conexões intencionais", text: "Demonstre interesse e converse apenas quando o sentimento é mútuo." },
              { icon: Users, title: "Comunidade na fé", text: "Pessoas comprometidas com Cristo, sua igreja e um relacionamento sério." },
              { icon: Compass, title: "Devocional diário", text: "Momentos de fé que acompanham sua jornada todos os dias." },
              { icon: BadgeCheck, title: "Verificação de identidade", text: "Selo de verificado para mais segurança e confiança real." },
              { icon: MessageCircle, title: "Conversas reais", text: "Mensagens diretas após o match, sem ruído e sem swipe." },
            ].map((f, i) => (
              <div
                key={i}
                className="group hover-lift animate-fade-up relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-7 shadow-soft backdrop-blur-xl"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--petal)] opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-70"
                />
                <div className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--petal)] to-[var(--rose-soft)]/40">
                  <f.icon className="h-5 w-5 text-[var(--rose)]" />
                </div>
                <h3 className="relative text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* COMO COMEÇAR */}
        <section id="como-comecar" className="relative border-y border-border/60 bg-gradient-warm">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[var(--coral)]/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--rose)]">Como começar</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
                Três passos serenos.
              </h2>
            </div>

            <ol className="grid gap-6 md:grid-cols-3">
              {[
                { icon: UserPlus, title: "Crie seu perfil", text: "Conte sua história, fé e o que você busca em um relacionamento." },
                { icon: BadgeCheck, title: "Aguarde a aprovação", text: "Nossa equipe revisa cada perfil em até 48 horas, com cuidado." },
                { icon: Heart, title: "Conecte-se com propósito", text: "Demonstre interesse, descubra matches e converse com paz." },
              ].map((s, i) => (
                <li
                  key={i}
                  className="hover-lift animate-fade-up relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-7 shadow-soft backdrop-blur-xl"
                  style={{ animationDelay: `${i * 110}ms` }}
                >
                  <span className="absolute right-5 top-5 text-5xl font-extrabold text-[var(--rose)]/10">
                    0{i + 1}
                  </span>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--petal)]">
                    <s.icon className="h-5 w-5 text-[var(--rose)]" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* QUOTE */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-2xl font-medium leading-relaxed text-foreground/85 md:text-3xl">
            "Acima de tudo, porém, revistam-se do <span className="text-gradient font-bold">amor</span>, que é o elo perfeito."
          </p>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--rose)]">
            Colossenses 3:14
          </p>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-love p-10 text-center text-white shadow-elegant md:p-16">
            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
              {user ? "Continue sua jornada." : "Sua próxima história começa com uma escolha."}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              {user
                ? "Acompanhe interesses, conversas e novidades direto do seu painel."
                : "Crie seu perfil hoje. A aprovação leva até 48h e é totalmente gratuita."}
            </p>
            <Button size="lg" asChild className="mt-8 h-12 rounded-full bg-white px-8 font-semibold text-[var(--rose)] hover:bg-white/90">
              <Link to={primaryHref}>
                {user ? "Abrir Dashboard" : "Criar conta gratuita"} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border py-10 text-center text-xs text-muted-foreground">
          <nav className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/sobre" className="hover:text-[var(--rose)]">Sobre</Link>
            <Link to="/como-funciona" className="hover:text-[var(--rose)]">Como funciona</Link>
            <Link to="/depoimentos" className="hover:text-[var(--rose)]">Depoimentos</Link>
            <Link to="/blog" className="hover:text-[var(--rose)]">Blog</Link>
            <Link to="/termos" className="hover:text-[var(--rose)]">Termos</Link>
            <Link to="/manual" className="hover:text-[var(--rose)]">Manual</Link>
          </nav>
          © {new Date().getFullYear()} VaiDarNamoro · Feito com fé e cuidado.
        </footer>
      </main>
    </div>
  );
}
