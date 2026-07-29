import { createFileRoute, Navigate } from "@tanstack/react-router";

import { NativeExploreCard } from "@/components/explore/native/NativeExploreCard";
import { NativeExploreContinue } from "@/components/explore/native/NativeExploreContinue";
import { NativeExploreSection } from "@/components/explore/native/NativeExploreSection";
import { RequireApproved } from "@/components/RequireApproved";
import { nativeExploreRegistry } from "@/config/native-explore-registry";
import {
  nativeShellFeatureEnabled,
  shouldExposeNativeRootDestination,
} from "@/config/native-shell-feature";
import { createPrivatePageMetadata } from "@/lib/metadata";

export const Route = createFileRoute("/explorar")({
  component: ExploreRoute,
  head: () =>
    createPrivatePageMetadata({
      title: "Explorar",
      description: "Raiz estrutural para experiências e descobertas do VaiDarNamoro.",
      path: "/explorar",
    }),
});

function ExploreRoute() {
  if (!shouldExposeNativeRootDestination("/explorar", nativeShellFeatureEnabled)) {
    return <Navigate to="/inicio" replace />;
  }

  const experiences = nativeExploreRegistry.filter((item) => item.category === "experiences");
  const discoveries = nativeExploreRegistry.filter((item) => item.category === "discoveries");

  return (
    <RequireApproved>
      <main className="mx-auto grid w-full max-w-[1040px] gap-7 px-4 py-5 pb-28 sm:px-6 md:pb-8">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Explorar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continue experiências reais e descubra outras áreas da plataforma.
          </p>
        </section>

        <NativeExploreSection
          title="Continuar"
          description="Atalhos locais para as experiências que você abriu recentemente."
        >
          <div className="sm:col-span-2 xl:col-span-3">
            <NativeExploreContinue />
          </div>
        </NativeExploreSection>

        <NativeExploreSection
          title="Experiências"
          description="Recursos existentes para fé, personalização, pets e diversão."
        >
          {experiences.map((item) => (
            <NativeExploreCard key={item.id} item={item} />
          ))}
        </NativeExploreSection>

        <NativeExploreSection
          title="Descobertas"
          description="Conteúdos e conexões disponíveis no aplicativo."
        >
          {discoveries.map((item) => (
            <NativeExploreCard key={item.id} item={item} />
          ))}
        </NativeExploreSection>
      </main>
    </RequireApproved>
  );
}
