import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Heart, Music2, Radio } from "lucide-react";

import { Button } from "@/components/ui/button";
import carenHeroAsset from "@/assets/caren-hero.jpeg.asset.json";

export const TIKTOK_LIVE_URL = "https://www.tiktok.com/@carenlayane6?_r=1&_t=ZS-96w3ETPtTl3";
export const COMMUNITY_AUTH_ROUTE = "/inicio";

export function CarenLiveHero() {
  return (
    <section className="relative isolate flex min-h-dvh flex-col overflow-hidden px-4 pb-8 pt-24 sm:px-6 lg:px-10">
      <img
        src={carenHeroAsset.url}
        alt="Caren"
        className="pointer-events-none absolute inset-0 -z-30 h-full w-full object-cover object-[50%_30%] sm:object-[50%_25%]"
        loading="eager"
      />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.45)_72%,rgba(0,0,0,0.9)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b from-black/45 via-black/10 to-black/78" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black via-black/45 to-transparent" />

      <LiveTopNav />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center pt-4 lg:pt-0">
        <div className="relative grid min-h-[540px] w-full place-items-center sm:min-h-[calc(100dvh-128px)]">
          <div className="pointer-events-none absolute left-0 top-[16%] hidden w-72 rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-white/85 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#ff5c70]">
              Comunidade ativa
            </p>
            <p className="mt-3 text-lg font-black leading-tight">
              Uma comunidade real, feita de pessoas reais.
            </p>
            <div className="mt-5 flex items-center gap-3 text-xs text-white/60">
              <Heart className="h-4 w-4 text-[#ff5c70]" />
              Respeito, fé e diversão
            </div>
          </div>

          <div className="absolute right-0 top-[18%] hidden w-72 space-y-3 xl:block">
            <ScheduleCard
              icon={Radio}
              title="Live no TikTok"
              detail="A partir das 23h"
              tone="rose"
            />
            <ScheduleCard
              icon={Heart}
              title="Quadro Vai Dar Namoro"
              detail="A partir das 01h"
              tone="dark"
            />
          </div>

          <div className="relative flex w-full max-w-5xl flex-col items-center">
            <CurvedText
              id="welcome-curve"
              text="Seja Bem Vindo"
              className="relative z-30 h-[16vw] min-h-[110px] w-[80vw] max-w-[1400px] drop-shadow-[0_6px_20px_rgba(0,0,0,0.75)] sm:h-[14vw] lg:h-[12vw]"
              textClassName="fill-white text-[128px] font-black uppercase tracking-tight"
              path="M 20 200 Q 600 40 1180 200"
              startOffset="50%"
            />

            <div className="h-[46dvh] min-h-[300px] sm:h-[58dvh] sm:min-h-[460px] lg:h-[60dvh]" />

            <CurvedText
              id="community-curve"
              text="à nossa comunidade"
              className="relative z-30 h-[10vw] min-h-[70px] w-[60vw] max-w-[1050px] drop-shadow-[0_6px_20px_rgba(0,0,0,0.75)] sm:h-[9vw] lg:h-[8vw]"
              textClassName="fill-white text-[72px] font-semibold tracking-[0.02em]"
              path="M 20 80 Q 600 180 1180 80"
              startOffset="50%"
            />
          </div>
        </div>
      </div>

      <div className="relative z-40 mx-auto mt-3 flex w-full max-w-[1440px] flex-col gap-4 sm:mt-0 lg:absolute lg:inset-x-10 lg:top-[calc(100vh-116px)] lg:mx-0 lg:w-auto lg:max-w-none lg:flex-row lg:items-end lg:justify-between">
        <TikTokLiveButton />

        <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
          <ScheduleCard icon={Radio} title="Live no TikTok" detail="A partir das 23h" tone="rose" />
          <ScheduleCard
            icon={Clock}
            title="Quadro Vai Dar Namoro"
            detail="A partir das 01h"
            tone="dark"
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl lg:hidden">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff5c70]">
            Comunidade ativa
          </p>
          <p className="mt-2 text-base font-black leading-tight">
            Uma comunidade real, feita de pessoas reais.
          </p>
        </div>
      </div>
    </section>
  );
}

function LiveTopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0f0f10]/88 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label="Caren">
          <div>
            <div className="font-[cursive] text-3xl italic leading-none text-[#ff5c70] drop-shadow-sm sm:text-4xl">
              Caren
            </div>
            <p className="mt-0.5 text-[8px] font-bold uppercase leading-[1.1] tracking-[0.2em] text-white/70 sm:text-[10px]">
              Vai Dar
              <br />
              Namoro Cristão
            </p>
          </div>
        </Link>

        <Button
          asChild
          className="h-11 rounded-full border border-white/15 bg-white px-4 text-xs font-black text-[#111113] shadow-[0_14px_36px_rgba(255,255,255,0.08)] transition hover:bg-white/90 sm:px-6 sm:text-sm"
        >
          <Link to={COMMUNITY_AUTH_ROUTE}>Acessar comunidade</Link>
        </Button>
      </div>
    </header>
  );
}

function TikTokLiveButton() {
  return (
    <div className="lg:ml-auto">
      <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white/85 lg:text-right">
        Acompanhe no TikTok
      </p>
      <Button
        asChild
        className="h-[56px] w-full rounded-full border border-[#ff5c70]/35 bg-[#ff4f68] px-7 text-sm font-black text-white shadow-[0_18px_42px_rgba(255,79,104,0.26)] transition hover:bg-[#ff5c70] sm:w-auto sm:px-9"
      >
        <a href={TIKTOK_LIVE_URL} target="_blank" rel="noopener noreferrer">
          <TikTokGlyph className="mr-2 h-5 w-5" />
          Participar da live
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

function ScheduleCard({
  icon: Icon,
  title,
  detail,
  tone,
}: {
  icon: typeof Radio;
  title: string;
  detail: string;
  tone: "rose" | "dark";
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/28 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
            tone === "rose" ? "bg-[#ff4f68]" : "bg-white/10"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="text-xs font-semibold text-white/62">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.6 3c.3 2.2 1.7 3.8 4 4v3.2c-1.5.1-2.9-.4-4-1.2v5.9c0 3.4-2.4 6.1-6.1 6.1-3.2 0-5.5-2.2-5.5-5.2 0-3.1 2.4-5.4 5.7-5.4.4 0 .7 0 1 .1v3.4c-.3-.1-.6-.2-1-.2-1.3 0-2.2.8-2.2 2 0 1.1.8 1.9 2 1.9 1.4 0 2.2-.8 2.2-2.5V3h3.9Z" />
    </svg>
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
    <svg
      className={className}
      viewBox="0 0 1200 240"
      role="img"
      aria-label={text}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
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
