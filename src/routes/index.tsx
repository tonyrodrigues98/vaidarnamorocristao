import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Heart, Shield, Sparkles, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "VaiDarNamoro — Onde a fé encontra o amor | Namoro Cristão" },
      {
        name: "description",
        content:
          "A plataforma cristã de relacionamentos sérios para solteiros e divorciados. Perfis aprovados manualmente, sem swipe, com propósito eterno. Cadastro gratuito.",
      },
      {
        name: "keywords",
        content:
          "namoro cristão, relacionamento cristão, app cristão de namoro, encontros cristãos, namoro evangélico, casamento cristão, solteiros cristãos",
      },
      { property: "og:title", content: "VaiDarNamoro — Onde a fé encontra o amor" },
      {
        property: "og:description",
        content:
          "Plataforma cristã de relacionamentos sérios. Perfis aprovados manualmente, sem swipe, com propósito eterno.",
      },
      { property: "og:image", content: "https://vaidarnamoro.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "VaiDarNamoro — Onde a fé encontra o amor" },
      { property: "og:url", content: "https://vaidarnamoro.com/" },
      { name: "twitter:title", content: "VaiDarNamoro — Onde a fé encontra o amor" },
      {
        name: "twitter:description",
        content: "Plataforma cristã de relacionamentos sérios. Sem swipe, com propósito.",
      },
      { name: "twitter:image", content: "https://vaidarnamoro.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://vaidarnamoro.com/" }],
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
          description:
            "Plataforma cristã de relacionamentos sérios para solteiros e divorciados que buscam um relacionamento com propósito.",
          areaServed: "BR",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "O VaiDarNamoro é gratuito?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim, o cadastro e o uso da plataforma são totalmente gratuitos.",
              },
            },
            {
              "@type": "Question",
              name: "Quanto tempo leva a aprovação do perfil?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Nossa equipe revisa cada perfil manualmente em até 48 horas.",
              },
            },
            {
              "@type": "Question",
              name: "Por que aprovação manual?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Para garantir que cada pessoa aqui é real, cristã e busca um relacionamento sério.",
              },
            },
            {
              "@type": "Question",
              name: "Posso me cadastrar sendo divorciado?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. Solteiros, viúvos e divorciados são bem-vindos.",
              },
            },
          ],
        }),
      },
    ],
  }),
});

const HEADLINE = ["Onde", "a", "fé", "encontra"];

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/inicio" />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[var(--petal)] opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute top-40 right-0 h-[320px] w-[420px] rounded-full bg-[var(--coral)]/15 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 text-center md:pt-36 md:pb-28">
            <span
              className="animate-reveal mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--rose)]/15 bg-[var(--petal)]/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)]"
              style={{ animationDelay: "0ms" }}
            >
              <Sparkles className="h-3 w-3" /> Plataforma cristã de relacionamentos
            </span>

            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl lg:text-[5.5rem]">
              {HEADLINE.map((w, i) => (
                <span
                  key={i}
                  className="animate-letter mr-3 md:mr-5"
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  {w}
                </span>
              ))}
              <br />
              <span className="animate-letter text-gradient" style={{ animationDelay: "560ms" }}>
                o&nbsp;amor.
              </span>
            </h1>

            <p
              className="animate-reveal mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
              style={{ animationDelay: "780ms" }}
            >
              Um espaço sereno e seguro para cristãos solteiros e divorciados que buscam um
              relacionamento com propósito eterno.
            </p>

            <div
              className="animate-reveal mt-10 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: "920ms" }}
            >
              <Button size="lg" asChild className="h-12 rounded-full px-8 shadow-glow">
                <Link to="/auth/signup">
                  Começar minha jornada <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-[var(--rose)]/20 bg-card px-8 hover:bg-[var(--petal)]/40"
              >
                <Link to="/auth/login">Já tenho conta</Link>
              </Button>
            </div>

            <p
              className="animate-reveal mt-8 text-xs text-muted-foreground"
              style={{ animationDelay: "1080ms" }}
            >
              Sem propaganda. Sem swipe. Apenas conexões com propósito.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="border-y border-border bg-gradient-warm">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Aprovação manual",
                text: "Cada perfil é revisado individualmente pela nossa equipe antes de aparecer publicamente.",
              },
              {
                icon: Heart,
                title: "Conexões intencionais",
                text: "Demonstre interesse e converse apenas quando o sentimento for recíproco.",
              },
              {
                icon: Users,
                title: "Comunidade na fé",
                text: "Pessoas comprometidas com Cristo, sua igreja e um relacionamento sério.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="hover-lift animate-fade-up rounded-3xl border border-border bg-card p-7 shadow-soft"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--petal)]">
                  <f.icon className="h-5 w-5 text-[var(--rose)]" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* QUOTE */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-2xl font-medium leading-relaxed text-foreground/85 md:text-3xl">
            "Acima de tudo, porém, revistam-se do{" "}
            <span className="text-gradient font-bold">amor</span>, que é o elo perfeito."
          </p>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--rose)]">
            Colossenses 3:14
          </p>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-love p-10 text-center text-white shadow-elegant md:p-16">
            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight md:text-5xl">
              Sua próxima história começa com uma escolha.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Crie seu perfil hoje. A aprovação leva até 48h e é totalmente gratuita.
            </p>
            <Button
              size="lg"
              asChild
              className="mt-8 h-12 rounded-full bg-white px-8 font-semibold text-[var(--rose)] hover:bg-white/90"
            >
              <Link to="/auth/signup">
                Criar conta gratuita <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border py-10 text-center text-xs text-muted-foreground">
          <nav className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/sobre" className="hover:text-[var(--rose)]">
              Sobre
            </Link>
            <Link to="/como-funciona" className="hover:text-[var(--rose)]">
              Como funciona
            </Link>
            <Link to="/depoimentos" className="hover:text-[var(--rose)]">
              Depoimentos
            </Link>
            <Link to="/blog" className="hover:text-[var(--rose)]">
              Blog
            </Link>
            <Link to="/termos" className="hover:text-[var(--rose)]">
              Termos
            </Link>
            <Link to="/manual" className="hover:text-[var(--rose)]">
              Manual
            </Link>
          </nav>
          © {new Date().getFullYear()} VaiDarNamoro · Feito com fé e cuidado.
        </footer>
      </main>
    </div>
  );
}
