import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * Legacy route. The full onboarding now lives at /onboarding and is
 * controlled internally by step state, so this route just redirects.
 */
export const Route = createFileRoute("/onboarding/etapa-1")({
  component: () => <Navigate to="/onboarding" replace />,
});
