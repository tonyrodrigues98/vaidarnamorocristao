import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CarenLiveHero, TIKTOK_LIVE_URL } from "@/components/home/CarenLiveHero";
import { CommunityAcquisitionLanding } from "@/components/home/CommunityAcquisitionLanding";
import { PublicNav } from "@/components/PublicNav";
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

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Vai Dar Namoro — Comunidade cristã para caminhar junto" },
      {
        name: "description",
        content:
          "Comunidade cristã para fé, amizades, conteúdo, conversas e experiências compartilhadas. Conheça também a live da Caren e o Modo Namoro opcional.",
      },
      {
        name: "keywords",
        content:
          "comunidade cristã, fé, amizades cristãs, Caren, live cristã TikTok, Vai Dar Namoro Cristão",
      },
      { property: "og:title", content: "Vai Dar Namoro — Comunidade cristã para caminhar junto" },
      {
        property: "og:description",
        content:
          "Uma comunidade cristã para fé, amizades, conteúdo e experiências compartilhadas. Namoro é uma área opcional.",
      },
      { property: "og:image", content: "https://vaidarnamoro.com/og-image.jpg" },
      { property: "og:url", content: "https://vaidarnamoro.com/" },
      { name: "twitter:title", content: "Vai Dar Namoro — Comunidade cristã" },
      {
        name: "twitter:description",
        content: "Comunidade cristã para fé, amizades, conteúdo e experiências compartilhadas.",
      },
      { name: "twitter:image", content: "https://vaidarnamoro.com/og-image.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://vaidarnamoro.com/" },
      { rel: "me", href: TIKTOK_LIVE_URL },
    ],
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
    <>
      <PublicNav />
      <main className="min-h-dvh overflow-hidden bg-[#0f0f10] font-sans text-white">
        <CommunityAcquisitionLanding />
        <CarenLiveHero embedded />
        <LiveHowItWorksSection />
        <LiveTeamSection members={members} />
        <LiveParticipationSection />
        <LiveMonthlyTop3Section highlights={highlights} />
        <CommunityPlatformSection />
        <LiveFaqSection />
        <FinalLiveCtaSection />
      </main>
    </>
  );
}
