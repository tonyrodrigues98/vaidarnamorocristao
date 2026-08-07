"use client";

import {
  ArrowLeft,
  CalendarDays,
  Captions,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Expand,
  Heart,
  History,
  Languages,
  MessageCircle,
  Minimize2,
  MoreHorizontal,
  Pause,
  PictureInPicture2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Signal,
  SlidersHorizontal,
  UsersRound,
  Volume2,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { ChatComposer } from "./ChatComposer";

type CinemaTab = "Agora" | "Próximas" | "Catálogo" | "Histórico";
type RoomState = "live" | "waiting" | "paused" | "ended" | "full" | "connecting" | "reconnecting";

const tabs: CinemaTab[] = ["Agora", "Próximas", "Catálogo", "Histórico"];

const films = [
  {
    id: "esperanca",
    title: "Caminho de Esperança",
    meta: "1h42 · Livre · Português",
    progress: 38,
    tone: "violet",
    copy: "Uma história sobre recomeços, comunidade e a coragem de continuar.",
  },
  {
    id: "cartas",
    title: "Cartas para o Amanhã",
    meta: "1h18 · 10 anos · Português",
    progress: 0,
    tone: "blue",
    copy: "Quatro amigos reencontram cartas escritas quando ainda eram adolescentes.",
  },
  {
    id: "luz",
    title: "Depois da Luz",
    meta: "54 min · Livre · Áudio original",
    progress: 72,
    tone: "coral",
    copy: "Um documentário íntimo sobre fé vivida em pequenos gestos.",
  },
];

class CinemaBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="cinema-local-error" role="alert">
          <CircleAlert size={26} />
          <strong>Não foi possível abrir esta área</strong>
          <span>Tente novamente.</span>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function FilmCover({
  title,
  tone,
  compact = false,
}: {
  title: string;
  tone: string;
  compact?: boolean;
}) {
  return (
    <div className={`cinema-cover cover-${tone} ${compact ? "compact" : ""}`}>
      <span>VDN ORIGINAL</span>
      <strong>{title}</strong>
      <small>Uma experiência para assistir juntos</small>
    </div>
  );
}

function CinemaRoom({
  state,
  onStateChange,
  onClose,
  showToast,
}: {
  state: RoomState;
  onStateChange: (state: RoomState) => void;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [captionsOpen, setCaptionsOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [playing, setPlaying] = useState(state !== "paused");
  const [reactions, setReactions] = useState<"off" | "limited" | "free">("off");
  const [chatDraft, setChatDraft] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const stateCopy: Record<RoomState, string> = {
    live: "Sincronizado",
    waiting: "A sala começa em 04:28",
    paused: "Pausado pelo anfitrião",
    ended: "Sessão encerrada",
    full: "Sala lotada",
    connecting: "Conectando à sala",
    reconnecting: "Reconectando",
  };

  const playable = !["ended", "full", "connecting", "reconnecting"].includes(state);

  useEffect(() => {
    if (!controlsVisible) return;
    const timer = window.setTimeout(() => setControlsVisible(false), 3200);
    return () => window.clearTimeout(timer);
  }, [controlsVisible, playing]);

  return (
    <div className="cinema-room" role="dialog" aria-modal="true">
      <header className="cinema-room-header">
        <button aria-label="Sair da sessão" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <strong>Caminho de Esperança</strong>
          <span>Sala Oficial · Ana é a anfitriã</span>
        </div>
        <button aria-label="Mais opções">
          <MoreHorizontal size={21} />
        </button>
      </header>

      <div className="cinema-room-layout">
        <main className="cinema-player-column">
          <div
            className={`collective-player room-${state} ${controlsVisible ? "controls-visible" : ""}`}
            onPointerDown={() => setControlsVisible(true)}
          >
            <div className="collective-ambient" />
            <div className="collective-title">
              <span>VDN ORIGINAL</span>
              <strong>Caminho de Esperança</strong>
            </div>

            {state === "waiting" && (
              <div className="player-state-message">
                <Clock3 size={28} />
                <strong>A sessão começa em breve</strong>
                <span>Você entrará no ponto certo automaticamente.</span>
              </div>
            )}
            {state === "ended" && (
              <div className="player-state-message">
                <Check size={28} />
                <strong>Obrigado por assistir junto</strong>
                <span>A conversa foi arquivada no seu histórico.</span>
              </div>
            )}
            {state === "full" && (
              <div className="player-state-message">
                <UsersRound size={28} />
                <strong>Esta sala está lotada</strong>
                <span>Você pode assistir sozinho ou esperar uma vaga.</span>
              </div>
            )}
            {(state === "connecting" || state === "reconnecting") && (
              <div className="player-state-message">
                <RefreshCw className="spin" size={28} />
                <strong>{stateCopy[state]}</strong>
                <span>Seu lugar na sessão está preservado.</span>
              </div>
            )}

            {playable && (
              <button
                className="collective-play"
                aria-label={playing ? "Pausar" : "Reproduzir"}
                onClick={() => {
                  setPlaying((value) => !value);
                  if (state === "paused") onStateChange("live");
                }}
              >
                {playing ? <Pause size={29} /> : <Play size={29} fill="currentColor" />}
              </button>
            )}

            <div className="player-sync">
              <Signal size={13} />
              {stateCopy[state]}
            </div>

            <div className="collective-controls">
              <div className="player-transport">
                <button
                  aria-label="Retroceder 15 segundos"
                  onClick={() => showToast("Retrocedeu 15 segundos")}
                >
                  −15
                </button>
                <button
                  aria-label={playing ? "Pausar" : "Reproduzir"}
                  onClick={() => setPlaying((value) => !value)}
                >
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  aria-label="Avançar 15 segundos"
                  onClick={() => showToast("Avançou 15 segundos")}
                >
                  +15
                </button>
              </div>
              <div className="player-timeline">
                <span>38:12</span>
                <div className="collective-progress">
                  <i />
                </div>
                <span>1:42:06</span>
              </div>
              <div className="player-secondary">
                <button aria-label="Volume">
                  <Volume2 size={18} />
                </button>
                <button aria-label="Legendas" onClick={() => setCaptionsOpen((value) => !value)}>
                  <Captions size={19} />
                </button>
                <button
                  aria-label="Mais controles"
                  onClick={() => setQualityOpen((value) => !value)}
                >
                  <SlidersHorizontal size={18} />
                </button>
                <button
                  aria-label="Picture in Picture"
                  onClick={() => showToast("Picture-in-Picture demonstrativo")}
                >
                  <PictureInPicture2 size={18} />
                </button>
                <button aria-label="Tela cheia" onClick={() => showToast("Modo imersivo ativo")}>
                  <Expand size={18} />
                </button>
              </div>
            </div>

            {captionsOpen && (
              <div className="player-popover captions-menu">
                <strong>Legendas</strong>
                <button onClick={() => setCaptionsOpen(false)}>
                  <Check size={14} /> Português
                </button>
                <button onClick={() => setCaptionsOpen(false)}>Desativadas</button>
              </div>
            )}
            {qualityOpen && (
              <div className="player-popover quality-menu">
                <strong>Qualidade</strong>
                <button onClick={() => setQualityOpen(false)}>
                  <Check size={14} /> Automática · 1080p
                </button>
                <button onClick={() => setQualityOpen(false)}>720p · economia</button>
              </div>
            )}
          </div>

          <div className="room-under-player">
            <div>
              <span className="room-live-label">AO VIVO · ENTRADA LIVRE</span>
              <h1>Caminho de Esperança</h1>
              <p>86 pessoas assistindo no mesmo ponto · conexão estável</p>
            </div>
            <button className="mobile-chat-trigger" onClick={() => setChatOpen(true)}>
              <MessageCircle size={18} /> Conversa <span>4 novas</span>
            </button>
            <div className="reaction-setting">
              <span>Reações</span>
              {(["off", "limited", "free"] as const).map((mode) => (
                <button
                  key={mode}
                  className={reactions === mode ? "active" : ""}
                  onClick={() => {
                    setReactions(mode);
                    showToast(
                      mode === "off"
                        ? "Reações desativadas"
                        : mode === "limited"
                          ? "Reações limitadas"
                          : "Reações livres",
                    );
                  }}
                >
                  {mode === "off" ? "Desativadas" : mode === "limited" ? "Limitadas" : "Livres"}
                </button>
              ))}
            </div>
          </div>
        </main>

        <aside className={`cinema-room-chat ${chatOpen ? "open" : ""}`}>
          <header>
            <div>
              <strong>Conversa da sala</strong>
              <span>86 participantes</span>
            </div>
            <button aria-label="Recolher conversa" onClick={() => setChatOpen(false)}>
              <Minimize2 size={19} />
            </button>
          </header>
          <div className="room-messages" ref={messagesRef}>
            <div>
              <span className="chat-avatar">AC</span>
              <p>
                <strong>Ana Clara</strong>Essa parte sempre me toca.
              </p>
            </div>
            <div>
              <span className="chat-avatar lucas">LA</span>
              <p>
                <strong>Lucas Almeida</strong>A trilha e essa fotografia…
              </p>
            </div>
            <div className="room-system-message">Marina entrou no ponto atual da sessão.</div>
            <div>
              <span className="chat-avatar marina">MS</span>
              <p>
                <strong>Marina Souza</strong>Cheguei na hora certa!
              </p>
            </div>
          </div>
          <ChatComposer
            className="room-composer"
            dark
            value={chatDraft}
            onChange={setChatDraft}
            onAttach={() => showToast("Anexos da sala abertos")}
            onFocus={() => {
              requestAnimationFrame(() => {
                const messages = messagesRef.current;
                if (messages) messages.scrollTop = messages.scrollHeight;
              });
            }}
            placeholder="Comentar na sala…"
            label="Comentar na sala"
            onSend={() => {
              if (!chatDraft.trim()) return;
              setChatDraft("");
              showToast("Mensagem enviada");
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function CinemaContent({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<CinemaTab>("Agora");
  const [roomState, setRoomState] = useState<RoomState>("live");
  const [roomOpen, setRoomOpen] = useState(false);
  const [soloFilm, setSoloFilm] = useState<(typeof films)[number] | null>(null);
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    friends: true,
  });

  const upcoming = useMemo(
    () => [
      {
        id: "official",
        day: "HOJE",
        time: "20:00",
        title: "Caminho de Esperança",
        source: "Sessão oficial",
        recurring: "Toda quarta",
      },
      {
        id: "friends",
        day: "SEX",
        time: "21:30",
        title: "Cartas para o Amanhã",
        source: "Amigos de Antonio",
        recurring: "Sessão única",
      },
      {
        id: "space",
        day: "DOM",
        time: "19:00",
        title: "Depois da Luz",
        source: "Café, Bíblia & Amizade",
        recurring: "A cada 15 dias",
      },
    ],
    [],
  );

  if (!visible) return <div className="cinema-experience is-hidden" aria-hidden="true" />;

  return (
    <div
      className="cinema-experience"
      data-action-context="cinema"
      data-action-title="Cinema"
      data-immersive-surface="cinema"
      data-state-preserved="true"
    >
      <header className="cinema-topbar">
        <button aria-label="Voltar para Explorar" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <h1>Cinema</h1>
        <div className="cinema-topbar-actions">
          <button
            aria-label="Buscar no Cinema"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("vdn-open-global-search", { detail: "Cinema" }))
            }
          >
            <Search size={20} />
            <span>Buscar</span>
          </button>
          <button
            aria-label="Criar no Cinema"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("vdn-open-create-center", { detail: "Cinema" }))
            }
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <nav className="cinema-tabs" aria-label="Áreas do Cinema">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="cinema-content">
        {activeTab === "Agora" && (
          <>
            <section className="official-room">
              <div className="official-room-visual">
                <span className="live-badge">
                  <i /> AO VIVO
                </span>
                <div>
                  <small>VDN APRESENTA</small>
                  <strong>
                    Caminho
                    <br />
                    de Esperança
                  </strong>
                </div>
              </div>
              <div className="official-room-copy">
                <span className="cinema-kicker">SALA OFICIAL</span>
                <h2>Caminho de Esperança</h2>
                <p>
                  Uma sessão para assistir junto, conversar e encontrar significado em comunidade.
                </p>
                <div className="room-meta">
                  <span>
                    <UsersRound size={14} /> 86 assistindo
                  </span>
                  <span>
                    <Check size={14} /> Entrada livre
                  </span>
                  <span>Ana Clara é a anfitriã</span>
                </div>
                <button
                  className="cinema-primary"
                  onClick={() => {
                    setRoomState("live");
                    setRoomOpen(true);
                  }}
                >
                  <Play size={17} fill="currentColor" /> Entrar agora
                </button>
              </div>
            </section>

            <section className="cinema-section">
              <div className="cinema-section-heading">
                <div>
                  <span>COMEÇA EM BREVE</span>
                  <h2>Próximas a abrir</h2>
                </div>
                <button onClick={() => setActiveTab("Próximas")}>
                  Ver agenda <ChevronRight size={15} />
                </button>
              </div>
              <button
                className="cinema-up-next"
                onClick={() => {
                  setRoomState("waiting");
                  setRoomOpen(true);
                }}
              >
                <CalendarDays size={22} />
                <span>
                  <strong>Cartas para o Amanhã</strong>
                  <small>Hoje · 21h30 · sessão de Amigos</small>
                </span>
                <em>Tenho interesse</em>
              </button>
            </section>

            <section className="cinema-section">
              <div className="cinema-section-heading">
                <div>
                  <span>PARA VOCÊ</span>
                  <h2>Continue assistindo</h2>
                </div>
                <button onClick={() => setActiveTab("Catálogo")}>
                  Catálogo <ChevronRight size={15} />
                </button>
              </div>
              <button className="continue-film" onClick={() => setSoloFilm(films[2])}>
                <FilmCover title={films[2].title} tone={films[2].tone} compact />
                <span>
                  <strong>{films[2].title}</strong>
                  <small>Você parou em 38:44</small>
                  <i>
                    <b />
                  </i>
                </span>
                <Play size={18} />
              </button>
            </section>

            <details className="cinema-demo-states">
              <summary>Visualizar estados da sala</summary>
              <div>
                {(["paused", "full", "connecting", "reconnecting", "ended"] as RoomState[]).map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setRoomState(item);
                        setRoomOpen(true);
                      }}
                    >
                      {stateLabel(item)}
                    </button>
                  ),
                )}
              </div>
            </details>
          </>
        )}

        {activeTab === "Próximas" && (
          <section className="cinema-agenda">
            <div className="cinema-page-intro">
              <span className="cinema-kicker">SUA AGENDA</span>
              <h2>Próximas sessões</h2>
              <p>Oficiais, de Amigos e dos seus Espaços — tudo no mesmo lugar.</p>
            </div>
            {upcoming.map((item) => (
              <article key={item.id}>
                <div className="agenda-time">
                  <span>{item.day}</span>
                  <strong>{item.time}</strong>
                </div>
                <div className="agenda-copy">
                  <small>{item.source}</small>
                  <strong>{item.title}</strong>
                  <span>{item.recurring}</span>
                </div>
                <button
                  className={reminders[item.id] ? "active" : ""}
                  onClick={() =>
                    setReminders((current) => ({ ...current, [item.id]: !current[item.id] }))
                  }
                >
                  {reminders[item.id] ? <Check size={15} /> : <Heart size={15} />}
                  {reminders[item.id] ? "Vou participar" : "Tenho interesse"}
                </button>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Catálogo" && (
          <section className="cinema-catalog">
            <div className="cinema-page-intro">
              <span className="cinema-kicker">BIBLIOTECA DA COMUNIDADE</span>
              <h2>Escolha o que assistir</h2>
              <p>Conteúdos aprovados para sessões coletivas ou para o seu momento.</p>
            </div>
            <div className="catalog-grid">
              {films.map((film) => (
                <article key={film.id}>
                  <button className="catalog-cover-button" onClick={() => setSoloFilm(film)}>
                    <FilmCover title={film.title} tone={film.tone} />
                    <span className="catalog-play">
                      <Play size={20} fill="currentColor" />
                    </span>
                    {film.progress > 0 && (
                      <i className="cover-progress">
                        <b style={{ width: `${film.progress}%` }} />
                      </i>
                    )}
                  </button>
                  <div>
                    <h3>{film.title}</h3>
                    <p>{film.meta}</p>
                    <span>
                      <Languages size={13} /> Legendas disponíveis
                    </span>
                    <button onClick={() => setSoloFilm(film)}>
                      {film.progress ? "Continuar" : "Assistir agora"} <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Histórico" && (
          <section className="cinema-history">
            <div className="cinema-page-intro">
              <span className="cinema-kicker">MEMÓRIAS COMPARTILHADAS</span>
              <h2>Seu histórico</h2>
              <p>Retome um conteúdo ou releia uma conversa que valeu guardar.</p>
            </div>
            {[films[2], films[1]].map((film, index) => (
              <article key={film.id}>
                <FilmCover title={film.title} tone={film.tone} compact />
                <div>
                  <small>
                    {index ? "12 de julho" : "Quarta-feira"} · {index ? "18" : "74"} participantes
                  </small>
                  <h3>{film.title}</h3>
                  <p>{index ? "Sessão de Amigos" : "Sala Oficial"} · conversa arquivada</p>
                  <div>
                    <button onClick={() => setSoloFilm(film)}>
                      <Play size={14} /> Assistir novamente
                    </button>
                    <button onClick={() => showToast("Conversa arquivada aberta")}>
                      <MessageCircle size={14} /> Ver conversa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {roomOpen && (
        <CinemaRoom
          state={roomState}
          onStateChange={setRoomState}
          onClose={() => setRoomOpen(false)}
          showToast={showToast}
        />
      )}

      {soloFilm && (
        <div className="solo-player" role="dialog" aria-modal="true">
          <header>
            <button aria-label="Voltar ao catálogo" onClick={() => setSoloFilm(null)}>
              <ArrowLeft size={21} />
            </button>
            <div>
              <strong>{soloFilm.title}</strong>
              <span>Assistindo sozinho</span>
            </div>
            <button aria-label="Fechar" onClick={() => setSoloFilm(null)}>
              <X size={20} />
            </button>
          </header>
          <div className="solo-player-stage">
            <FilmCover title={soloFilm.title} tone={soloFilm.tone} />
            <button>
              <Play size={30} fill="currentColor" />
            </button>
            <div className="solo-controls">
              <Volume2 size={18} />
              <i>
                <b style={{ width: `${Math.max(soloFilm.progress, 12)}%` }} />
              </i>
              <Captions size={19} />
              <SlidersHorizontal size={18} />
              <Expand size={18} />
            </div>
          </div>
          <div className="solo-info">
            <span>{soloFilm.meta}</span>
            <h2>{soloFilm.title}</h2>
            <p>{soloFilm.copy}</p>
            <div>
              <button onClick={() => showToast("Reprodução reiniciada")}>
                <History size={15} /> Reiniciar
              </button>
              <button onClick={() => showToast("Legendas em português")}>
                <Captions size={15} /> Português
              </button>
              <button onClick={() => showToast("Qualidade automática")}>
                <SlidersHorizontal size={15} /> Automática
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function stateLabel(state: RoomState) {
  const labels: Record<RoomState, string> = {
    live: "Ao vivo",
    waiting: "Aguardando",
    paused: "Pausada",
    ended: "Encerrada",
    full: "Lotada",
    connecting: "Conectando",
    reconnecting: "Reconectando",
  };
  return labels[state];
}

export function CinemaExperience(props: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <CinemaBoundary>
      <CinemaContent {...props} />
    </CinemaBoundary>
  );
}
