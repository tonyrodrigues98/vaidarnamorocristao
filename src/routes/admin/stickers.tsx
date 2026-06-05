import { createFileRoute } from "@tanstack/react-router";
import { AdminCatalogPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/stickers")({
  head: () => ({ meta: [{ title: "Admin Stickers | VaiDarNamoro" }] }),
  component: () => <AdminCatalogPage title="Stickers" kind="stickers" />,
});
