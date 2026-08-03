import { Link } from "@tanstack/react-router";
import { ArrowRight, BookHeart, MessageCircle, Newspaper, Radio, Sparkles } from "lucide-react";

import { nativeCommunityTabs, type NativeCommunityTab } from "@/config/native-community-tabs";

import { RedesignBadge, RedesignCard, RedesignPage, RedesignSection } from "../primitives";

const communityDestinations = [
  {
    to: "/conversas/comunidade",
    title: "Chat geral",
    description: "Converse em tempo real com a comunidade.",
    Icon: MessageCircle,
    tone: "coral" as const,
  },
  {
    to: "/oracoes",
    title: "Orações",
    description: "Compartilhe e acompanhe pedidos de oração.",
    Icon: Sparkles,
    tone: "violet" as const,
  },
  {
    to: "/noticias",
    title: "Notícias",
    description: "Leia as publicações mais recentes da comunidade.",
    Icon: Newspaper,
    tone: "subtle" as const,
  },
  {
    to: "/devocional",
    title: "Devocional",
    description: "Acompanhe a palavra e a reflexão no seu ritmo.",
    Icon: BookHeart,
    tone: "subtle" as const,
  },
] as const;

export function RedesignCommunityView({ activeTab }: { activeTab: NativeCommunityTab }) {
  return (
    <RedesignPage className="rd-community">
      <header className="rd-page-heading rd-community__heading">
        <RedesignBadge>Fé, acolhimento e conversa</RedesignBadge>
        <h1>Comunidade</h1>
        <p>Espaços reais para compartilhar, acompanhar e conversar.</p>
      </header>

      <nav className="rd-route-tabs" aria-label="Seções da comunidade">
        {nativeCommunityTabs.map((tab) => (
          <Link
            key={tab.id}
            to="/comunidade"
            search={{ tab: tab.id }}
            aria-current={activeTab === tab.id ? "page" : undefined}
            data-active={String(activeTab === tab.id)}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === "agora" ? (
        <RedesignSection aria-labelledby="rd-community-now">
          <div className="rd-section-heading">
            <div>
              <span className="rd-eyebrow">Disponível agora</span>
              <h2 id="rd-community-now">Entre quando fizer sentido</h2>
            </div>
          </div>
          <div className="rd-community__grid">
            {communityDestinations.map(({ to, title, description, Icon, tone }) => (
              <Link key={to} to={to}>
                <RedesignCard tone={tone}>
                  <span className="rd-community__icon">
                    <Icon aria-hidden />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                  <ArrowRight aria-hidden />
                </RedesignCard>
              </Link>
            ))}
          </div>
        </RedesignSection>
      ) : null}

      {activeTab === "espacos" ? (
        <RedesignSection aria-labelledby="rd-community-spaces">
          <div className="rd-section-heading">
            <div>
              <span className="rd-eyebrow">Espaços reais</span>
              <h2 id="rd-community-spaces">Comunidade com propósito</h2>
            </div>
          </div>
          <div className="rd-community__grid">
            {communityDestinations.slice(0, 3).map(({ to, title, description, Icon, tone }) => (
              <Link key={to} to={to}>
                <RedesignCard tone={tone}>
                  <span className="rd-community__icon">
                    <Icon aria-hidden />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                  <ArrowRight aria-hidden />
                </RedesignCard>
              </Link>
            ))}
          </div>
          <p className="rd-community__truth-note">
            Novos espaços só aparecem quando possuem rota, conteúdo e contrato reais.
          </p>
        </RedesignSection>
      ) : null}

      {activeTab === "eventos" ? (
        <RedesignSection aria-labelledby="rd-community-events">
          <div className="rd-section-heading">
            <div>
              <span className="rd-eyebrow">Eventos</span>
              <h2 id="rd-community-events">Nenhuma agenda persistente agora</h2>
            </div>
          </div>
          <Link to="/">
            <RedesignCard tone="coral" className="rd-community__live">
              <Radio aria-hidden />
              <div>
                <strong>Live pública</strong>
                <p>Veja se existe uma transmissão disponível.</p>
              </div>
              <ArrowRight aria-hidden />
            </RedesignCard>
          </Link>
        </RedesignSection>
      ) : null}
    </RedesignPage>
  );
}
