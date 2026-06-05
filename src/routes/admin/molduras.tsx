import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/molduras")({
  head: () => ({ meta: [{ title: "Admin Molduras | VaiDarNamoro" }] }),
  component: () => <AdminCatalogPage title="Molduras" kind="molduras" />,
});
