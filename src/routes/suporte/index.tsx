import { createFileRoute } from "@tanstack/react-router";
import { SuportePage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/suporte/")({
  head: () => ({ meta: [{ title: "Suporte | VaiDarNamoro" }] }),
  component: SuportePage,
});
