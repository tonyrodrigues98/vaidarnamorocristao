import { BookOpen, MessageCircle, Newspaper, Radio, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { nativeCommunityTabs, type NativeCommunityTab } from "@/config/native-community-tabs";

import {
  VisualZeroActionRow,
  VisualZeroGroupedList,
  VisualZeroHeader,
  VisualZeroHero,
  VisualZeroIconTile,
  VisualZeroPrimaryAction,
  VisualZeroScreen,
  VisualZeroSection,
  VisualZeroSegmentedControl,
  VisualZeroStatusPill,
} from "../primitives";

const segments = nativeCommunityTabs.map((tab) => ({
  ...tab,
  to: "/comunidade",
  search: { tab: tab.id },
}));

export function VisualZeroCommunity({ activeTab }: { activeTab: NativeCommunityTab }) {
  return (
    <VisualZeroScreen className="vz-community">
      <VisualZeroHeader
        eyebrow="Fé, acolhimento e conversa"
        title="Comunidade"
        description="Entre nos espaços reais da comunidade no seu ritmo."
      />
      <VisualZeroSegmentedControl label="Seções da comunidade" items={segments} value={activeTab} />

      {activeTab === "agora" ? (
        <>
          <VisualZeroHero className="vz-community__chat-hero">
            <div>
              <VisualZeroStatusPill tone="coral">Agora</VisualZeroStatusPill>
              <MessageCircle aria-hidden />
            </div>
            <h2>Chat Geral</h2>
            <p>Uma conversa contínua com a comunidade, em tempo real.</p>
            <VisualZeroPrimaryAction to="/conversas/comunidade">
              Entrar na conversa
            </VisualZeroPrimaryAction>
          </VisualZeroHero>

          <VisualZeroSection title="Acompanhe a comunidade" eyebrow="Hoje">
            <VisualZeroGroupedList>
              <VisualZeroActionRow
                to="/oracoes"
                leading={
                  <VisualZeroIconTile tone="violet">
                    <Sparkles aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Orações"
                description="Pedidos, respostas e acompanhamento com privacidade."
              />
              <VisualZeroActionRow
                to="/noticias"
                leading={
                  <VisualZeroIconTile tone="neutral">
                    <Newspaper aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Notícias"
                description="Publicações recentes para a comunidade."
              />
            </VisualZeroGroupedList>
          </VisualZeroSection>

          <Link to="/devocional" className="vz-community__devotional">
            <span>
              <BookOpen aria-hidden /> Devocional
            </span>
            <h2>Uma pausa para ler, refletir e seguir.</h2>
            <p>Abra a palavra e a reflexão disponíveis para hoje.</p>
            <strong>Continuar leitura</strong>
          </Link>
        </>
      ) : null}

      {activeTab === "espacos" ? (
        <VisualZeroSection title="Espaços com propósito" eyebrow="Disponíveis">
          <VisualZeroGroupedList>
            <VisualZeroActionRow
              to="/conversas/comunidade"
              leading={
                <VisualZeroIconTile tone="coral">
                  <MessageCircle aria-hidden />
                </VisualZeroIconTile>
              }
              title="Chat Geral"
              description="Conversa em tempo real da comunidade."
            />
            <VisualZeroActionRow
              to="/oracoes"
              leading={
                <VisualZeroIconTile tone="violet">
                  <Sparkles aria-hidden />
                </VisualZeroIconTile>
              }
              title="Orações"
              description="Compartilhe e acompanhe pedidos de oração."
            />
            <VisualZeroActionRow
              to="/devocional"
              leading={
                <VisualZeroIconTile tone="mint">
                  <BookOpen aria-hidden />
                </VisualZeroIconTile>
              }
              title="Devocional"
              description="Leitura e reflexão no seu ritmo."
            />
            <VisualZeroActionRow
              to="/noticias"
              leading={
                <VisualZeroIconTile tone="neutral">
                  <Newspaper aria-hidden />
                </VisualZeroIconTile>
              }
              title="Notícias"
              description="Conteúdo publicado para a comunidade."
            />
          </VisualZeroGroupedList>
        </VisualZeroSection>
      ) : null}

      {activeTab === "eventos" ? (
        <VisualZeroSection title="Transmissões disponíveis" eyebrow="Eventos reais">
          <VisualZeroGroupedList>
            <VisualZeroActionRow
              to="/"
              leading={
                <VisualZeroIconTile tone="coral">
                  <Radio aria-hidden />
                </VisualZeroIconTile>
              }
              title="Live pública"
              description="Verifique a programação real na página pública."
              trailing={<VisualZeroStatusPill tone="neutral">Ver agenda</VisualZeroStatusPill>}
            />
          </VisualZeroGroupedList>
        </VisualZeroSection>
      ) : null}
    </VisualZeroScreen>
  );
}
