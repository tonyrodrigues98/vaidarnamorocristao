import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  HeartHandshake,
  MessageCircleMore,
  Radio,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  CAREN_TIKTOK_LIVE_URL,
  PUBLIC_COMMUNITY_ROUTE,
  PUBLIC_SIGNUP_ROUTE,
} from "@/lib/publicAcquisition";

const communityPillars = [
  {
    icon: UsersRound,
    title: "Pessoas e comunidade",
    description:
      "Conheça pessoas pela fé, interesses e participação — sem presumir disponibilidade romântica.",
  },
  {
    icon: MessageCircleMore,
    title: "Conversas com contexto",
    description:
      "Acompanhe reflexões, atividades e conversas em espaços pensados para convivência respeitosa.",
  },
  {
    icon: BookOpenText,
    title: "Fé que vira encontro",
    description:
      "Devocionais, oração e conteúdo cristão ajudam a comunidade a caminhar e aprender em conjunto.",
  },
  {
    icon: CalendarDays,
    title: "Experiências compartilhadas",
    description:
      "Lives, eventos e novas experiências sociais conectam a comunidade dentro e fora da plataforma.",
  },
] as const;

export function CommunityAcquisitionLanding() {
  return (
    <div id="conteudo-publico" className="bg-[#f7f7f5] text-[#201a2e]">
      <section className="relative isolate overflow-hidden px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 12% 18%, rgba(124,58,237,.13), transparent 31rem), radial-gradient(circle at 88% 10%, rgba(255,79,104,.12), transparent 28rem)",
          }}
        />
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-800 shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Comunidade cristã para a vida real
            </p>
            <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-[#21192f] sm:text-5xl md:text-6xl lg:text-7xl">
              Um lugar para viver a fé, criar vínculos e caminhar junto.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#625a6e] sm:text-lg sm:leading-8">
              O Vai Dar Namoro Cristão está se tornando uma plataforma comunitária completa.
              Participe por amizade, conteúdo, conversas e experiências compartilhadas. Se quiser, o
              Namoro continua disponível como uma área separada e opcional.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to={PUBLIC_COMMUNITY_ROUTE}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#5b21b6] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(91,33,182,.2)] transition hover:bg-[#4c1d95] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
              >
                Acessar comunidade
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to={PUBLIC_SIGNUP_ROUTE}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8d2df] bg-white px-6 py-3 text-sm font-semibold text-[#382d49] shadow-sm transition hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
              >
                Criar minha conta
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#756d80]">
              Participar da comunidade não ativa o Modo Namoro.
            </p>
          </div>

          <CommunityPreview />
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 md:pb-28" aria-labelledby="community-pillars-title">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              Muito além de uma finalidade
            </p>
            <h2
              id="community-pillars-title"
              className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-4xl"
            >
              Entre para pertencer, não para se declarar disponível.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#6a6274]">
              Sua participação social e sua disponibilidade romântica são estados independentes.
              Pessoas solteiras, comprometidas ou sem interesse em namoro continuam fazendo parte da
              comunidade.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {communityPillars.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[1.75rem] border border-[#e5e0e9] bg-white p-6 shadow-[0_18px_50px_rgba(47,35,64,.06)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#71697b]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7e2e9] bg-white px-5 py-16 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c93656]">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Live da Caren
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              A comunidade também se encontra ao vivo.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6a6274]">
              A live e o quadro Vai Dar Namoro continuam preservados. Participe no TikTok ou conheça
              abaixo a equipe, os horários e a dinâmica atual.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={CAREN_TIKTOK_LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff4f68] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e83f59] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
            >
              Participar da live
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#experiencia-live"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8d2df] bg-white px-6 py-3 text-sm font-semibold text-[#382d49] transition hover:bg-[#f7f5f9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
            >
              Conhecer a experiência
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CommunityPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-label="Visão da futura comunidade">
      <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-violet-200/55 to-rose-100/70 blur-2xl" />
      <div className="overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-[0_28px_80px_rgba(50,35,70,.16)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-[#eee9f1] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
              Hoje na comunidade
            </p>
            <p className="mt-1 font-semibold">Encontros que fazem sentido</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-violet-800">
            <UsersRound className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        <div className="space-y-4 p-5">
          <PreviewCard
            icon={BookOpenText}
            label="Reflexão"
            title="Como acolher sem tentar resolver tudo?"
            meta="Conversa comunitária · leitura de 4 min"
          />
          <PreviewCard
            icon={CalendarDays}
            label="Evento"
            title="Noite de oração e música"
            meta="Sexta, 20h · encontro online"
          />
          <div className="grid grid-cols-2 gap-3">
            <PreviewMetric icon={ShieldCheck} value="Ambiente cuidado" />
            <PreviewMetric icon={HeartHandshake} value="Namoro opcional" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  label,
  title,
  meta,
}: {
  icon: typeof BookOpenText;
  label: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="rounded-3xl border border-[#ebe6ef] bg-[#faf9fb] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-800 shadow-sm">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c93656]">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold leading-5">{title}</p>
          <p className="mt-2 text-xs leading-5 text-[#786f82]">{meta}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewMetric({ icon: Icon, value }: { icon: typeof ShieldCheck; value: string }) {
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-3xl bg-[#2d174f] p-4 text-white">
      <Icon className="h-5 w-5 text-violet-200" aria-hidden="true" />
      <span className="text-xs font-medium leading-5 text-white/85">{value}</span>
    </div>
  );
}
