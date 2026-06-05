import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Heart,
  Radio,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { COMMUNITY_AUTH_ROUTE, TIKTOK_LIVE_URL } from "@/components/home/CarenLiveHero";
import {
  LIVE_HIGHLIGHT_TYPE_LABELS,
  LIVE_HIGHLIGHT_TYPES,
  type LiveHighlightType,
  type LiveMonthlyHighlight,
} from "@/lib/liveTeam";

const sectionShell = "relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24";
const glassCard =
  "rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-black/30 backdrop-blur-xl";

export function LiveHowItWorksSection() {
  const steps = [
    {
      icon: Radio,
      eyebrow: "Primeiro passo",
      title: "Entre na live",
      text: "Acompanhe a Caren no TikTok e participe da comunidade ao vivo.",
    },
    {
      icon: Users,
      eyebrow: "Comunidade junto",
      title: "Ajude nas batalhas",
      text: "As batalhas ajudam a live crescer, alcançar mais pessoas e manter a comunidade em movimento.",
    },
    {
      icon: Clock,
      eyebrow: "A partir das 01h",
      title: "Começa o quadro",
      text: "A partir das 01h, começa o Vai Dar Namoro, com participações, apresentações e conexões ao vivo.",
    },
  ];

  return (
    <section className={sectionShell}>
      <SectionGlow />
      <SectionHeader
        eyebrow="Live da Caren"
        title="Como funciona a live"
        subtitle="Primeiro a comunidade se reúne, participa das batalhas e fortalece a live. A partir das 01h, começa o quadro Vai Dar Namoro."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={`${glassCard} group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-[#ff5c70]/35 hover:bg-white/[0.075]`}
          >
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5c70]/70 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff4f68]/15 text-[#ff5c70] ring-1 ring-[#ff5c70]/25">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="text-5xl font-black text-white/[0.045]">0{index + 1}</span>
            </div>
            <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-[#ff7a8c]">
              {step.eyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/64">{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LiveParticipationSection() {
  const steps = ["Estar na live durante o quadro", "Solicitar para subir", "Cumprir os requisitos"];
  const requirements = [
    "Maior de idade",
    "Cristão praticante",
    "Solteiro",
    "Viúvo",
    "Divorciado",
    "Solicite para subir",
  ];

  return (
    <section className={sectionShell}>
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ff5c70]">
            Quadro ao vivo
          </p>
          <h2 className="mt-4 max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-5xl">
            Como participar do quadro
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
            Durante o Vai Dar Namoro, basta estar na live, solicitar para subir na janelinha e
            cumprir os requisitos da comunidade.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#ff5c70]/25 bg-[#ff4f68]/10 px-4 py-2 text-sm font-bold text-white">
            <Clock className="h-4 w-4 text-[#ff7a8c]" />
            Destaque do quadro a partir das 01h
          </div>
        </div>

        <div className={`${glassCard} relative overflow-hidden p-5 sm:p-7`}>
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#ff4f68]/18 blur-3xl" />
          <div className="relative grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex gap-4 rounded-3xl border border-white/10 bg-black/25 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#111113]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-black text-white">{step}</p>
                  <p className="mt-1 text-xs leading-5 text-white/58">
                    Um roteiro simples para manter a live organizada e acolhedora.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-6 flex flex-wrap gap-2">
            {requirements.map((requirement) => (
              <span
                key={requirement}
                className="rounded-full border border-white/12 bg-white/[0.075] px-3 py-2 text-xs font-bold text-white/82 backdrop-blur"
              >
                {requirement}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LiveMonthlyTop3Section({ highlights }: { highlights: LiveMonthlyHighlight[] }) {
  return (
    <section className={sectionShell}>
      <SectionHeader
        eyebrow="Comunidade em destaque"
        title="Top 3 do mês"
        subtitle="Destaques da comunidade que mais fortaleceram a live neste mês."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {LIVE_HIGHLIGHT_TYPES.map((type) => (
          <RankingPanel
            key={type}
            type={type}
            items={highlights.filter((h) => h.ranking_type === type)}
          />
        ))}
      </div>
    </section>
  );
}

function RankingPanel({ type, items }: { type: LiveHighlightType; items: LiveMonthlyHighlight[] }) {
  const ordered = [...items].sort((a, b) => a.position - b.position).slice(0, 3);
  const icon = type === "viewer" ? Users : Trophy;
  const Icon = icon;

  return (
    <div className={`${glassCard} overflow-hidden p-5 sm:p-6`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff4f68]/16 text-[#ff6d80] ring-1 ring-[#ff5c70]/25">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-black text-white">{LIVE_HIGHLIGHT_TYPE_LABELS[type]}</h3>
            <p className="text-xs text-white/80">Top 3 do mês atual</p>
          </div>
        </div>
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/12 bg-black/20 p-8 text-center">
          <Star className="mx-auto h-8 w-8 text-[#ff5c70]" />
          <p className="mt-3 text-sm font-bold text-white">Destaques em breve</p>
          <p className="mt-1 text-xs text-white/52">
            Cadastre o Top 3 no admin para esta área aparecer completa.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((item) => (
            <MonthlyHighlightRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthlyHighlightRow({ item }: { item: LiveMonthlyHighlight }) {
  const isFirst = item.position === 1;

  return (
    <div
      className={`group flex items-center gap-4 rounded-3xl border p-3 transition hover:-translate-y-0.5 ${
        isFirst
          ? "border-[#ff5c70]/35 bg-[#ff4f68]/12"
          : "border-white/10 bg-white/[0.045] hover:bg-white/[0.065]"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/35 text-lg font-black text-white ring-1 ring-white/10">
        {item.position}
      </div>
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/16 bg-white/10">
        {item.photo_url ? (
          <img
            src={item.photo_url}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-black text-white/60">
            {item.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-black text-white">{item.name}</p>
        {item.chip_text && (
          <p className="mt-1 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/72">
            {item.chip_text}
          </p>
        )}
      </div>
      {item.tiktok_url && (
        <a
          href={item.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir TikTok de ${item.name}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#111113] transition hover:bg-[#ff5c70] hover:text-white"
        >
          <Sparkles className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

export function CommunityPlatformSection() {
  const items = [
    "Criar perfil",
    "Conversar com a comunidade",
    "Conhecer pessoas",
    "Fazer parte além da live",
  ];

  return (
    <section className={sectionShell}>
      <div className={`${glassCard} relative overflow-hidden p-6 sm:p-8 lg:p-10`}>
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-[#ff4f68]/12 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ff5c70]">
              Além da live
            </p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">
              A comunidade continua na plataforma
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/68">
              A live acontece no TikTok, mas dentro do Vai Dar Namoro Cristão você pode criar seu
              perfil, participar da comunidade e conhecer pessoas com o mesmo propósito.
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-full bg-white px-6 text-sm font-black text-[#111113] hover:bg-white/90"
            >
              <Link to={COMMUNITY_AUTH_ROUTE}>
                Acessar comunidade <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/24 p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-[#ff6d80]" />
                <span className="text-sm font-bold text-white/82">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LiveFaqSection() {
  const questions = [
    {
      q: "Preciso pagar para participar?",
      a: "Não. Para participar do quadro, basta estar na live, cumprir os requisitos e solicitar para subir.",
    },
    {
      q: "Preciso ser de uma igreja específica?",
      a: "Não. A comunidade recebe cristãos de diferentes igrejas e congregações, desde que participem com respeito.",
    },
    {
      q: "Posso participar sendo de outro lugar?",
      a: "Sim. Pode ser de qualquer lugar do mundo. O importante é estar na live e participar com respeito.",
    },
    {
      q: "Divorciados podem participar?",
      a: "Sim. Solteiros, viúvos e divorciados podem participar, desde que cumpram os requisitos da comunidade.",
    },
    {
      q: "Como entro na plataforma?",
      a: "Use o botão ‘Acessar comunidade’ para entrar ou criar sua conta no Vai Dar Namoro Cristão.",
    },
    {
      q: "Que horas começa o quadro Vai Dar Namoro?",
      a: "O quadro começa todos os dias a partir das 01h.",
    },
    {
      q: "Como faço para subir na live?",
      a: "Durante o quadro, basta solicitar para subir e cumprir os requisitos: ser maior de idade, cristão praticante, solteiro, viúvo ou divorciado.",
    },
  ];

  return (
    <section className={sectionShell}>
      <SectionHeader
        eyebrow="Dúvidas rápidas"
        title="Perguntas frequentes"
        subtitle="Algumas respostas rápidas para quem quer participar da live ou entrar na comunidade."
      />

      <Accordion type="single" collapsible className="mx-auto mt-10 max-w-4xl space-y-3">
        {questions.map((item, index) => (
          <AccordionItem
            key={item.q}
            value={`faq-${index}`}
            className="rounded-3xl border border-white/10 bg-white/[0.055] px-5 backdrop-blur-xl"
          >
            <AccordionTrigger className="text-left text-base font-black text-white hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-6 text-white/64">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

export function FinalLiveCtaSection() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28">
      <div className={`${glassCard} relative overflow-hidden p-7 text-center sm:p-10 lg:p-14`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,79,104,0.2),transparent_58%)]" />
        <div className="relative mx-auto max-w-3xl">
          <Crown className="mx-auto h-10 w-10 text-[#ff5c70]" />
          <h2 className="mt-5 text-4xl font-black leading-none text-white sm:text-5xl">
            Pronto para fazer parte da comunidade?
          </h2>
          <p className="mt-5 text-base leading-7 text-white/68">
            Entre na live da Caren ou acesse a plataforma Vai Dar Namoro Cristão para continuar
            participando da comunidade.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-12 rounded-full bg-[#ff4f68] px-6 text-sm font-black text-white hover:bg-[#ff5c70]"
            >
              <a href={TIKTOK_LIVE_URL} target="_blank" rel="noopener noreferrer">
                Participar da live <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-white/18 bg-white/8 px-6 text-sm font-black text-white hover:bg-white/14"
            >
              <Link to={COMMUNITY_AUTH_ROUTE}>Acessar comunidade</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ff5c70]">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-white/64">{subtitle}</p>
    </div>
  );
}

function SectionGlow() {
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-[#ff4f68]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </>
  );
}
