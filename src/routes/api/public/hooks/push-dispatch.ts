import { createFileRoute } from "@tanstack/react-router";
import {
  handlePushDispatchMethodNotAllowed,
  handlePushDispatchPost,
} from "@/lib/pushDispatchAuth.server";

async function runAuthorizedBatch() {
  const { processPushDispatchBatch } = await import("@/lib/pushDispatchBatch.server");
  return processPushDispatchBatch();
}

export const Route = createFileRoute("/api/public/hooks/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handlePushDispatchPost(request, {
          runBatch: runAuthorizedBatch,
        }),
      GET: async () => handlePushDispatchMethodNotAllowed(),
    },
  },
});
