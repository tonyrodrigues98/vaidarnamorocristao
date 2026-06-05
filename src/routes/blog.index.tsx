import { createFileRoute } from "@tanstack/react-router";
import { BlogPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title: "Blog | VaiDarNamoro" }] }),
  component: BlogPage,
});
