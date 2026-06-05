import { createFileRoute } from "@tanstack/react-router";
import { AjudaPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/suporte/ajuda")({
  head: () => ({ meta: [{ title: "Ajuda | VaiDarNamoro" }] }),
  component: AjudaPage,
});
