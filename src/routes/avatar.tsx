import { createFileRoute } from "@tanstack/react-router";

import { AvatarPage } from "@/components/avatar/AvatarPage";
import { currentUser } from "@/data/mockApp";

function AvatarRoutePage() {
  const userRole = currentUser.role as string;
  const canAccess = userRole === "super_admin" || import.meta.env.DEV;

  return <AvatarPage coins={currentUser.coins} canAccess={canAccess} />;
}

export const Route = createFileRoute("/avatar")({
  head: () => ({ meta: [{ title: "Avatar | VaiDarNamoro" }] }),
  component: AvatarRoutePage,
});
