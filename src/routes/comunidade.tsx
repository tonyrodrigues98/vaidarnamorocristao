import { NativeRootPlaceholder } from "@/components/native-shell";
import { RequireApproved } from "@/components/RequireApproved";
import {
  nativeShellFeatureEnabled,
  shouldExposeNativeRootDestination,
} from "@/config/native-shell-feature";
import { createPrivatePageMetadata } from "@/lib/metadata";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/comunidade")({
  component: CommunityRoute,
  head: () =>
    createPrivatePageMetadata({
      title: "Comunidade",
      description: "Raiz estrutural da comunidade VaiDarNamoro.",
      path: "/comunidade",
    }),
});

const communitySections = [
  {
    id: "agora",
    label: "Agora",
    description: "Conversas e publicações da comunidade.",
  },
  {
    id: "espacos",
    label: "Espaços",
    description: "Grupos temáticos e privados.",
  },
  {
    id: "eventos",
    label: "Eventos",
    description: "Encontros online e sessões de Cinema.",
  },
] as const;

function CommunityRoute() {
  if (!shouldExposeNativeRootDestination("/comunidade", nativeShellFeatureEnabled)) {
    return <Navigate to="/conversas/comunidade" replace />;
  }

  return (
    <RequireApproved>
      <NativeRootPlaceholder
        eyebrow="Estrutura em integração"
        title="Comunidade"
        description="Agora · Espaços · Eventos"
        sections={communitySections}
      >
        <Link
          to="/conversas/comunidade"
          className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Abrir chat geral
        </Link>
      </NativeRootPlaceholder>
    </RequireApproved>
  );
}
