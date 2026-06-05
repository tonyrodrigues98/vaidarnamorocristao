import { createFileRoute } from "@tanstack/react-router";
import { PropositoPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/proposito/$matchId")({
  head: () => ({ meta: [{ title: "Proposito Firmado | VaiDarNamoro" }] }),
  component: PropositoRoute,
});

function PropositoRoute() {
  const { matchId } = Route.useParams();
  return <PropositoPage id={matchId} />;
}
