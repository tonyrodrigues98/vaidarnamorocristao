import { createFileRoute } from "@tanstack/react-router";
import { AdminVerificationPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/fotos")({
  head: () => ({ meta: [{ title: "Admin Fotos | VaiDarNamoro" }] }),
  component: () => <AdminVerificationPage title="Analise de fotos" kind="fotos" />,
});
