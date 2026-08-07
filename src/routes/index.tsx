import { createFileRoute } from "@tanstack/react-router";
import { OrhaSplash } from "@/components/auth/OrhaSplash";

export const Route = createFileRoute("/")({
  component: OrhaSplash,
});
