import { BookOpen, MessageCircle, Newspaper, Radio, Search, Sparkles } from "lucide-react";

export type Prototype01CommunitySection = "Agora" | "Espaços" | "Eventos";

export type Prototype01ComunidadeScreenProps = {
  section: Prototype01CommunitySection;
  onSectionChange(section: Prototype01CommunitySection): void;
  onNavigate(path: string): void;
};

const realCommunityDestinations = [
  {
    path: "/conversas/comunidade",
    title: "Chat geral",
    description: "Entre na conversa em tempo real da comunidade.",
    Icon: MessageCircle,
  },
  {
    path: "/oracoes",
    title: "Orações",
    description: "Compartilhe ou acompanhe pedidos de oração.",
    Icon: Sparkles,
  },
  {
    path: "/noticias",
    title: "Notícias",
    description: "Leia as notícias publicadas para a comunidade.",
    Icon: Newspaper,
  },
  {
    path: "/devocional",
    title: "Devocional",
    description: "Acesse a palavra e a reflexão disponíveis.",
    Icon: BookOpen,
  },
] as const;

export function Prototype01ComunidadeScreen({
  section,
  onSectionChange,
  onNavigate,
}: Prototype01ComunidadeScreenProps) {
  return (
    <section className="screen community-screen" aria-label="Comunidade">
      <header className="topbar contextual-topbar">
        <h1>Comunidade</h1>
        <div className="community-topbar-actions">
          <button
            type="button"
            className="community-search-button pressable"
            onClick={() => onNavigate("/conversas/comunidade")}
          >
            <Search size={18} />
            <span>Buscar</span>
          </button>
        </div>
      </header>

      <div className="community-tabs tab-strip" role="tablist">
        {(["Agora", "Espaços", "Eventos"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={section === item}
            className={section === item ? "active" : ""}
            onClick={() => onSectionChange(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="community-section-pane active">
        {section === "Agora" ? (
          <div className="community-flow">
            <div className="spaces-section-heading">
              <div>
                <span className="section-overline">ACONTECENDO AGORA</span>
                <h2>Comunidade real</h2>
              </div>
            </div>
            <section className="space-discovery-section your-spaces">
              <div className="space-wall-posts">
                {realCommunityDestinations.map(({ path, title, description, Icon }) => (
                  <article key={path} className="space-wall-post">
                    <button type="button" className="pressable" onClick={() => onNavigate(path)}>
                      <span className="space-row-icon">
                        <Icon size={19} />
                      </span>
                      <span>
                        <strong>{title}</strong>
                        <small>{description}</small>
                      </span>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {section === "Espaços" ? (
          <div className="spaces-discovery">
            <div className="space-state-panel">
              <UsersVisual />
              <h2>Espaços estão em preparação</h2>
              <p>
                A composição original foi preservada. Espaços persistentes aparecerão quando houver
                contrato e dados reais.
              </p>
              <button type="button" onClick={() => onNavigate("/conversas/comunidade")}>
                Abrir chat geral
              </button>
            </div>
          </div>
        ) : null}

        {section === "Eventos" ? (
          <div className="spaces-discovery">
            <div className="space-state-panel">
              <Radio size={30} />
              <h2>Nenhum evento agendado</h2>
              <p>Não existe uma agenda persistente de eventos nos dados atuais.</p>
              <button type="button" onClick={() => onNavigate("/")}>
                Ver Live pública
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function UsersVisual() {
  return (
    <span className="space-detail-icon" aria-hidden="true">
      CB
    </span>
  );
}
