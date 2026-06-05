import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  HeartHandshake,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "React Foundation | Landing Teste" },
      {
        name: "description",
        content:
          "Landing page de teste com gradientes finos e elegantes para validar a nova direcao visual da home.",
      },
      { property: "og:title", content: "React Foundation | Landing Teste" },
      {
        property: "og:description",
        content:
          "Uma home de teste com acabamento mais sofisticado, atmosfera leve e hierarquia editorial.",
      },
    ],
  }),
  component: Index,
});

const stats = [
  { value: "12k+", label: "conversas iniciadas com mais contexto" },
  { value: "86%", label: "perfis com apresentacao completa" },
  { value: "24/7", label: "sinais ativos da comunidade" },
];

const highlights = [
  {
    icon: ShieldCheck,
    title: "Ambiente confiavel",
    text: "A interface transmite seriedade e acolhimento ao mesmo tempo, sem parecer fria.",
  },
  {
    icon: MessageSquareHeart,
    title: "Conversas com intencao",
    text: "O layout reforca clareza de proposito e reduz a sensacao de catalogo generico.",
  },
  {
    icon: HeartHandshake,
    title: "Visual mais humano",
    text: "Gradientes suaves e cards translucidos deixam a home mais madura e refinada.",
  },
];

const steps = [
  "Crie seu perfil com apresentacao objetiva e fotografias claras.",
  "Receba sugestoes com base em afinidade, valores e sinais de compatibilidade.",
  "Inicie conversas com contexto e acompanhe os proximos passos com mais leveza.",
];

function Index() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="hero-gradient absolute inset-0" />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 pb-18 pt-10 sm:px-8 lg:px-10 lg:pb-24 lg:pt-14">
        <div className="glass-panel rounded-full border border-white/70 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
                React Foundation
              </p>
            </div>
            <div className="hidden items-center gap-8 text-sm text-[var(--ink-soft)] md:flex">
              <a href="#destaques" className="transition hover:text-foreground">
                Destaques
              </a>
              <a href="#como-funciona" className="transition hover:text-foreground">
                Como funciona
              </a>
              <a href="#preview" className="transition hover:text-foreground">
                Preview
              </a>
            </div>
            <Link
              to="/about"
              className="rounded-full border border-primary/15 bg-white/75 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
            >
              Ver detalhes
            </Link>
          </div>
        </div>

        <div className="grid items-center gap-12 pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:pt-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Nova direcao visual da home
            </div>

            <h1 className="mt-6 text-5xl leading-[0.92] font-semibold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
              Uma landing de teste com gradientes finos e acabamento mais elegante.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-soft)] sm:text-lg">
              Esta versao foi criada para validar atmosfera, hierarquia e contraste da pagina
              inicial. O foco esta em uma presenca mais premium, com mais respiro e menos ruido.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#preview"
                className="button-glow inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:translate-y-[-1px]"
              >
                Ver preview
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white/72 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
              >
                Abrir pagina secundaria
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="glass-panel rounded-3xl border border-white/70 p-4"
                >
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[var(--ink-soft)]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="preview" className="relative">
            <div className="absolute inset-0 rounded-[2.25rem] bg-[linear-gradient(180deg,oklch(1_0_0_/_0.7),oklch(0.93_0.03_24_/_0.45))] blur-2xl" />
            <div className="glass-panel relative overflow-hidden rounded-[2.25rem] border border-white/75 p-5 sm:p-6">
              <div className="rounded-[1.7rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(252,246,241,0.72))] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]/70">
                      Preview da homepage
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                      Direcao em validacao
                    </h2>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Em teste
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {highlights.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.4rem] border border-black/5 bg-white/70 p-4"
                    >
                      <div className="flex gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,oklch(0.95_0.02_24),oklch(0.91_0.03_74))] text-primary">
                          <item.icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,oklch(0.34_0.04_26),oklch(0.58_0.11_24))] p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                    Sensacao esperada
                  </p>
                  <p className="mt-2 text-lg leading-7 text-white/90">
                    Uma pagina inicial mais serena, sofisticada e confiavel, com cor a servico do
                    conteudo e nao do excesso visual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section
          id="destaques"
          className="glass-panel mt-14 grid gap-6 rounded-[2rem] border border-white/70 p-6 lg:grid-cols-[0.82fr_1.18fr] lg:p-8"
        >
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              Destaques
            </p>
            <h2 className="mt-3 text-3xl tracking-[-0.04em] text-foreground">
              Mais respiro, mais clareza, mais acabamento.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
              Esta landing foi pensada para ser uma base de avaliacao visual. O objetivo e medir
              percepcao de qualidade, leitura e impacto geral da nova home.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.8rem] border border-black/5 bg-white/72 p-5">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Cards mais leves</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Transparencia discreta, bordas suaves e sombras comedidas deixam a interface mais
                refinada.
              </p>
            </article>
            <article className="rounded-[1.8rem] border border-black/5 bg-white/72 p-5">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Gradientes sutis</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                A cor aparece em camadas delicadas, evitando a sensacao de tema exagerado ou
                promocional.
              </p>
            </article>
          </div>
        </section>

        <section
          id="como-funciona"
          className="grid gap-6 px-1 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-18"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              Como funciona
            </p>
            <h2 className="mt-3 text-3xl tracking-[-0.04em] text-foreground sm:text-4xl">
              Um fluxo simples para testar ritmo e composicao da pagina.
            </h2>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="glass-panel flex items-start gap-4 rounded-[1.8rem] border border-white/75 p-5"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--blush)] text-sm font-semibold text-primary">
                  0{index + 1}
                </span>
                <p className="text-sm leading-7 text-[var(--ink-soft)] sm:text-base">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel overflow-hidden rounded-[2.3rem] border border-white/75 px-6 py-8 sm:px-8 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
              Validacao visual
            </p>
            <h2 className="mt-3 text-3xl tracking-[-0.04em] text-foreground">
              Se essa direcao funcionar, ela vira a base da nova home.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)] sm:text-base">
              A pagina inicial agora ficou pronta para sincronizar com o GitHub e aparecer no
              Lovable assim que o push entrar no repositorio.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <a
              href="#preview"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-92"
            >
              Revisar preview
            </a>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white/72 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
            >
              Abrir about
            </Link>
          </div>
        </section>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[var(--ink-soft)]">
          <Check className="h-4 w-4 text-primary" />
          Home de teste pronta para validacao no Lovable apos commit e push.
        </div>
      </section>
    </div>
  );
}
