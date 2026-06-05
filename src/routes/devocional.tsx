import { createFileRoute } from "@tanstack/react-router";
import { DevocionalPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/devocional")({
  head: () => ({ meta: [{ title: "Devocional | VaiDarNamoro" }] }),
  component: DevocionalPage,
});
