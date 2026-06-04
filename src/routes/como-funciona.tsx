import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { UserPlus, ShieldCheck, Heart, MessageCircle } from "lucide-react";

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
    a: "Para garantir que cada pessoa aqui é real, cristã e está buscando um relacionamento sério. Reduz fakes e aumenta a qualidade dos matches.",
  },
  {
    q: "Posso me cadastrar sendo divorciado?",
    a: "Sim. Acreditamos no recomeço. Solteiros, viúvos e divorciados são bem-vindos.",
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
      { title: "Como funciona o VaiDarNamoro — Namoro cristão com aprovação manual" },
      {
        name: "description",
        content:
          "Em 4 passos: cadastro, aprovação manual, conheça pretendentes verificados e converse com propósito. Saiba como o VaiDarNamoro funciona.",
      },
      { property: "og:title", content: "Como funciona o VaiDarNamoro" },
      {
        property: "og:description",
        content:
          "Cadastro, aprovação manual, conexões intencionais. Conheça o passo a passo da plataforma cristã de relacionamentos sérios.",
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
    title: "1. Crie seu perfil",
    text: "Cadastro rápido e gratuito. Compartilhe sua história, sua fé e o que você busca.",
  },
  {
    icon: ShieldCheck,
    title: "2. Aprovação manual",
    text: "Nossa equipe revisa seu perfil em até 48h. Garantimos um ambiente real e seguro.",
  },
  {
    icon: Heart,
    title: "3. Demonstre interesse",
    text: "Conheça pretendentes aprovados. Demonstre interesse — sem swipe, sem ansiedade.",
  },
  {
    icon: MessageCircle,
    title: "4. Converse com propósito",
    text: "Quando o interesse é recíproco, vocês conversam. Cada conexão tem intenção real.",
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
            Quatro passos simples até a sua próxima história começar.
          </p>
        </header>

        <section className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            Apps tradicionais permitem qualquer pessoa criar perfil em segundos. O resultado: bots,
            fakes, pessoas que não compartilham os mesmos valores. Nós escolhemos o caminho mais
            difícil — revisar cada perfil — porque acreditamos que sua confiança vale o esforço.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Quando você está aqui, você sabe: cada pessoa do outro lado é real, cristã, e está
            buscando algo sério. Não é promessa de marketing. É processo.
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
            Começar agora
          </Link>
        </section>
      </main>
    </div>
  );
}
