import { createFileRoute } from "@tanstack/react-router";
import { ContaPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/conta")({
  head: () => ({ meta: [{ title: "Conta | VaiDarNamoro" }] }),
  component: ContaPage,
});
