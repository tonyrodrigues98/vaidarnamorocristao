import { createFileRoute } from "@tanstack/react-router";
import { StaticInfoPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/sobre")({
  head: () => ({ meta: [{ title: "Sobre | VaiDarNamoro" }] }),
  component: () => <StaticInfoPage kind="sobre" />,
});
