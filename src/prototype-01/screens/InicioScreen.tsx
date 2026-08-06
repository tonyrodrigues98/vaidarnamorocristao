import {
  Bell,
  BookOpen,
  ChevronRight,
  Clapperboard,
  Compass,
  MessageCircle,
  PawPrint,
  Radio,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  getNativeInicioPriority,
  type NativeInicioViewModel,
} from "@/components/home/native/NativeInicioView";

import officialLogo from "../assets/logo-oficial-transparente.png";

export type Prototype01InicioScreenProps = {
  model: NativeInicioViewModel;
  onNavigate(path: string): void;
};

const shortcuts = [
  { label: "Comunidade", path: "/comunidade", Icon: UsersRound, tone: "coral" },
  { label: "Explorar", path: "/explorar", Icon: Compass, tone: "violet" },
  { label: "Conversas", path: "/conversas", Icon: MessageCircle, tone: "gold" },
  { label: "Perfil", path: "/perfil", Icon: UserRound, tone: "blue" },
] as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");
}

export function Prototype01InicioScreen({ model, onNavigate }: Prototype01InicioScreenProps) {
  const priority = getNativeInicioPriority(model);
  const firstName = model.firstName || "você";
  const devotional = model.devotional;

  return (
    <section className="screen home-screen" aria-labelledby="prototype01-home-title">
      <div className="page-scroll home-page-scroll">
        <header className="topbar home-topbar">
          <div className="brand">
            <img src={officialLogo} alt="" className="brand-logo" />
            <span>VaiDarNamoro</span>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button pressable"
              aria-label="Abrir notificações"
              onClick={() => onNavigate("/notificacoes")}
            >
              <Bell size={20} />
              {model.unreadConversations > 0 ? (
                <span className="notification-dot" aria-label="Há novidades" />
              ) : null}
            </button>
            <button
              type="button"
              className="avatar avatar-md topbar-avatar-button pressable"
              aria-label={`Abrir conta de ${firstName}`}
              onClick={() => onNavigate("/perfil")}
            >
              {initials(firstName)}
            </button>
          </div>
        </header>

        <div className="home-content">
          <div className="home-layout">
            <div className="home-main-column">
              <div className="greeting">
                <h1 id="prototype01-home-title">{model.greeting}</h1>
                <p>{model.greetingDetail}</p>
              </div>

              <button
                type="button"
                className="verse-panel pressable"
                onClick={() => onNavigate("/devocional")}
              >
                <span className="verse-orbit verse-orbit-one" />
                <span className="verse-orbit verse-orbit-two" />
                <span className="verse-kicker">
                  <BookOpen size={15} /> PALAVRA DO DIA
                </span>
                <blockquote>
                  {devotional?.bibleText
                    ? `“${devotional.bibleText}”`
                    : "Nenhum devocional foi publicado para hoje."}
                </blockquote>
                <span className="verse-reference">
                  {devotional?.bibleReference ?? devotional?.title ?? "Devocional"}
                </span>
                <span className="verse-support">
                  {devotional ? "Para guardar no coração ao longo do dia." : "Volte mais tarde."}
                </span>
                <span className="verse-open">
                  Abrir devocional <ChevronRight size={16} />
                </span>
              </button>

              <section className="section-block priority-section" aria-label="Prioridade">
                <button
                  type="button"
                  className="priority-object pressable"
                  onClick={() => onNavigate(priority.to)}
                >
                  <div className="priority-icon">
                    <BookOpen size={21} />
                  </div>
                  <div className="priority-copy">
                    <strong>{priority.title}</strong>
                    <span>{priority.description}</span>
                  </div>
                  <span className="priority-action">
                    Continuar <ChevronRight size={16} />
                  </span>
                </button>
              </section>

              <section className="section-block shortcuts-section">
                <div className="section-heading">
                  <h2>Seus atalhos</h2>
                  <span>Rotas reais</span>
                </div>
                <div className="shortcut-grid">
                  {shortcuts.map(({ label, path, Icon, tone }) => (
                    <button
                      key={path}
                      type="button"
                      className={`shortcut pressable shortcut-${tone}`}
                      onClick={() => onNavigate(path)}
                    >
                      <span className="shortcut-icon">
                        <Icon size={23} />
                      </span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <button
                type="button"
                className="home-live-object pressable"
                onClick={() => onNavigate("/")}
              >
                <span className="home-live-visual">
                  <span>
                    <i /> LIVE
                  </span>
                  <Radio size={30} />
                  <small>Dados públicos atuais</small>
                </span>
                <span className="home-live-copy">
                  <span className="section-overline">LIVE OFICIAL</span>
                  <strong>Comunidade que acolhe</strong>
                  <small>Abra a experiência pública atual.</small>
                  <em>
                    Ver live <ChevronRight size={16} />
                  </em>
                </span>
              </button>

              <div className="discovery-object" aria-label="Cinema em comunidade em breve">
                <div className="discovery-art">
                  <span className="discovery-date">EM BREVE</span>
                  <Clapperboard size={28} />
                </div>
                <div className="discovery-copy">
                  <span className="section-overline">EXPERIÊNCIA FUTURA</span>
                  <h2>Cinema em comunidade</h2>
                  <p>Esta composição foi preservada; ainda não existe uma rota funcional.</p>
                </div>
              </div>
            </div>

            <aside className="home-day-panel" aria-label="Painel do dia">
              <span className="day-panel-label">Painel do dia</span>
              <section className="section-block quiet-progress">
                <div className="section-heading">
                  <div>
                    <span className="section-overline">SEU RITMO</span>
                    <h2>Hoje</h2>
                  </div>
                  <span className="progress-caption">{model.strengthLabel}</span>
                </div>
                <div className="rhythm-strip">
                  <span>
                    <BookOpen size={16} />
                    <strong>{model.strength}%</strong>
                    <small>Perfil</small>
                  </span>
                  <span>
                    <PawPrint size={16} />
                    <strong>Pet</strong>
                    <small>Explorar</small>
                  </span>
                  <span>
                    <Trophy size={16} />
                    <strong>{model.newProfiles}</strong>
                    <small>Novidades</small>
                  </span>
                </div>
              </section>

              <button
                type="button"
                className="conversation-prompt pressable"
                onClick={() => onNavigate("/conversas")}
              >
                <div className="avatar avatar-md">
                  <MessageCircle size={19} />
                </div>
                <span className="conversation-copy">
                  <span className="section-overline">CONVERSAS</span>
                  <strong>{model.unreadConversations > 0 ? "Há novidades" : "Tudo em dia"}</strong>
                  <span>Abra sua lista de conversas.</span>
                </span>
                {model.unreadConversations > 0 ? (
                  <span
                    className="conversation-unread"
                    aria-label={`${model.unreadConversations} conversas não lidas`}
                  >
                    {model.unreadConversations}
                  </span>
                ) : null}
              </button>
            </aside>
          </div>

          <footer className="end-of-day">
            <Sparkles size={18} />
            <strong>Você chegou ao fim do seu painel.</strong>
            <span>Volte quando quiser. Sem pressa.</span>
          </footer>
        </div>
      </div>
    </section>
  );
}
