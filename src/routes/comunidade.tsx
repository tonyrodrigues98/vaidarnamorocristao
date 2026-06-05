import { createFileRoute } from "@tanstack/react-router";
import { ComunidadePage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade | VaiDarNamoro" }] }),
  component: ComunidadePage,
});
