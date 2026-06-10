import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * /comunidade was removed as a separate area of the app. We now consolidate
 * messaging inside /conversas. This route exists only as a temporary
 * compatibility redirect for old links/bookmarks/notifications.
 */
export const Route = createFileRoute("/comunidade")({
  component: () => <Navigate to="/conversas" replace />,
});