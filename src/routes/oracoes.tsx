import { createFileRoute } from "@tanstack/react-router";
import { OracoesPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/oracoes")({
  head: () => ({ meta: [{ title: "Oracoes | VaiDarNamoro" }] }),
  component: OracoesPage,
});
