import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/fundos")({
  head: () => ({ meta: [{ title: "Admin Fundos | VaiDarNamoro" }] }),
  component: () => <AdminCatalogPage title="Fundos premium" kind="fundos" />,
});
