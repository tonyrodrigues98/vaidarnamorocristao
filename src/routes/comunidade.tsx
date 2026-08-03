import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MessageCircle, Newspaper, Radio, Sparkles } from "lucide-react";

import { NativeCommunityLinkCard } from "@/components/community/native/NativeCommunityLinkCard";
import { NativeCommunitySection } from "@/components/community/native/NativeCommunitySection";
import { NativeCommunityTabs } from "@/components/community/native/NativeCommunityTabs";
import { RequireApproved } from "@/components/RequireApproved";
import { normalizeNativeCommunityTab } from "@/config/native-community-tabs";
import {
  nativeShellFeatureEnabled,
  shouldExposeNativeRootDestination,
} from "@/config/native-shell-feature";
import { createPrivatePageMetadata } from "@/lib/metadata";
import { useRedesignRuntime } from "@/components/redesign-total/RedesignRuntimeContext";
import { RedesignCommunityView } from "@/components/redesign-total/community/RedesignCommunityView";

export const Route = createFileRoute("/comunidade")({
  component: CommunityRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: normalizeNativeCommunityTab(search.tab),
  }),
  head: () =>
    createPrivatePageMetadata({
      title: "Comunidade",
      description: "Raiz estrutural da comunidade VaiDarNamoro.",
      path: "/comunidade",
    }),
});

function CommunityRoute() {
  const { tab } = Route.useSearch();
  const { active: totalRedesignActive } = useRedesignRuntime();

  if (!shouldExposeNativeRootDestination("/comunidade", nativeShellFeatureEnabled)) {
    return <Navigate to="/conversas/comunidade" replace />;
  }

  if (totalRedesignActive) {
    return (
      <RequireApproved>
        <RedesignCommunityView activeTab={tab} />
      </RequireApproved>
    );
  }

  return (
    <RequireApproved>
      <main className="mx-auto grid w-full max-w-[880px] gap-6 px-4 py-5 pb-28 sm:px-6 md:pb-8">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Comunidade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversas, oração e conteúdos já disponíveis na plataforma.
          </p>
        </section>
        <NativeCommunityTabs activeTab={tab} />

        {tab === "agora" ? (
          <NativeCommunitySection
            title="Agora"
            description="Atividades e conversas reais que você pode abrir neste momento."
          >
            <NativeCommunityLinkCard
              to="/conversas/comunidade"
              title="Chat geral"
              description="Entre na conversa ao vivo da comunidade."
              Icon={MessageCircle}
            />
            <NativeCommunityLinkCard
              to="/oracoes"
              title="Orações"
              description="Compartilhe ou acompanhe pedidos de oração."
              Icon={Sparkles}
            />
            <NativeCommunityLinkCard
              to="/noticias"
              title="Notícias"
              description="Leia as notícias publicadas para a comunidade."
              Icon={Newspaper}
            />
            <NativeCommunityLinkCard
              to="/devocional"
              title="Devocional"
              description="Acesse a palavra e a reflexão disponíveis."
              Icon={Sparkles}
            />
          </NativeCommunitySection>
        ) : null}

        {tab === "espacos" ? (
          <NativeCommunitySection
            title="Espaços"
            description="Destinos comunitários que já possuem rotas e conteúdo reais."
          >
            <NativeCommunityLinkCard
              to="/oracoes"
              title="Orações"
              description="Um espaço dedicado aos pedidos e à oração."
              Icon={Sparkles}
            />
            <NativeCommunityLinkCard
              to="/devocional"
              title="Devocional"
              description="Reflexões publicadas para acompanhar no seu ritmo."
              Icon={Newspaper}
            />
            <NativeCommunityLinkCard
              to="/conversas/comunidade"
              title="Chat geral"
              description="A conversa em tempo real da comunidade."
              Icon={MessageCircle}
            />
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground sm:col-span-2">
              Novos espaços temáticos só serão exibidos quando tiverem contrato e dados reais.
            </p>
          </NativeCommunitySection>
        ) : null}

        {tab === "eventos" ? (
          <NativeCommunitySection
            title="Eventos"
            description="Não há uma agenda persistente de eventos disponível neste momento."
          >
            <NativeCommunityLinkCard
              to="/"
              title="Live pública"
              description="Acesse a página pública atual para verificar transmissões disponíveis."
              Icon={Radio}
            />
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nenhum evento online está agendado nos dados atuais.
            </p>
          </NativeCommunitySection>
        ) : null}
      </main>
    </RequireApproved>
  );
}
