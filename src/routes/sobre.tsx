import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/shells/PublicShell";
import { brand } from "@/config/brand";
import { Heart, Shield, BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
  head: () => ({
    meta: [
      { title: `Sobre — ${brand.displayName}` },
      {
        name: "description",
        content:
          "Conheça a missão e os valores da comunidade cristã VaiDarNamoro, com amizade, fé, experiências e relacionamento opcional.",
      },
      { property: "og:title", content: "Sobre o VaiDarNamoro" },
      {
        property: "og:description",
        content:
          "Uma comunidade cristã 18+ para amizade, convivência, fé e experiências; relacionamento é opcional.",
      },
      { property: "og:url", content: `${brand.origin}/sobre` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${brand.origin}/sobre` }],
  }),
});

function SobrePage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="text-center">
          <span className="inline-flex rounded-full border border-[var(--rose)]/15 bg-[var(--petal)]/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)]">
            Quem somos
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
            Onde a fé encontra <span className="text-gradient">comunidade</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            O VaiDarNamoro é uma comunidade cristã 18+ para pertencer, conversar, estudar, jogar e
            criar conexões no seu ritmo. Relacionamento é uma experiência opcional.
          </p>
        </header>

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <BookOpen className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Nossa missão</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Acolher pessoas que compartilham ou estão conhecendo a fé cristã, com amizade,
              convivência, estudo e experiências como parte central do produto.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <Shield className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Aprovação manual</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Perfis e conteúdos passam por processos de revisão e moderação que reduzem riscos, sem
              prometer eliminar completamente identidades falsas ou condutas inadequadas.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <Heart className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Sem swipe, com propósito</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Não tratamos pessoas como cards descartáveis. Aqui você demonstra interesse e conversa
              apenas quando o sentimento é recíproco.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <Users className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Comunidade na fé</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Devocional diário, comunidade e espaço de oração. Mais que um app de relacionamento —
              um lugar para crescer espiritualmente.
            </p>
          </div>
        </section>

        <section className="mt-20 rounded-3xl bg-gradient-warm p-10 text-center md:p-14">
          <p className="mx-auto max-w-2xl text-2xl font-medium leading-relaxed text-foreground/85 md:text-3xl">
            "Portanto, o que Deus ajuntou, não o separe o homem."
          </p>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--rose)]">
            Mateus 19:6
          </p>
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Junte-se a nós</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Cadastro gratuito. Conclua seu perfil e acompanhe a análise antes de entrar na
            comunidade.
          </p>
          <Link
            to="/auth/signup"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--rose)] px-8 font-semibold text-white shadow-glow hover:opacity-90"
          >
            Criar conta gratuita
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
