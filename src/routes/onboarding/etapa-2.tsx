import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/onboarding/etapa-2")({
  head: () => ({ meta: [{ title: "Onboarding etapa 2 | VaiDarNamoro" }] }),
  component: () => <OnboardingPage step={2} />,
});
