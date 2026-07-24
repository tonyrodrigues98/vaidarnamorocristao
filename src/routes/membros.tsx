import { createFileRoute, Navigate } from "@tanstack/react-router";
import { v2FeatureFlags } from "@/v2/platform/feature-flags";

export const Route = createFileRoute("/membros")({
  component: CommunityMembersAlias,
  head: () => ({
    meta: [
      { title: "Pessoas da comunidade — Vai Dar Namoro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function CommunityMembersAlias() {
  if (v2FeatureFlags.appShell && v2FeatureFlags.community) {
    return <Navigate to="/v2/$section" params={{ section: "explorar-pessoas" }} replace />;
  }
  return <Navigate to="/inicio" replace />;
}
