import { createFileRoute } from "@tanstack/react-router";
import { InicioPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/inicio")({
  head: () => ({ meta: [{ title: "Inicio | VaiDarNamoro" }] }),
  component: InicioPage,
});
