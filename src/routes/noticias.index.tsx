import { createFileRoute } from "@tanstack/react-router";
import { NoticiasPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/noticias/")({
  head: () => ({ meta: [{ title: "Noticias | VaiDarNamoro" }] }),
  component: NoticiasPage,
});
