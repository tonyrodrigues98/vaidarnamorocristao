import { createFileRoute } from "@tanstack/react-router";
import { AdminHomePage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin | VaiDarNamoro" }] }),
  component: AdminHomePage,
});
