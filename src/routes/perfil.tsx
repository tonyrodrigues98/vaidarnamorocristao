import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil | VaiDarNamoro" }] }),
  component: PerfilPage,
});
