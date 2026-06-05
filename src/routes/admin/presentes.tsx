import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/presentes")({
  head: () => ({ meta: [{ title: "Admin Presentes | VaiDarNamoro" }] }),
  component: () => <AdminCatalogPage title="Presentes" kind="presentes" />,
});
