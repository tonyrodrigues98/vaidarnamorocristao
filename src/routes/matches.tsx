import { createFileRoute } from "@tanstack/react-router";
import { MatchesPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/matches")({
  head: () => ({ meta: [{ title: "Matches | VaiDarNamoro" }] }),
  component: MatchesPage,
});
