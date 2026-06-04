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
    <main className="min-h-dvh overflow-hidden bg-[#0f0f10] font-sans text-white">
      <CarenLiveHero />
      <LiveHowItWorksSection />
      <LiveTeamSection members={members} />
      <LiveParticipationSection />
      <LiveMonthlyTop3Section highlights={highlights} />
      <CommunityPlatformSection />
      <LiveFaqSection />
      <FinalLiveCtaSection />
    </main>
  );
}
