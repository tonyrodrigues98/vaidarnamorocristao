import { createFileRoute } from "@tanstack/react-router";
import { BlogPostPage } from "@/components/mock/MockPages";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({ meta: [{ title: "Post | VaiDarNamoro" }] }),
  component: BlogPostRoute,
});

function BlogPostRoute() {
  const { slug } = Route.useParams();
  return <BlogPostPage slug={slug} />;
}
