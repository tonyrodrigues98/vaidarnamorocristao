import { createFileRoute } from "@tanstack/react-router";

import { HomeLanding } from "@/components/mock/MockPages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VaiDarNamoro Cristao | Live e comunidade" },
      {
        name: "description",
        content: "Home publica da live e do prototipo visual VaiDarNamoro Cristao.",
      },
    ],
  }),
  component: HomeLanding,
});
