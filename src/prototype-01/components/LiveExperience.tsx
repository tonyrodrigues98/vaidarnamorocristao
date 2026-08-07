"use client";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Captions,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Ellipsis,
  Flag,
  Image as ImageIcon,
  Maximize2,
  MessageCircle,
  MicOff,
  MonitorUp,
  Pause,
  PictureInPicture2,
  Play,
  Radio,
  RefreshCw,
  Reply,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  Smile,
  UserRound,
  UsersRound,
  Video,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import "../styles/LiveExperience.css";

type LiveTab = "Agora" | "Programação" | "Equipe" | "Mídia";
type EntryState =
  | "live"
  | "soon"
  | "scheduled"
  | "paused"
  | "reconnecting"
  | "ended"
  | "cancelled"
  | "empty"
  | "offline";

const tabs: LiveTab[] = ["Agora", "Programação", "Equipe", "Mídia"];

const chatMessages = [
  {
    id: 1,
    initials: "AC",
    name: "Ana Clara",
    role: "Moderadora",
    time: "20:02",
    text: "Boa noite! O chat está aberto para comentários sobre o tema.",
  },
  {
    id: 2,
    initials: "RL",
    name: "Rafael Lima",
    role: "",
    time: "20:04",
    text: "Cheguei agora. Muito bom poder acompanhar daqui.",
  },
  {
    id: 3,
    initials: "MS",
    name: "Marina Souza",
    role: "Equipe",
    time: "20:05",
    text: "A programação completa está na aba ao lado.",
  },
  {
    id: 4,
    initials: "JP",
    name: "Juliana Prado",
    role: "",
    time: "20:07",
    text: "Esse ponto sobre amizade foi muito necessário.",
  },
];

const schedule = [
  {
    section: "Hoje",
    title: "Comunidade que acolhe",
    time: "20h–21h10",
    host: "Lucas Almeida",
    state: "Ao vivo",
    recurring: "Especial do mês",
  },
  {
    section: "Esta semana",
    title: "Perguntas sem pressa",
    time: "Qua · 20h",
    host: "Ana Clara",
    state: "Programada",
    recurring: "Toda quarta",
  },
  {
    section: "Esta semana",
    title: "Música e histórias",
    time: "Sex · 21h",
    host: "Marina Souza",
    state: "Programada",
    recurring: "Quinzenal",
  },
  {
    section: "Próximas",
    title: "Caminhos de amizade",
    time: "04 ago · 20h",
    host: "Lucas Almeida",
    state: "Programada",
    recurring: "Especial",
  },
  {
    section: "Anteriores",
    title: "Começar de novo",
    time: "21 jul · 20h",
    host: "Ana Clara",
    state: "Encerrada",
    recurring: "Gravação disponível",
  },
];

const team = [
  {
    initials: "LA",
    name: "Lucas Almeida",
    role: "Apresentador",
    status: "No ar",
    copy: "Conduz a conversa e recebe os convidados.",
  },
  {
    initials: "AC",
    name: "Ana Clara",
    role: "Administradora",
    status: "Online",
    copy: "Cuida da programação e da comunidade.",
  },
  {
    initials: "MS",
    name: "Marina Souza",
    role: "Moderadora",
    status: "No chat",
    copy: "Acompanha mensagens e pedidos de ajuda.",
  },
  {
    initials: "RL",
    name: "Rafael Lima",
    role: "Convidado",
    status: "No ar",
    copy: "Participa da conversa desta noite.",
  },
  {
    initials: "JP",
    name: "Juliana Prado",
    role: "Equipe",
    status: "Online",
    copy: "Organiza mídia e destaques.",
  },
];

const media = [
  { kind: "Gravação", title: "Começar de novo", meta: "21 jul · 58 min", icon: Video },
  { kind: "Corte", title: "A amizade também precisa de espaço", meta: "4 min", icon: Play },
  { kind: "Destaque", title: "Três perguntas da comunidade", meta: "8 min", icon: Radio },
  { kind: "Fotos", title: "Bastidores da equipe", meta: "12 imagens", icon: ImageIcon },
  {
    kind: "Material",
    title: "Roteiro para conversar em grupo",
    meta: "Leitura · 6 min",
    icon: MonitorUp,
  },
];

class LiveBoundary extends Component<
  { children: ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.failed) {
      return (
        <section className="live-local-error" role="alert">
          <CircleAlert />
          <h1>A Live não pôde ser aberta</h1>
          <p>As outras áreas continuam disponíveis.</p>
          <button onClick={() => this.setState({ failed: false })}>Tentar novamente</button>
          <button className="ghost" onClick={this.props.onClose}>
            Voltar
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

function LiveContent({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<LiveTab>("Agora");
  const [entryState, setEntryState] = useState<EntryState>("live");
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [quality, setQuality] = useState("Automática");
  const [playerMenu, setPlayerMenu] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState("");
  const [reminders, setReminders] = useState<Record<string, string>>({});
  const [reminderFor, setReminderFor] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [moderationFor, setModerationFor] = useState<string | null>(null);
  const [demoMessages, setDemoMessages] = useState(chatMessages);
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("liveState") as EntryState | null;
    const saved = window.sessionStorage.getItem("vdn-live-state");
    const restore = window.setTimeout(() => {
      if (
        requested &&
        [
          "live",
          "soon",
          "scheduled",
          "paused",
          "reconnecting",
          "ended",
          "cancelled",
          "empty",
          "offline",
        ].includes(requested)
      ) {
        setEntryState(requested);
        if (requested === "paused" || requested === "ended" || requested === "offline")
          setPlaying(false);
      }
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { tab?: LiveTab; minimized?: boolean };
          if (parsed.tab && tabs.includes(parsed.tab)) setTab(parsed.tab);
          if (parsed.minimized) setMinimized(true);
        } catch {
          // The canonical prototype treats stale local demo state as absent.
        }
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    window.sessionStorage.setItem("vdn-live-state", JSON.stringify({ tab, minimized }));
  }, [minimized, tab, visible]);

  useEffect(() => {
    if (!chatOpen) return;
    window.requestAnimationFrame(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    });
  }, [chatOpen, demoMessages]);

  const stateCopy = {
    live: [
      "AO VIVO",
      "Comunidade que acolhe",
      "Uma conversa direta sobre amizade, presença e fé vivida em comunidade.",
    ],
    soon: [
      "COMEÇA EM BREVE",
      "Comunidade que acolhe",
      "A equipe está preparando os últimos detalhes.",
    ],
    scheduled: [
      "PROGRAMADA",
      "Perguntas sem pressa",
      "Quarta, às 20h. Ative um lembrete para voltar.",
    ],
    paused: ["PAUSADA", "Voltamos em instantes", "A transmissão foi pausada pela equipe."],
    reconnecting: [
      "RECONECTANDO",
      "A conexão oscilou",
      "Estamos tentando retomar sem perder seu lugar.",
    ],
    ended: [
      "ENCERRADA",
      "Obrigado por acompanhar",
      "A gravação ficará disponível quando a equipe publicar.",
    ],
    cancelled: [
      "CANCELADA",
      "Esta transmissão não acontecerá",
      "Veja a programação para encontrar a próxima Live.",
    ],
    empty: ["SEM PROGRAMAÇÃO", "Nada agendado por enquanto", "Novas transmissões aparecerão aqui."],
    offline: ["OFFLINE", "Sem conexão", "A programação carregada continua disponível."],
  } satisfies Record<EntryState, string[]>;

  const [stateLabel, title, description] = stateCopy[entryState];
  const audience = useMemo(
    () =>
      entryState === "live"
        ? "186 assistindo"
        : entryState === "ended"
          ? "642 visualizações"
          : "38 interessados",
    [entryState],
  );

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || readOnly) return;
    setDemoMessages((current) => [
      ...current,
      { id: Date.now(), initials: "AR", name: "Você", role: "", time: "Agora", text },
    ]);
    setDraft("");
    setReplyingTo("");
    showToast("Mensagem adicionada à demonstração");
  };

  const chooseReminder = (title: string, option: string) => {
    setReminders((current) => ({ ...current, [title]: option }));
    setReminderFor(null);
    showToast(option === "Desativado" ? "Lembrete desativado" : `Lembrete: ${option}`);
  };

  const leaveToMiniPlayer = () => {
    setChatOpen(false);
    setParticipantsOpen(false);
    setMinimized(true);
    showToast("A Live continua no mini player visual");
  };

  if (!visible) return null;

  if (minimized) {
    return (
      <aside className="live-mini-player" aria-label="Mini player da Live">
        <button
          className="live-mini-preview"
          onClick={() => setMinimized(false)}
          aria-label="Voltar para a Live"
        >
          <span className="live-mini-badge">
            <Radio size={12} /> AO VIVO
          </span>
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button className="live-mini-copy" onClick={() => setMinimized(false)}>
          <strong>Comunidade que acolhe</strong>
          <span>{audience}</span>
        </button>
        <button
          aria-label={playing ? "Pausar" : "Continuar"}
          onClick={() => setPlaying((current) => !current)}
        >
          {playing ? <Pause /> : <Play />}
        </button>
        <button
          aria-label="Fechar mini player"
          onClick={() => {
            window.sessionStorage.removeItem("vdn-live-state");
            onClose();
          }}
        >
          <X />
        </button>
      </aside>
    );
  }

  return (
    <section className="live-experience" data-live-state={entryState} aria-label="Live oficial">
      <header className="live-topbar">
        <button aria-label="Voltar e manter mini player" onClick={leaveToMiniPlayer}>
          <ArrowLeft />
        </button>
        <div>
          <span>TRANSMISSÃO OFICIAL</span>
          <strong>Live</strong>
        </div>
        <button aria-label="Mais ações" onClick={() => showToast("Ações da Live abertas")}>
          <Ellipsis />
        </button>
      </header>

      <nav className="live-tabs" aria-label="Áreas da Live">
        {tabs.map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="live-body">
        {tab === "Agora" && (
          <div className="live-now-layout">
            <main className="live-main-column">
              <div className="live-player" data-playing={playing}>
                <div className="live-player-scene">
                  <div className="live-stage-glow" />
                  <span className="live-speaker-avatar">LA</span>
                  <div>
                    <strong>Lucas Almeida</strong>
                    <span>Apresentador</span>
                  </div>
                </div>
                <div className="live-player-status">
                  <span className={`live-state-pill state-${entryState}`}>
                    {entryState === "live" && <i />}
                    {entryState === "reconnecting" && <RefreshCw size={13} />}
                    {entryState === "offline" && <WifiOff size={13} />}
                    {stateLabel}
                  </span>
                  <span>{audience}</span>
                </div>
                {entryState === "reconnecting" && (
                  <div className="live-player-message">
                    <RefreshCw />
                    <strong>Reconectando</strong>
                    <span>Seu lugar foi preservado.</span>
                  </div>
                )}
                {entryState === "offline" && (
                  <div className="live-player-message">
                    <WifiOff />
                    <strong>Você está offline</strong>
                    <span>Tente novamente quando a conexão voltar.</span>
                  </div>
                )}
                {entryState === "ended" && (
                  <div className="live-player-message">
                    <Check />
                    <strong>Transmissão encerrada</strong>
                    <span>A conversa agora está somente para leitura.</span>
                  </div>
                )}
                {!["reconnecting", "offline", "ended"].includes(entryState) && !playing && (
                  <button
                    className="live-center-play"
                    aria-label="Continuar reprodução"
                    onClick={() => setPlaying(true)}
                  >
                    <Play />
                  </button>
                )}
                <div className="live-player-controls">
                  <button
                    aria-label={playing ? "Pausar player" : "Reproduzir player"}
                    onClick={() => setPlaying((current) => !current)}
                  >
                    {playing ? <Pause /> : <Play />}
                  </button>
                  <button
                    aria-label={muted ? "Ativar som" : "Silenciar"}
                    onClick={() => setMuted((current) => !current)}
                  >
                    {muted ? <VolumeX /> : <Volume2 />}
                  </button>
                  <span className="live-progress">
                    <i />
                  </span>
                  <button
                    className={captions ? "active" : ""}
                    aria-label="Alternar legendas"
                    aria-pressed={captions}
                    onClick={() => setCaptions((current) => !current)}
                  >
                    <Captions />
                  </button>
                  <button
                    aria-label="Qualidade e conexão"
                    onClick={() => setPlayerMenu((current) => !current)}
                  >
                    <Settings2 />
                  </button>
                  <button aria-label="Picture in Picture visual" onClick={leaveToMiniPlayer}>
                    <PictureInPicture2 />
                  </button>
                  <button
                    aria-label="Tela cheia visual"
                    onClick={() => showToast("Modo tela cheia visual ativado")}
                  >
                    <Maximize2 />
                  </button>
                </div>
                {playerMenu && (
                  <div className="live-player-menu">
                    <strong>Reprodução</strong>
                    {["Automática", "Alta", "Econômica"].map((item) => (
                      <button
                        key={item}
                        className={quality === item ? "active" : ""}
                        onClick={() => {
                          setQuality(item);
                          setPlayerMenu(false);
                        }}
                      >
                        {item}
                        {quality === item && <Check />}
                      </button>
                    ))}
                    <span>
                      <Wifi size={14} /> Conexão estável · {quality}
                    </span>
                  </div>
                )}
              </div>

              <section className="live-information">
                <span className="live-overline">LIVE OFICIAL · COMUNIDADE</span>
                <h1>{title}</h1>
                <p>{description}</p>
                <div className="live-host-row">
                  <span className="live-avatar">LA</span>
                  <span>
                    <strong>Lucas Almeida</strong>
                    <small>Apresentador · com Rafael Lima</small>
                  </span>
                  <button
                    onClick={() => {
                      setTab("Equipe");
                      showToast("Equipe da Live aberta");
                    }}
                  >
                    Ver equipe
                  </button>
                </div>
                <div className="live-actions">
                  <button onClick={() => showToast("Compartilhamento da Live aberto")}>
                    <Share2 /> Compartilhar
                  </button>
                  <button onClick={() => setReminderFor("Perguntas sem pressa")}>
                    <Bell /> Lembrar próxima
                  </button>
                  <button onClick={() => showToast("Denúncia em etapas aberta")}>
                    <Flag /> Denunciar
                  </button>
                </div>
                <div className="live-mobile-panels">
                  <button onClick={() => setChatOpen(true)}>
                    <MessageCircle /> Chat <span>{demoMessages.length}</span>
                  </button>
                  <button onClick={() => setParticipantsOpen(true)}>
                    <UsersRound /> Participantes <span>186</span>
                  </button>
                </div>
              </section>

              {entryState === "soon" && (
                <section className="live-prelive-card">
                  <Clock3 />
                  <div>
                    <span>COMEÇAMOS EM BREVE</span>
                    <strong>Hoje, às 20h</strong>
                    <p>Sem contagem regressiva. Entre quando quiser.</p>
                  </div>
                  <button onClick={() => setReminderFor("Comunidade que acolhe")}>
                    Criar lembrete
                  </button>
                </section>
              )}

              {entryState === "ended" && (
                <section className="live-ended-card">
                  <Check />
                  <div>
                    <span>TRANSMISSÃO ENCERRADA</span>
                    <strong>Obrigado por estar com a gente</strong>
                    <p>A gravação ainda não foi publicada. Veja os destaques ou a próxima Live.</p>
                  </div>
                  <button onClick={() => setTab("Mídia")}>Ver destaques</button>
                  <button onClick={() => setTab("Programação")}>Próxima Live</button>
                </section>
              )}

              <section className="live-related">
                <div>
                  <span>CONTEÚDO RELACIONADO</span>
                  <h2>Continue no seu ritmo</h2>
                </div>
                <button onClick={() => setTab("Mídia")}>
                  <Play />
                  <span>
                    <strong>Começar de novo</strong>
                    <small>Gravação · 58 min</small>
                  </span>
                  <ChevronRight />
                </button>
                <button onClick={() => setTab("Programação")}>
                  <CalendarDays />
                  <span>
                    <strong>Perguntas sem pressa</strong>
                    <small>Quarta · 20h</small>
                  </span>
                  <ChevronRight />
                </button>
              </section>
            </main>

            <aside className="live-chat-desktop">
              <ChatPanel
                messages={demoMessages}
                draft={draft}
                setDraft={setDraft}
                sendMessage={sendMessage}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                readOnly={readOnly || entryState === "ended"}
                setReadOnly={setReadOnly}
                moderationFor={moderationFor}
                setModerationFor={setModerationFor}
                showToast={showToast}
                chatRef={chatRef}
              />
            </aside>
          </div>
        )}

        {tab === "Programação" && (
          <main className="live-section-page">
            <header>
              <span>PROGRAMAÇÃO</span>
              <h1>Encontre a próxima conversa</h1>
              <p>Ative somente os lembretes que fizerem sentido.</p>
            </header>
            {["Hoje", "Esta semana", "Próximas", "Anteriores"].map((section) => (
              <section key={section} className="live-schedule-section">
                <h2>{section}</h2>
                {schedule
                  .filter((item) => item.section === section)
                  .map((item) => (
                    <article key={item.title} className="live-schedule-card">
                      <span
                        className={`schedule-date ${item.state === "Ao vivo" ? "is-live" : ""}`}
                      >
                        <Clock3 />
                        <strong>{item.time.split(" · ")[0]}</strong>
                      </span>
                      <div>
                        <small>
                          {item.state} · {item.recurring}
                        </small>
                        <h3>{item.title}</h3>
                        <p>
                          {item.time} · {item.host}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          item.state === "Encerrada" ? setTab("Mídia") : setReminderFor(item.title)
                        }
                      >
                        {item.state === "Encerrada"
                          ? "Assistir"
                          : reminders[item.title]
                            ? reminders[item.title]
                            : "Lembrar"}
                      </button>
                    </article>
                  ))}
              </section>
            ))}
          </main>
        )}

        {tab === "Equipe" && (
          <main className="live-section-page">
            <header>
              <span>EQUIPE DA LIVE</span>
              <h1>Pessoas que cuidam da transmissão</h1>
              <p>Funções claras e moderação identificada.</p>
            </header>
            <div className="live-team-grid">
              {team.map((person) => (
                <article key={person.name}>
                  <span className="live-team-avatar">{person.initials}</span>
                  <div>
                    <small>{person.role}</small>
                    <h2>{person.name}</h2>
                    <p>{person.copy}</p>
                    <em>{person.status}</em>
                  </div>
                  <button onClick={() => showToast(`Perfil de ${person.name} aberto`)}>
                    Perfil <ChevronRight />
                  </button>
                </article>
              ))}
            </div>
          </main>
        )}

        {tab === "Mídia" && (
          <main className="live-section-page">
            <header>
              <span>MÍDIA</span>
              <h1>Gravações e materiais</h1>
              <p>Reveja transmissões, cortes, fotos e destaques oficiais.</p>
            </header>
            <div className="live-media-grid">
              {media.map(({ kind, title: mediaTitle, meta, icon: Icon }, index) => (
                <button
                  key={mediaTitle}
                  className={index === 0 ? "featured" : ""}
                  onClick={() => showToast(`${kind} aberto em modo de demonstração`)}
                >
                  <span className="live-media-art">
                    <Icon />
                  </span>
                  <span>
                    <small>{kind}</small>
                    <strong>{mediaTitle}</strong>
                    <em>{meta}</em>
                  </span>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </main>
        )}
      </div>

      {chatOpen && (
        <div className="live-sheet-backdrop" onMouseDown={() => setChatOpen(false)}>
          <section
            className="live-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Chat da Live"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="live-sheet-handle" />
            <ChatPanel
              messages={demoMessages}
              draft={draft}
              setDraft={setDraft}
              sendMessage={sendMessage}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              readOnly={readOnly || entryState === "ended"}
              setReadOnly={setReadOnly}
              moderationFor={moderationFor}
              setModerationFor={setModerationFor}
              showToast={showToast}
              chatRef={chatRef}
              onClose={() => setChatOpen(false)}
            />
          </section>
        </div>
      )}

      {participantsOpen && (
        <div className="live-sheet-backdrop" onMouseDown={() => setParticipantsOpen(false)}>
          <section
            className="live-mobile-sheet participants"
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-participants-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="live-sheet-handle" />
            <header>
              <div>
                <span>NA LIVE</span>
                <h2 id="live-participants-title">Participantes</h2>
              </div>
              <button aria-label="Fechar participantes" onClick={() => setParticipantsOpen(false)}>
                <X />
              </button>
            </header>
            <div className="live-participant-summary">
              <UsersRound />
              <span>
                <strong>186 pessoas assistindo</strong>
                <small>Sem ranking de audiência</small>
              </span>
            </div>
            {[
              [
                "Amigos presentes",
                [
                  ["AC", "Ana Clara", "Moderadora"],
                  ["RL", "Rafael Lima", "Amigo"],
                ],
              ],
              [
                "Equipe e convidados",
                [
                  ["LA", "Lucas Almeida", "Apresentador"],
                  ["MS", "Marina Souza", "Equipe"],
                  ["JP", "Juliana Prado", "Convidada"],
                ],
              ],
              [
                "Comunidade",
                [
                  ["CB", "Camila Braga", "Assistindo"],
                  ["GF", "Gabriel Freitas", "Assistindo"],
                ],
              ],
            ].map(([section, people]) => (
              <section key={String(section)}>
                <h3>{String(section)}</h3>
                {(people as string[][]).map(([initials, name, role]) => (
                  <button key={name} onClick={() => showToast(`Perfil de ${name} aberto`)}>
                    <span>{initials}</span>
                    <span>
                      <strong>{name}</strong>
                      <small>{role}</small>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
              </section>
            ))}
          </section>
        </div>
      )}

      {reminderFor && (
        <div className="live-sheet-backdrop" onMouseDown={() => setReminderFor(null)}>
          <section
            className="live-reminder-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-reminder-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="live-sheet-handle" />
            <header>
              <Bell />
              <div>
                <span>LEMBRETE</span>
                <h2 id="live-reminder-title">{reminderFor}</h2>
              </div>
              <button aria-label="Fechar" onClick={() => setReminderFor(null)}>
                <X />
              </button>
            </header>
            <p>Este lembrete é apenas demonstrativo e fica salvo neste aparelho.</p>
            {["1 hora antes", "10 minutos antes", "No início", "Desativado"].map((option) => (
              <button key={option} onClick={() => chooseReminder(reminderFor, option)}>
                {option}
                {reminders[reminderFor] === option && <Check />}
              </button>
            ))}
          </section>
        </div>
      )}
    </section>
  );
}

function ChatPanel({
  messages,
  draft,
  setDraft,
  sendMessage,
  replyingTo,
  setReplyingTo,
  readOnly,
  setReadOnly,
  moderationFor,
  setModerationFor,
  showToast,
  chatRef,
  onClose,
}: {
  messages: typeof chatMessages;
  draft: string;
  setDraft: (value: string) => void;
  sendMessage: () => void;
  replyingTo: string;
  setReplyingTo: (value: string) => void;
  readOnly: boolean;
  setReadOnly: (value: boolean) => void;
  moderationFor: string | null;
  setModerationFor: (value: string | null) => void;
  showToast: (message: string) => void;
  chatRef: React.RefObject<HTMLDivElement | null>;
  onClose?: () => void;
}) {
  return (
    <div className="live-chat-panel">
      <header>
        <div>
          <span>CONVERSA AO VIVO</span>
          <h2>Chat</h2>
        </div>
        <button className={readOnly ? "active" : ""} onClick={() => setReadOnly(!readOnly)}>
          <ShieldCheck /> {readOnly ? "Somente leitura" : "Moderar"}
        </button>
        {onClose && (
          <button aria-label="Fechar chat" onClick={onClose}>
            <X />
          </button>
        )}
      </header>
      <div className="live-chat-notice">
        <ShieldCheck />
        <span>Conversa moderada. Trate todos com respeito.</span>
      </div>
      <div className="live-chat-messages" ref={chatRef}>
        {messages.map((message) => (
          <article key={message.id}>
            <span className="live-chat-avatar">{message.initials}</span>
            <div>
              <header>
                <strong>{message.name}</strong>
                {message.role && <em>{message.role}</em>}
                <time>{message.time}</time>
              </header>
              <p>{message.text}</p>
              <footer>
                <button onClick={() => setReplyingTo(message.name)}>
                  <Reply /> Responder
                </button>
                <button onClick={() => showToast("Reação adicionada")}>
                  <Smile /> Reagir
                </button>
                <button
                  aria-label={`Ações de ${message.name}`}
                  onClick={() =>
                    setModerationFor(moderationFor === message.name ? null : message.name)
                  }
                >
                  <Ellipsis />
                </button>
              </footer>
              {moderationFor === message.name && (
                <div className="live-moderation-menu">
                  <button
                    onClick={() => {
                      setModerationFor(null);
                      showToast("Mensagem removida na demonstração");
                    }}
                  >
                    <X /> Remover mensagem
                  </button>
                  <button
                    onClick={() => {
                      setModerationFor(null);
                      showToast("Participante silenciado na demonstração");
                    }}
                  >
                    <MicOff /> Silenciar
                  </button>
                  <button
                    onClick={() => {
                      setModerationFor(null);
                      showToast("Restrição registrada com motivo demonstrativo");
                    }}
                  >
                    <ShieldCheck /> Restringir chat
                  </button>
                  <button
                    onClick={() => {
                      setModerationFor(null);
                      showToast("Denúncia em etapas aberta");
                    }}
                  >
                    <Flag /> Denunciar
                  </button>
                  <button
                    onClick={() => {
                      setModerationFor(null);
                      showToast("Bloqueio exige confirmação");
                    }}
                  >
                    <UserRound /> Bloquear
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {readOnly ? (
        <div className="live-read-only">
          <ShieldCheck />
          <span>
            <strong>Chat somente para leitura</strong>
            <small>Você ainda pode acompanhar as mensagens.</small>
          </span>
        </div>
      ) : (
        <div className="live-chat-composer">
          {replyingTo && (
            <div>
              <span>Respondendo a {replyingTo}</span>
              <button aria-label="Cancelar resposta" onClick={() => setReplyingTo("")}>
                <X />
              </button>
            </div>
          )}
          <label>
            <span className="sr-only">Mensagem no chat da Live</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Comente sobre a Live"
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
          </label>
          <button aria-label="Enviar mensagem" disabled={!draft.trim()} onClick={sendMessage}>
            <Send />
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveExperience(props: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  return (
    <LiveBoundary onClose={props.onClose}>
      <LiveContent {...props} />
    </LiveBoundary>
  );
}
