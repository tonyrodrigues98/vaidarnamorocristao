import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v2/")({
  component: V2IndexRoute,
});

function V2IndexRoute() {
  return <Navigate to="/v2/$section" params={{ section: "inicio" }} replace />;
}
