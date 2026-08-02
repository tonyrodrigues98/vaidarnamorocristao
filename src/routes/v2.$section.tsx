import { Navigate, createFileRoute } from "@tanstack/react-router";

const v2Redirects: Readonly<
  Record<string, "/inicio" | "/comunidade" | "/explorar" | "/conversas" | "/perfil">
> = {
  home: "/inicio",
  inicio: "/inicio",
  community: "/comunidade",
  comunidade: "/comunidade",
  explore: "/explorar",
  explorar: "/explorar",
  messages: "/conversas",
  conversas: "/conversas",
  profile: "/perfil",
  perfil: "/perfil",
};

function getLegacyV2Redirect(section: string) {
  return v2Redirects[section.toLowerCase()] ?? "/inicio";
}

export const Route = createFileRoute("/v2/$section")({
  component: V2SectionRedirect,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
});

function V2SectionRedirect() {
  const { section } = Route.useParams();
  return <Navigate to={getLegacyV2Redirect(section)} replace />;
}
