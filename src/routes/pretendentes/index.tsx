import { createFileRoute } from "@tanstack/react-router";
import { PretendentesPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/pretendentes/")({
  head: () => ({ meta: [{ title: "Pretendentes | VaiDarNamoro" }] }),
  component: PretendentesPage,
});
