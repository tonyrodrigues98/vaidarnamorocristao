import { createFileRoute } from "@tanstack/react-router";

import { DecorationAdminPage } from "@/components/admin/DecorationAdminPage";

export const Route = createFileRoute("/admin/auras")({
  component: AdminAurasPage,
});

function AdminAurasPage() {
  return <DecorationAdminPage type="aura" />;
}
