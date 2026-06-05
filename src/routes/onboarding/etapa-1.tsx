import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/onboarding/etapa-1")({
  head: () => ({ meta: [{ title: "Onboarding etapa 1 | VaiDarNamoro" }] }),
  component: () => <OnboardingPage step={1} />,
});
