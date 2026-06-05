import { createFileRoute } from "@tanstack/react-router";
import { BloqueadosPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/bloqueados")({
  head: () => ({ meta: [{ title: "Bloqueados | VaiDarNamoro" }] }),
  component: BloqueadosPage,
});
