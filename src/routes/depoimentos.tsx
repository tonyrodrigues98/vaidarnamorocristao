import { createFileRoute } from "@tanstack/react-router";
import { StaticInfoPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/depoimentos")({
  head: () => ({ meta: [{ title: "Depoimentos | VaiDarNamoro" }] }),
  component: () => <StaticInfoPage kind="depoimentos" />,
});
