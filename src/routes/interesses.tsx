import { createFileRoute } from "@tanstack/react-router";
import { InteressesPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/interesses")({
  head: () => ({ meta: [{ title: "Interesses | VaiDarNamoro" }] }),
  component: InteressesPage,
});
