import { createFileRoute } from "@tanstack/react-router";
import { PresentesPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/presentes/")({
  head: () => ({ meta: [{ title: "Presentes | VaiDarNamoro" }] }),
  component: PresentesPage,
});
