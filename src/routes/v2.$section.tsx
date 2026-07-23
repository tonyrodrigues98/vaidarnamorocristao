import { createFileRoute } from "@tanstack/react-router";
import { V2ShellRuntimeRoute, getV2RuntimeDocumentTitle } from "@/v2/integration";

export const Route = createFileRoute("/v2/$section")({
  component: V2SectionRoute,
  head: ({ params }) => ({
    meta: [
      { title: getV2RuntimeDocumentTitle(params.section) },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function V2SectionRoute() {
  const { section } = Route.useParams();
  return <V2ShellRuntimeRoute slug={section} />;
}
