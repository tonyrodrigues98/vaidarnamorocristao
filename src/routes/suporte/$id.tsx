import { createFileRoute } from "@tanstack/react-router";
import { TicketPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/suporte/$id")({
  head: () => ({ meta: [{ title: "Ticket | VaiDarNamoro" }] }),
  component: TicketRoute,
});

function TicketRoute() {
  const { id } = Route.useParams();
  return <TicketPage id={id} />;
}
