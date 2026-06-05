import { createFileRoute } from "@tanstack/react-router";
import { StaticInfoPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/manual")({
  head: () => ({ meta: [{ title: "Manual | VaiDarNamoro" }] }),
  component: () => <StaticInfoPage kind="manual" />,
});
