import { createFileRoute } from "@tanstack/react-router";
import { ConversaDetailPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/conversas/$matchId")({
  head: () => ({ meta: [{ title: "Chat | VaiDarNamoro" }] }),
  component: ConversaRoute,
});

function ConversaRoute() {
  const { matchId } = Route.useParams();
  return <ConversaDetailPage id={matchId} />;
}
