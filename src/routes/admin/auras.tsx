import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/auras")({
  head: () => ({ meta: [{ title: "Admin Auras | VaiDarNamoro" }] }),
  component: () => <AdminCatalogPage title="Auras" kind="auras" />,
});
