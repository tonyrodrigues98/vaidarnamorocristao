import { createFileRoute } from "@tanstack/react-router";

import { DecorationAdminPage } from "@/components/admin/DecorationAdminPage";

export const Route = createFileRoute("/admin/molduras")({
  component: AdminMoldurasPage,
});

function AdminMoldurasPage() {
  return <DecorationAdminPage type="frame" />;
}
