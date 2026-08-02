import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CarenLiveHero, TIKTOK_LIVE_URL } from "@/components/home/CarenLiveHero";
import {
  CommunityPlatformSection,
  FinalLiveCtaSection,
  LiveFaqSection,
  LiveHowItWorksSection,
  LiveMonthlyTop3Section,
  LiveParticipationSection,
} from "@/components/home/LiveHomeSections";
import { LiveTeamSection } from "@/components/home/LiveTeamSection";
import {
  fetchActiveLiveTeamMembers,
  fetchActiveMonthlyHighlights,
  type LiveMonthlyHighlight,
  type LiveTeamMember,
} from "@/lib/liveTeam";
import { liveHomeMetadata } from "@/config/route-metadata";
import { PublicShell } from "@/components/shells/PublicShell";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    ...liveHomeMetadata,
    links: [...(liveHomeMetadata.links ?? []), { rel: "me", href: TIKTOK_LIVE_URL }],
  }),
});

function Home() {
  const [members, setMembers] = useState<LiveTeamMember[]>([]);
  const [highlights, setHighlights] = useState<LiveMonthlyHighlight[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([fetchActiveLiveTeamMembers(), fetchActiveMonthlyHighlights()])
      .then(([teamResult, highlightsResult]) => {
        if (!mounted) return;
        setMembers(teamResult.status === "fulfilled" ? teamResult.value : []);
        setHighlights(highlightsResult.status === "fulfilled" ? highlightsResult.value : []);
      })
      .catch(() => {
        if (!mounted) return;
        setMembers([]);
        setHighlights([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PublicShell>
      <main className="min-h-dvh overflow-hidden bg-[#0f0f10] font-sans text-white">
        <section className="mx-auto max-w-6xl px-6 py-16 text-center md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--rose)]">
            Comunidade cristã 18+
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Um lugar para pertencer, conversar e viver boas experiências com pessoas que
            compartilham seus valores.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/70">
            Comunidade, Devocional, Orações, Pets, Arcade, personalização e conversas em um só
            espaço. O modo de relacionamento é opcional.
          </p>
        </section>
        <CommunityPlatformSection />
        <CarenLiveHero />
        <LiveHowItWorksSection />
        <LiveTeamSection members={members} />
        <LiveParticipationSection />
        <LiveMonthlyTop3Section highlights={highlights} />
        <LiveFaqSection />
        <FinalLiveCtaSection />
      </main>
    </PublicShell>
  );
}
