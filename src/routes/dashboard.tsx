import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | VaiDarNamoro" }] }),
  component: DashboardPage,
});
