import { createFileRoute } from "@tanstack/react-router";
import { AdminTeamPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/admin/equipe-live")({
  head: () => ({ meta: [{ title: "Admin Equipe Live | VaiDarNamoro" }] }),
  component: AdminTeamPage,
});
