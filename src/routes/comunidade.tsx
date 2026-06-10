import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * /comunidade was removed as a separate area of the app. The community chat
 * now lives inside the messaging area at /conversas/comunidade. This route
 * stays only as a compatibility redirect for old links/bookmarks/push
 * notifications.
 */
export const Route = createFileRoute("/comunidade")({
  component: () => <Navigate to="/conversas/comunidade" replace />,
});