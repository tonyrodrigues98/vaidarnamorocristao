import { createFileRoute } from "@tanstack/react-router";
import { VerificacaoPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/verificacao")({
  head: () => ({ meta: [{ title: "Verificacao | VaiDarNamoro" }] }),
  component: VerificacaoPage,
});
