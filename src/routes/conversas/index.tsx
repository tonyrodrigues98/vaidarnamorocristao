import { createFileRoute } from "@tanstack/react-router";
import { ConversasPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/conversas/")({
  head: () => ({ meta: [{ title: "Conversas | VaiDarNamoro" }] }),
  component: ConversasPage,
});
