import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { UserPlus, ShieldCheck, HeartHandshake, MessageCircle, UsersRound } from "lucide-react";

const FAQS = [
  {
    q: "O VaiDarNamoro é gratuito?",
    a: "Sim. O cadastro e o uso da plataforma são totalmente gratuitos.",
  },
  {
    q: "Quanto tempo leva para meu perfil ser aprovado?",
    a: "Nossa equipe revisa cada perfil manualmente. O processo costuma levar até 48 horas.",
  },
  {
    q: "Por que aprovação manual?",
    a: "Para cuidar da confiança e da convivência. A revisão ajuda a reduzir perfis falsos e protege tanto a participação comunitária quanto as áreas opcionais.",
  },
  {
    q: "Preciso estar procurando namoro para participar?",
    a: "Não. A comunidade é para convivência, fé, amizade e conteúdo. O Modo Namoro é separado e opcional.",
  },
  {
    q: "Meus dados ficam públicos?",
    a: "Não. Apenas usuários aprovados acessam o app. Seu perfil nunca aparece em buscas do Google.",
  },
];

export const Route = createFileRoute("/como-funciona")({
  component: ComoFuncionaPage,
  head: () => ({
    meta: [
      { title: "Como funciona — Comunidade Vai Dar Namoro" },
      {
        name: "description",
        content:
          "Conheça a comunidade Vai Dar Namoro: cadastro, cuidado, convivência e um Modo Namoro separado e opcional.",
      },
      { property: "og:title", content: "Como funciona o VaiDarNamoro" },
      {
        property: "og:description",
        content:
          "Cadastro, cuidado e convivência em uma comunidade cristã. O Namoro permanece disponível como modo opcional.",
      },
      { property: "og:url", content: "https://vaidarnamoro.com/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "https://vaidarnamoro.com/como-funciona" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});

const STEPS = [
  {
    icon: UserPlus,
    title: "1. Crie sua identidade",
    text: "Comece com as informações necessárias para segurança e participação comunitária.",
  },
  {
    icon: ShieldCheck,
    title: "2. Passe pelo cuidado",
    text: "A equipe revisa os dados necessários para manter um ambiente mais humano e confiável.",
  },
  {
    icon: UsersRound,
    title: "3. Participe da comunidade",
    text: "Acompanhe conteúdo, conversas e atividades sem precisar parecer romanticamente disponível.",
  },
  {
    icon: MessageCircle,
    title: "4. Crie vínculos",
    text: "Converse e conheça pessoas em contextos sociais, espirituais e comunitários.",
  },
  {
    icon: HeartHandshake,
    title: "Opcional: ative o Namoro",
    text: "Se quiser, configure disponibilidade e preferências em uma área separada e reversível.",
  },
];

function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Como <span className="text-gradient">funciona</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Entre pela comunidade. Escolha depois, com clareza, quais experiências fazem sentido
            para você.
          </p>
        </header>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--petal)]">
                <s.icon className="h-5 w-5 text-[var(--rose)]" />
              </div>
              <h2 className="mt-5 text-lg font-bold tracking-tight">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 rounded-3xl border border-border bg-card p-10 md:p-14">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Por que aprovação manual?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Plataformas sociais precisam equilibrar entrada simples e confiança. Nós escolhemos
            revisar as informações necessárias porque convivência, conteúdo e conversas também
            exigem cuidado.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Aprovação comunitária não significa disponibilidade romântica. O Modo Namoro possui
            configuração própria, e participar dele nunca é requisito para fazer parte da
            comunidade.
          </p>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-extrabold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-8 space-y-4">
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-border bg-card p-6 open:shadow-soft"
              >
                <summary className="cursor-pointer list-none font-semibold tracking-tight">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-20 text-center">
          <Link
            to="/auth/signup"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--rose)] px-8 font-semibold text-white shadow-glow hover:opacity-90"
          >
            Acessar comunidade
          </Link>
        </section>
      </main>
    </div>
  );
}
