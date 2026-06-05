import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha | VaiDarNamoro" }] }),
  component: ForgotPasswordPage,
});
