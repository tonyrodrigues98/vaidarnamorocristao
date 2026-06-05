import { createFileRoute } from "@tanstack/react-router";
import { AdminVerificationPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/verificacoes")({
  head: () => ({ meta: [{ title: "Admin Verificacoes | VaiDarNamoro" }] }),
  component: () => <AdminVerificationPage title="Verificacoes" kind="verificacoes" />,
});
