import { createFileRoute } from "@tanstack/react-router";
import { StaticInfoPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos | VaiDarNamoro" }] }),
  component: () => <StaticInfoPage kind="termos" />,
});
