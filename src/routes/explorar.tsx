import { NativeRootPlaceholder } from "@/components/native-shell";
import { RequireApproved } from "@/components/RequireApproved";
import {
  nativeShellFeatureEnabled,
  shouldExposeNativeRootDestination,
} from "@/config/native-shell-feature";
import { createPrivatePageMetadata } from "@/lib/metadata";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/explorar")({
  component: ExploreRoute,
  head: () =>
    createPrivatePageMetadata({
      title: "Explorar",
      description: "Raiz estrutural para experiências e descobertas do VaiDarNamoro.",
      path: "/explorar",
    }),
});

const exploreSections = [
  {
    id: "continuar",
    label: "Continuar",
    description: "Retomar experiências recentes.",
  },
  {
    id: "experiencias",
    label: "Experiências",
    description: "Verbo, Cinema, Pets, Arcade e Loja.",
  },
  {
    id: "descobertas",
    label: "Descobertas",
    description: "Pessoas, conteúdos e atividades.",
  },
] as const;

const exploreLinks = [
  { to: "/devocional", label: "Devocional" },
  { to: "/meu-pet", label: "Meu Pet" },
  { to: "/pet-arcade", label: "Pet Arcade" },
  { to: "/loja", label: "Loja" },
  { to: "/pretendentes", label: "Pretendentes" },
] as const;

function ExploreRoute() {
  if (!shouldExposeNativeRootDestination("/explorar", nativeShellFeatureEnabled)) {
    return <Navigate to="/inicio" replace />;
  }

  return (
    <RequireApproved>
      <NativeRootPlaceholder
        eyebrow="Estrutura em integração"
        title="Explorar"
        description="Experiências · Descobertas · Continuar"
        sections={exploreSections}
      >
        <nav className="flex flex-wrap gap-2" aria-label="Experiências disponíveis">
          {exploreLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </NativeRootPlaceholder>
    </RequireApproved>
  );
}
