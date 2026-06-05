import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Login | VaiDarNamoro" }] }),
  component: LoginPage,
});
