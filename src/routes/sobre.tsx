import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { HeartHandshake, Shield, BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  component: SobrePage,
  head: () => ({
    meta: [
      { title: "Sobre — Comunidade Vai Dar Namoro" },
      {
        name: "description",
        content:
          "Conheça a missão e os valores do Vai Dar Namoro: uma comunidade cristã para convivência, fé, amizade, conteúdo e conexões com propósito.",
      },
      { property: "og:title", content: "Sobre o VaiDarNamoro" },
      {
        property: "og:description",
        content:
          "Nossa missão é criar um espaço cristão acolhedor para convivência, crescimento e conexões. O Namoro é uma experiência opcional.",
      },
      { property: "og:url", content: "https://vaidarnamoro.com/sobre" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://vaidarnamoro.com/sobre" }],
  }),
});

function SobrePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <header className="text-center">
          <span className="inline-flex rounded-full border border-[var(--rose)]/15 bg-[var(--petal)]/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rose)]">
            Quem somos
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
            Onde a fé encontra <span className="text-gradient">comunidade</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            O Vai Dar Namoro nasceu de encontros ao vivo e de uma convicção simples: cristãos
            merecem um espaço humano para caminhar, conversar e construir vínculos com respeito.
          </p>
        </header>

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <BookOpen className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Nossa missão</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Aproximar pessoas cristãs por fé, convivência e propósito. A comunidade acolhe
              participação social independentemente de estado ou disponibilidade romântica.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <Shield className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Aprovação manual</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cada perfil passa por revisão humana antes de aparecer publicamente. Reduz fakes,
              aumenta confiança e garante que quem está aqui está aqui com seriedade.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <HeartHandshake className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Namoro como escolha</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Quem quiser pode ativar uma área romântica própria. Quem não quiser continua com toda
              a participação comunitária, sem referências ou filtros de namoro.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <Users className="h-6 w-6 text-[var(--rose)]" />
            <h2 className="mt-4 text-xl font-bold tracking-tight">Comunidade na fé</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Conteúdo, oração, conversas, atividades e experiências compartilhadas formam o núcleo
              da plataforma.
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
            Entre pela comunidade. Sua participação não ativa o Modo Namoro.
          </p>
          <Link
            to="/auth/signup"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[var(--rose)] px-8 font-semibold text-white shadow-glow hover:opacity-90"
          >
            Acessar comunidade
          </Link>
        </section>
      </main>
    </div>
  );
}
