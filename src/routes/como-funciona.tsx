import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/shells/PublicShell";
import { brand } from "@/config/brand";
import { UserPlus, ShieldCheck, Heart, MessageCircle } from "lucide-react";

const FAQS = [
  {
    q: "O VaiDarNamoro é gratuito?",
    a: "Sim. O cadastro e o uso da plataforma são totalmente gratuitos.",
  },
  {
    q: "Quanto tempo leva para meu perfil ser aprovado?",
    a: "A equipe analisa o perfil e o resultado aparece na própria conta. O prazo pode variar conforme a fila e as verificações necessárias.",
  },
  {
    q: "Por que aprovação manual?",
    a: "A revisão e a moderação ajudam a reduzir riscos, mas não garantem identidade, fé ou intenção e não substituem seus cuidados de segurança.",
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
      { title: `Como funciona — ${brand.displayName}` },
      {
        name: "description",
        content:
          "Crie sua conta, conclua o perfil, entre na comunidade e use as experiências, incluindo relacionamento opcional.",
      },
      { property: "og:title", content: "Como funciona o VaiDarNamoro" },
      {
        property: "og:description",
        content:
          "Cadastro, análise de perfil, comunidade cristã e experiências opcionais em um só lugar.",
      },
      { property: "og:url", content: `${brand.origin}/como-funciona` },
    ],
    links: [{ rel: "canonical", href: `${brand.origin}/como-funciona` }],
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
    text: "A equipe analisa seu perfil. Revisão e moderação reduzem riscos, mas não eliminam todos os riscos.",
  },
  {
    icon: Heart,
    title: "3. Entre na comunidade e explore",
    text: "Converse, leia o Devocional, participe de Orações e conheça Pets, Arcade e personalização.",
  },
  {
    icon: MessageCircle,
    title: "4. Ative o relacionamento se desejar",
    text: "O modo de relacionamento é opcional e fica dentro de Explorar, sem swipe ou percentual de compatibilidade.",
  },
];

function ComoFuncionaPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Como <span className="text-gradient">funciona</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Quatro passos para entrar na comunidade e usar as experiências no seu ritmo.
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
            A revisão humana e as ferramentas de moderação ajudam a identificar inconsistências e
            responder a denúncias. Esses processos reduzem riscos, mas não eliminam todos eles.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Preserve sua privacidade, use bloqueio e denúncia quando necessário e procure o suporte
            diante de qualquer comportamento suspeito.
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
    </PublicShell>
  );
}
