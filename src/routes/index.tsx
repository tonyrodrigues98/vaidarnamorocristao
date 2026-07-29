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
