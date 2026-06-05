import { createFileRoute } from "@tanstack/react-router";
import { PretendenteProfilePage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/pretendentes/$id")({
  head: () => ({ meta: [{ title: "Perfil publico | VaiDarNamoro" }] }),
  component: PretendenteRoute,
});

function PretendenteRoute() {
  const { id } = Route.useParams();
  return <PretendenteProfilePage id={id} />;
}
