import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v2")({
  component: V2RouteLayout,
  head: () => ({
    meta: [
      { title: "Community Platform V2 — Vai Dar Namoro" },
      {
        name: "description",
        content: "Entrada controlada da nova plataforma comunitária Vai Dar Namoro.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function V2RouteLayout() {
  return <Outlet />;
}
