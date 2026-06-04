import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Instagram, Music2, Radio, Users, Youtube } from "lucide-react";

import { Button } from "@/components/ui/button";
import carenHeroAsset from "@/assets/caren-hero.jpeg.asset.json";

const TIKTOK_LIVE_URL = "https://www.tiktok.com/@carenlayane6?_r=1&_t=ZS-96w3ETPtTl3";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Caren | Vai Dar Namoro Cristão" },
      {
        name: "description",
        content:
          "Página oficial da live Vai Dar Namoro Cristão da Caren. Uma comunidade real, feita de pessoas reais.",
      },
      {
        name: "keywords",
        content:
          "Caren, Vai Dar Namoro Cristão, live cristã TikTok, comunidade cristã, relacionamento cristão",
      },
      { property: "og:title", content: "Caren | Vai Dar Namoro Cristão" },
      {
        property: "og:description",
        content:
          "A página oficial da live da Caren no TikTok. Uma comunidade real, feita de pessoas reais.",
      },
      { property: "og:image", content: "https://vaidarnamoro.com/og-image.jpg" },
      { property: "og:url", content: "https://vaidarnamoro.com/" },
      { name: "twitter:title", content: "Caren | Vai Dar Namoro Cristão" },
      {
        name: "twitter:description",
        content: "Página oficial da live Vai Dar Namoro Cristão da Caren.",
      },
      { name: "twitter:image", content: "https://vaidarnamoro.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://vaidarnamoro.com/" }],
  }),
});

function Home() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#0f0f10] font-sans text-white">
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_16%,rgba(255,79,104,0.22),transparent_34%),radial-gradient(circle_at_18%_74%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(145deg,#0f0f10_0%,#151515_48%,#1c1c1f_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.025] shadow-[inset_0_0_90px_rgba(255,255,255,0.05)]" />

        <HeroNav />

        <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center pt-6 lg:pt-0">
          <SocialRail />

          <div className="relative grid min-h-[540px] w-full place-items-center sm:min-h-[calc(100dvh-112px)]">
            <div className="pointer-events-none absolute left-0 top-[16%] hidden w-72 rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-white/85 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#ff5c70]">
                Comunidade ativa
              </p>
              <p className="mt-3 text-lg font-black leading-tight">
                Uma comunidade real, feita de pessoas reais.
              </p>
              <div className="mt-5 flex items-center gap-3 text-xs text-white/60">
                <Users className="h-4 w-4 text-[#ff5c70]" />
                Respeito, fé e diversão
              </div>
            </div>

            <div className="pointer-events-none absolute right-0 top-[20%] hidden w-64 rounded-3xl border border-white/10 bg-black/25 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl xl:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4f68]">
                  <Radio className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black">Todos os dias</p>
                  <p className="text-xs text-white/60">A partir das 23h</p>
                </div>
              </div>
            </div>

            <div className="relative flex w-full max-w-5xl flex-col items-center">
              <CurvedText
                id="welcome-curve"
                text="Seja Bem Vindo"
                className="relative z-30 -mb-8 h-[118px] w-[min(96vw,980px)] sm:-mb-10 sm:h-[150px] lg:-mb-14 lg:h-[190px]"
                textClassName="fill-white text-[78px] font-black uppercase sm:text-[92px] lg:text-[112px]"
                path="M 70 178 Q 600 28 1130 178"
                startOffset="50%"
              />

              <div className="relative z-10 flex h-[46dvh] min-h-[300px] max-h-[420px] w-full max-w-[520px] items-end justify-center sm:h-[58dvh] sm:min-h-[460px] sm:max-h-none lg:h-[66dvh] lg:max-w-[620px]">
                <div className="absolute bottom-8 h-[80%] w-[68%] rounded-t-full bg-gradient-to-b from-white/15 via-white/10 to-white/0 blur-[2px]" />
                <div className="absolute bottom-0 h-[86%] w-[74%] overflow-hidden rounded-t-[48%] border border-white/15 shadow-[0_36px_120px_rgba(0,0,0,0.72)]">
                  <img
                    src={carenHeroAsset.url}
                    alt="Caren"
                    className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f0f10]/70" />
                </div>
                <div className="absolute bottom-0 h-24 w-[92%] rounded-full bg-[#ff4f68]/18 blur-3xl" />
              </div>

              <CurvedText
                id="community-curve"
                text="à nossa comunidade"
                className="relative z-30 -mt-32 h-[118px] w-[min(92vw,760px)] sm:-mt-28 sm:h-[142px] lg:-mt-44"
                textClassName="fill-white text-[35px] font-extrabold tracking-[0.08em] sm:text-[48px] lg:text-[56px]"
                path="M 120 68 Q 600 148 1080 68"
                startOffset="50%"
              />
            </div>
          </div>
        </div>

        <HeroActions />
      </section>
    </main>
  );
}

function HeroNav() {
  return (
    <header className="relative z-40 mx-auto flex w-full max-w-[1440px] items-start justify-between gap-3">
      <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label="Caren">
        <div>
          <div className="font-[cursive] text-3xl italic leading-none text-[#ff5c70] drop-shadow-sm sm:text-4xl">
            Caren
          </div>
          <p className="mt-1 text-[9px] font-bold uppercase leading-[1.1] tracking-[0.2em] text-white/70 sm:text-[10px]">
            Vai Dar
            <br />
            Namoro Cristão
          </p>
        </div>
      </Link>

      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <a
          href={TIKTOK_LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[#ff5c70]/40 bg-[#ff5c70]/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#ff4f68]/10 backdrop-blur-xl transition hover:bg-[#ff5c70]/20 sm:text-xs"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff5c70] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ff5c70]" />
          </span>
          AO VIVO no TikTok
        </a>
        <span className="hidden rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-xl sm:inline-flex">
          Todos os dias a partir das 23h
        </span>
      </div>
    </header>
  );
}

function HeroActions() {
  return (
    <div className="relative z-40 mx-auto -mt-10 flex w-full max-w-[1440px] flex-col gap-4 pb-4 sm:-mt-20 lg:-mt-28 lg:flex-row lg:items-end lg:justify-between">
      <div className="order-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl lg:order-none lg:hidden">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff5c70]">
          Comunidade ativa
        </p>
        <p className="mt-2 text-base font-black leading-tight">
          Uma comunidade real, feita de pessoas reais.
        </p>
      </div>

      <div className="order-2 flex justify-center gap-2 md:hidden">
        <SocialIcon href={TIKTOK_LIVE_URL} label="TikTok da Caren" icon={Music2} />
        <SocialIcon label="Instagram em breve" icon={Instagram} />
        <SocialIcon label="YouTube em breve" icon={Youtube} />
        <SocialIcon to="/auth/signup" label="Comunidade" icon={Heart} />
      </div>

      <div className="order-1 grid grid-cols-2 gap-3 sm:flex sm:flex-row lg:order-none lg:ml-auto">
        <Button
          asChild
          className="col-span-2 h-[52px] rounded-full bg-[#ff4f68] px-6 text-sm font-black text-white shadow-[0_18px_42px_rgba(255,79,104,0.26)] transition hover:bg-[#ff5c70] sm:h-14 sm:px-8"
        >
          <a href={TIKTOK_LIVE_URL} target="_blank" rel="noopener noreferrer">
            Participar da live <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-[52px] rounded-full border-white/15 bg-white/[0.07] px-6 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/10 hover:text-white sm:h-14 sm:px-8"
        >
          <Link to="/auth/login">Entrar</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-[52px] rounded-full border-white/15 bg-white text-sm font-black text-[#111113] transition hover:bg-white/90 sm:h-14 sm:px-8"
        >
          <Link to="/auth/signup">Criar conta</Link>
        </Button>
      </div>
    </div>
  );
}

function SocialRail() {
  const links = [
    {
      label: "TikTok da Caren",
      href: TIKTOK_LIVE_URL,
      icon: Music2,
    },
    {
      label: "Instagram",
      icon: Instagram,
    },
    {
      label: "YouTube",
      icon: Youtube,
    },
    {
      label: "Comunidade",
      href: "/auth/signup",
      icon: Heart,
      internal: true,
    },
  ];

  return (
    <nav
      aria-label="Redes sociais"
      className="absolute right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex"
    >
      {links.map((item) => {
        const Icon = item.icon;
        const className =
          "flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white/80 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#ff5c70]/60 hover:text-white";
        if (item.internal) {
          return (
            <Link key={item.label} to="/auth/signup" className={className} aria-label={item.label}>
              <Icon className="h-4 w-4" />
            </Link>
          );
        }
        if (!item.href) {
          return (
            <span
              key={item.label}
              className={`${className} opacity-70`}
              aria-label={`${item.label} em breve`}
              title={`${item.label} em breve`}
            >
              <Icon className="h-4 w-4" />
            </span>
          );
        }
        return (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            aria-label={item.label}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </nav>
  );
}

function SocialIcon({
  href,
  to,
  label,
  icon: Icon,
}: {
  href?: string;
  to?: "/auth/signup";
  label: string;
  icon: typeof Music2;
}) {
  const className =
    "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/80 backdrop-blur-xl transition hover:border-[#ff5c70]/60 hover:text-white";
  if (to) {
    return (
      <Link to={to} className={className} aria-label={label}>
        <Icon className="h-4 w-4" />
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={label}
      >
        <Icon className="h-4 w-4" />
      </a>
    );
  }
  return (
    <span className={`${className} opacity-70`} aria-label={label} title={label}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

function CurvedText({
  id,
  text,
  className,
  textClassName,
  path,
  startOffset,
}: {
  id: string;
  text: string;
  className: string;
  textClassName: string;
  path: string;
  startOffset: string;
}) {
  return (
    <svg className={className} viewBox="0 0 1200 240" role="img" aria-label={text}>
      <defs>
        <path id={id} d={path} />
      </defs>
      <text className={textClassName} dominantBaseline="middle" textAnchor="middle">
        <textPath href={`#${id}`} startOffset={startOffset}>
          {text}
        </textPath>
      </text>
    </svg>
  );
}
