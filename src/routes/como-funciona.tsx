import { createFileRoute } from "@tanstack/react-router";
import { StaticInfoPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({ meta: [{ title: "Como funciona | VaiDarNamoro" }] }),
  component: () => <StaticInfoPage kind="como" />,
});
