import { createFileRoute } from "@tanstack/react-router";
import { RecadosPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/recados")({
  head: () => ({ meta: [{ title: "Recados | VaiDarNamoro" }] }),
  component: RecadosPage,
});
