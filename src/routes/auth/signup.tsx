import { createFileRoute } from "@tanstack/react-router";
import { SignupPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Cadastro | VaiDarNamoro" }] }),
  component: SignupPage,
});
