import { createFileRoute } from "@tanstack/react-router";
import { LojaPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/loja")({
  head: () => ({ meta: [{ title: "Loja | VaiDarNamoro" }] }),
  component: LojaPage,
});
