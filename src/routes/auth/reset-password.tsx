import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha | VaiDarNamoro" }] }),
  component: ResetPasswordPage,
});
