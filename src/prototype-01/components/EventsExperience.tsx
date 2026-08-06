"use client";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  Flag,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Radio,
  Repeat2,
  Search,
  Send,
  Share2,
  ShieldCheck,
  UsersRound,
  Video,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import "../styles/EventsExperience.css";

type EventsTab = "Descobrir" | "Meus eventos" | "Calendário";
type EventView = "index" | "detail" | "create";
type DetailTab = "Visão geral" | "Atualizações" | "Conversa";
type Participation = "none" | "interested" | "going" | "waitlist";

type EventItem = {
  id: string;
  title: string;
  type: string;
  schedule: string;
  duration: string;
  organizer: string;
  space?: string;
  audience: string;
  state: "Ao vivo" | "Em breve" | "Aberto" | "Lotado" | "Encerrado" | "Cancelado";
  tone: string;
  external?: boolean;
  cinema?: boolean;
  recurring?: boolean;
};

const eventItems: EventItem[] = [
  {
    id: "joao-8",
    title: "Conversa sobre João 8",
    type: "Encontro de Espaço",
    schedule: "Hoje · 21h30",
    duration: "60 min",
    organizer: "Ana Clara",
    space: "Café, Bíblia & Amizade",
    audience: "Membros do Espaço",
    state: "Ao vivo",
    tone: "coral",
  },
  {
    id: "cinema-jornada",
    title: "Cinema em comunidade — Jornada",
    type: "Sessão de Cinema",
    schedule: "Hoje · 20h",
    duration: "1h48",
    organizer: "Equipe VDN",
    audience: "Comunidade",
    state: "Em breve",
    tone: "violet",
    cinema: true,
  },
  {
    id: "devocional-manha",
    title: "Devocional antes do trabalho",
    type: "Evento recorrente",
    schedule: "Amanhã · 7h15",
    duration: "25 min",
    organizer: "Lucas Almeida",
    space: "Cristãos do Litoral Sul",
    audience: "Comunidade",
    state: "Aberto",
    tone: "gold",
    recurring: true,
  },
  {
    id: "conversa-proposito",
    title: "Propósito e decisões difíceis",
    type: "Conversa",
    schedule: "Quarta · 19h30",
    duration: "45 min",
    organizer: "Marina Souza",
    audience: "Amigos",
    state: "Lotado",
    tone: "blue",
    external: true,
  },
  {
    id: "desafio-salmos",
    title: "Desafio: 7 dias nos Salmos",
    type: "Desafio",
    schedule: "Sexta · 20h",
    duration: "30 min",
    organizer: "Verbo",
    audience: "Comunidade",
    state: "Aberto",
    tone: "green",
  },
];

const groups = [
  ["Acontecendo agora", ["joao-8"]],
  ["Começando em breve", ["cinema-jornada"]],
  ["Recomendados para você", ["devocional-manha", "conversa-proposito"]],
  ["Dos seus Espaços", ["desafio-salmos"]],
] as const;

class EventsBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="events-local-error" role="alert">
          <CircleAlert size={24} />
          <strong>Eventos não pôde ser aberto agora</strong>
          <span>O restante do VaiDarNamoro continua funcionando.</span>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function EventCard({ event, onOpen }: { event: EventItem; onOpen: () => void }) {
  return (
    <article className={`online-event-card event-tone-${event.tone}`}>
      <button className="event-cover" onClick={onOpen} aria-label={`Abrir ${event.title}`}>
        <span>{event.type}</span>
        {event.state === "Ao vivo" && (
          <em>
            <i /> AO VIVO
          </em>
        )}
        {event.cinema ? <Video size={30} /> : <CalendarDays size={30} />}
      </button>
      <div className="event-card-body">
        <div className="event-card-state">
          <span>{event.schedule}</span>
          <em>{event.state}</em>
        </div>
        <button className="event-card-title" onClick={onOpen}>
          {event.title}
        </button>
        <p>
          {event.organizer}
          {event.space ? ` · ${event.space}` : ""}
        </p>
        <div className="event-card-meta">
          <span>
            <Clock3 size={13} /> {event.duration}
          </span>
          <span>
            <UsersRound size={13} /> 8 amigos
          </span>
        </div>
        <button className="event-card-action" onClick={onOpen}>
          {event.state === "Ao vivo"
            ? "Entrar agora"
            : event.state === "Lotado"
              ? "Ver lista de espera"
              : "Ver evento"}
          <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}

function EventsExperience({
  showToast,
  onKeyboard,
}: {
  showToast: (message: string) => void;
  onKeyboard: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<EventsTab>("Descobrir");
  const [view, setView] = useState<EventView>("index");
  const [selectedId, setSelectedId] = useState("joao-8");
  const [detailTab, setDetailTab] = useState<DetailTab>("Visão geral");
  const [participation, setParticipation] = useState<Participation>("none");
  const [reminder, setReminder] = useState("10 minutos antes");
  const [externalOpen, setExternalOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const tabScroll = useRef<Record<EventsTab, number>>({
    Descobrir: 0,
    "Meus eventos": 0,
    Calendário: 0,
  });

  const selected = eventItems.find((item) => item.id === selectedId) ?? eventItems[0];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("vdn-events-tab");
      if (saved === "Descobrir" || saved === "Meus eventos" || saved === "Calendário") {
        setTab(saved);
      }
      setOnline(navigator.onLine);
      setLoading(false);
    }, 420);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      onKeyboard(false);
    };
  }, [onKeyboard]);

  useEffect(() => {
    if (detailTab !== "Conversa") return;
    window.requestAnimationFrame(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    });
  }, [detailTab]);

  const switchTab = (next: EventsTab) => {
    tabScroll.current[tab] = scrollRef.current?.scrollTop ?? 0;
    setTab(next);
    window.localStorage.setItem("vdn-events-tab", next);
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: tabScroll.current[next], behavior: "auto" });
    });
  };

  const openEvent = (id: string) => {
    setSelectedId(id);
    setDetailTab("Visão geral");
    setView("detail");
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };

  const sendMessage = () => {
    if (!draft.trim()) return;
    setDraft("");
    showToast("Mensagem enviada na conversa do evento");
  };

  const filteredEvents = useMemo(
    () =>
      eventItems.filter((item) =>
        `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  if (loading) {
    return (
      <div className="events-loading" aria-label="Carregando Eventos">
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <EventsBoundary>
      <section
        className={`events-experience ${detailTab === "Conversa" ? "event-chat-open" : ""}`}
        data-action-context="event"
        data-action-title={selected.title}
      >
        {view === "index" && (
          <>
            <header className="events-subheader">
              <div>
                <span className="section-overline">ENCONTROS ONLINE</span>
                <h2>Eventos</h2>
              </div>
              <button
                className="events-create-button"
                onClick={() => {
                  setCreateStep(1);
                  setView("create");
                }}
              >
                <Plus size={17} /> Criar evento
              </button>
            </header>

            <nav className="events-tabs" aria-label="Áreas de Eventos">
              {(["Descobrir", "Meus eventos", "Calendário"] as EventsTab[]).map((item) => (
                <button
                  key={item}
                  aria-current={tab === item ? "page" : undefined}
                  className={tab === item ? "active" : ""}
                  onClick={() => switchTab(item)}
                >
                  {item}
                </button>
              ))}
            </nav>

            {!online && (
              <div className="events-offline">
                <WifiOff size={16} /> Exibindo eventos já carregados
              </div>
            )}

            <div className="events-scroll" ref={scrollRef}>
              {tab === "Descobrir" && (
                <div className="events-discovery">
                  <label className="events-search">
                    <Search size={17} />
                    <input
                      aria-label="Buscar eventos online"
                      type="search"
                      inputMode="search"
                      enterKeyHint="search"
                      autoComplete="off"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar eventos online"
                    />
                    {query && (
                      <button onClick={() => setQuery("")} aria-label="Limpar">
                        <X size={15} />
                      </button>
                    )}
                  </label>
                  {query ? (
                    <section className="events-editorial-section">
                      <div className="events-section-heading">
                        <h3>Resultados</h3>
                        <span>{filteredEvents.length}</span>
                      </div>
                      <div className="events-card-row">
                        {filteredEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onOpen={() => openEvent(event.id)}
                          />
                        ))}
                      </div>
                    </section>
                  ) : (
                    <>
                      <button
                        className="events-live-official"
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("vdn-open-experience", { detail: "live" }),
                          )
                        }
                      >
                        <span>
                          <i /> AO VIVO
                        </span>
                        <Radio size={28} />
                        <div>
                          <small>TRANSMISSÃO OFICIAL</small>
                          <strong>Comunidade que acolhe</strong>
                          <em>186 assistindo · Entrar agora</em>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                      {groups.map(([title, ids]) => (
                        <section className="events-editorial-section" key={title}>
                          <div className="events-section-heading">
                            <h3>{title}</h3>
                            <button onClick={() => showToast(`Mostrando mais em ${title}`)}>
                              Ver todos
                            </button>
                          </div>
                          <div className="events-card-row">
                            {ids.map((id) => {
                              const event = eventItems.find((item) => item.id === id);
                              return event ? (
                                <EventCard key={id} event={event} onOpen={() => openEvent(id)} />
                              ) : null;
                            })}
                          </div>
                        </section>
                      ))}
                    </>
                  )}
                </div>
              )}

              {tab === "Meus eventos" && (
                <div className="my-events">
                  {["Participando", "Tenho interesse", "Organizando", "Passados", "Cancelados"].map(
                    (group, index) => (
                      <section key={group}>
                        <div className="events-section-heading">
                          <h3>{group}</h3>
                          <span>{index < 3 ? 1 : 0}</span>
                        </div>
                        {index < 3 ? (
                          <button
                            className="my-event-row"
                            onClick={() => openEvent(eventItems[index].id)}
                          >
                            <span
                              className={`event-mini-cover event-tone-${eventItems[index].tone}`}
                            >
                              <CalendarDays size={19} />
                            </span>
                            <span>
                              <strong>{eventItems[index].title}</strong>
                              <small>
                                {eventItems[index].schedule} · {eventItems[index].type}
                              </small>
                            </span>
                            <ChevronRight size={17} />
                          </button>
                        ) : (
                          <p className="events-empty-line">Nenhum evento nesta área.</p>
                        )}
                      </section>
                    ),
                  )}
                </div>
              )}

              {tab === "Calendário" && (
                <div className="events-calendar">
                  <div className="calendar-head">
                    <button aria-label="Mês anterior">‹</button>
                    <strong>Julho de 2026</strong>
                    <button aria-label="Próximo mês">›</button>
                  </div>
                  <div className="calendar-week">
                    <span>D</span>
                    <span>S</span>
                    <span>T</span>
                    <span>Q</span>
                    <span>Q</span>
                    <span>S</span>
                    <span>S</span>
                  </div>
                  <div className="calendar-grid">
                    {Array.from({ length: 35 }).map((_, index) => {
                      const day = index - 2;
                      return (
                        <button
                          key={index}
                          className={
                            day === 28
                              ? "today has-event"
                              : [27, 30, 31].includes(day)
                                ? "has-event"
                                : ""
                          }
                        >
                          {day > 0 && day <= 31 ? day : ""}
                        </button>
                      );
                    })}
                  </div>
                  <div className="calendar-filters">
                    {["Confirmados", "Interesse", "Cinema", "Espaços", "Recorrentes"].map(
                      (item) => (
                        <button key={item}>{item}</button>
                      ),
                    )}
                  </div>
                  <span className="section-overline">TERÇA, 28 DE JULHO</span>
                  {eventItems.slice(0, 2).map((event) => (
                    <button
                      className="calendar-event-row"
                      key={event.id}
                      onClick={() => openEvent(event.id)}
                    >
                      <span>{event.schedule.split("·")[1]}</span>
                      <div>
                        <strong>{event.title}</strong>
                        <small>{event.type}</small>
                      </div>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === "detail" && (
          <div className="event-detail">
            <header className="event-detail-header">
              <button
                onClick={() => {
                  setView("index");
                  onKeyboard(false);
                }}
                aria-label="Voltar"
              >
                <ArrowLeft size={20} />
              </button>
              <span>Evento</span>
              <button onClick={() => setManageOpen(true)} aria-label="Mais opções">
                <MoreHorizontal size={21} />
              </button>
            </header>
            <div className={`event-detail-cover event-tone-${selected.tone}`}>
              <span>{selected.type}</span>
              {selected.state === "Ao vivo" && (
                <em>
                  <i /> AO VIVO
                </em>
              )}
              {selected.cinema ? <Video size={48} /> : <CalendarDays size={48} />}
            </div>
            <div className="event-detail-title">
              <div>
                <span>{selected.state}</span>
                <h2>{selected.title}</h2>
                <p>
                  {selected.schedule} · {selected.duration}
                </p>
              </div>
              <button
                onClick={() => showToast("Evento compartilhado internamente")}
                aria-label="Compartilhar"
              >
                <Share2 size={19} />
              </button>
            </div>
            <div className="event-primary-actions">
              <button
                className={participation === "interested" ? "active" : ""}
                onClick={() => {
                  setParticipation("interested");
                  showToast("Você receberá atualizações deste evento");
                }}
              >
                Tenho interesse
              </button>
              <button
                className={participation === "going" ? "active" : ""}
                onClick={() => {
                  if (selected.state === "Lotado") {
                    setParticipation("waitlist");
                    showToast("Você entrou na lista de espera · posição 4");
                  } else {
                    setParticipation("going");
                    showToast("Participação confirmada");
                  }
                }}
              >
                {selected.state === "Lotado" ? "Entrar na espera" : "Vou participar"}
              </button>
              <button
                className="join"
                onClick={() =>
                  selected.external
                    ? setExternalOpen(true)
                    : showToast(
                        selected.cinema ? "Abrindo Sala de Cinema" : "Entrando na sala online",
                      )
                }
              >
                Entrar
              </button>
            </div>
            {participation === "waitlist" && (
              <div className="waitlist-banner">
                <UsersRound size={17} />
                <span>
                  <strong>Posição 4 na lista de espera</strong>
                  <small>Avisaremos se uma vaga for liberada.</small>
                </span>
                <button onClick={() => setParticipation("none")}>Cancelar</button>
              </div>
            )}
            <nav className="event-detail-tabs">
              {(["Visão geral", "Atualizações", "Conversa"] as DetailTab[]).map((item) => (
                <button
                  key={item}
                  className={detailTab === item ? "active" : ""}
                  onClick={() => setDetailTab(item)}
                >
                  {item}
                </button>
              ))}
            </nav>

            {detailTab === "Visão geral" && (
              <div className="event-detail-content">
                <section className="event-info-grid">
                  <div>
                    <CalendarDays size={18} />
                    <span>
                      <strong>{selected.schedule}</strong>
                      <small>
                        {selected.recurring
                          ? "Toda semana · próximas 6 ocorrências"
                          : "Horário de Brasília"}
                      </small>
                    </span>
                  </div>
                  <div>
                    <UsersRound size={18} />
                    <span>
                      <strong>{selected.audience}</strong>
                      <small>Audiência confirmada antes de participar</small>
                    </span>
                  </div>
                  <div>
                    <Video size={18} />
                    <span>
                      <strong>
                        {selected.external
                          ? "Link externo"
                          : selected.cinema
                            ? "Sala de Cinema"
                            : "Sala da plataforma"}
                      </strong>
                      <small>Nenhum encontro físico</small>
                    </span>
                  </div>
                  <div>
                    <ShieldCheck size={18} />
                    <span>
                      <strong>Organizado por {selected.organizer}</strong>
                      <small>{selected.space ?? "Equipe VaiDarNamoro"}</small>
                    </span>
                  </div>
                </section>
                <section>
                  <span className="section-overline">SOBRE</span>
                  <p>
                    Uma experiência online para conversar, aprender e estar junto sem sair da
                    plataforma. A sala abre dez minutos antes do início.
                  </p>
                </section>
                <section>
                  <div className="events-section-heading">
                    <h3>Participantes</h3>
                    <button>Ver 38</button>
                  </div>
                  <div className="event-participants">
                    <span>AC</span>
                    <span>LA</span>
                    <span>MS</span>
                    <span>JP</span>
                    <em>+34</em>
                    <p>8 amigos participarão</p>
                  </div>
                </section>
                <button className="reminder-row" onClick={() => setReminderOpen(true)}>
                  <Bell size={18} />
                  <span>
                    <strong>Lembrete</strong>
                    <small>{reminder}</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
                {selected.recurring && (
                  <div className="recurrence-box">
                    <Repeat2 size={18} />
                    <span>
                      <strong>Este evento se repete semanalmente</strong>
                      <small>Participe desta ocorrência ou acompanhe toda a série.</small>
                    </span>
                    <button onClick={() => showToast("Você participa da série")}>
                      Participar da série
                    </button>
                  </div>
                )}
                <section className="related-events">
                  <div className="events-section-heading">
                    <h3>Eventos relacionados</h3>
                  </div>
                  {eventItems
                    .filter((item) => item.id !== selected.id)
                    .slice(0, 2)
                    .map((item) => (
                      <button key={item.id} onClick={() => openEvent(item.id)}>
                        <span className={`event-mini-cover event-tone-${item.tone}`}>
                          <CalendarDays size={18} />
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.schedule}</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                </section>
              </div>
            )}

            {detailTab === "Atualizações" && (
              <div className="event-updates">
                <div className="update-card">
                  <span>AC</span>
                  <div>
                    <strong>Ana Clara · Organizadora</strong>
                    <small>Hoje · 18h12</small>
                    <p>A sala abrirá dez minutos antes. Separe João 8 e traga uma pergunta.</p>
                  </div>
                </div>
                <div className="update-card">
                  <span>LA</span>
                  <div>
                    <strong>Lucas · Coorganizador</strong>
                    <small>Ontem · 21h</small>
                    <p>
                      As vagas confirmadas foram ampliadas. Quem estava na espera recebeu acesso.
                    </p>
                  </div>
                </div>
                <button onClick={() => showToast("Atualização do organizador criada")}>
                  <Plus size={17} /> Enviar atualização
                </button>
              </div>
            )}

            {detailTab === "Conversa" && (
              <div className="event-conversation">
                <div className="event-chat-notice">
                  <MessageCircle size={15} /> A conversa fica ativa até 48h após o encerramento.
                </div>
                <div className="event-thread" ref={threadRef}>
                  <div className="event-message">
                    <span>AC</span>
                    <div>
                      <strong>
                        Ana Clara <small>21:04</small>
                      </strong>
                      <p>Quem já está com João 8 aberto?</p>
                      <button>Responder</button>
                      <button>Reagir</button>
                      <button>
                        <Flag size={12} /> Denunciar
                      </button>
                    </div>
                  </div>
                  <div className="event-message">
                    <span>LA</span>
                    <div>
                      <strong>
                        Lucas <small>21:05</small>
                      </strong>
                      <p>Aqui! Esse encontro promete.</p>
                      <button>Responder</button>
                      <button>Reagir</button>
                    </div>
                  </div>
                  <div className="event-message mine">
                    <div>
                      <strong>
                        Você <small>21:06</small>
                      </strong>
                      <p>Cheguei também.</p>
                    </div>
                  </div>
                </div>
                <form
                  className="event-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                >
                  <button type="button" aria-label="Adicionar mídia">
                    <Plus size={20} />
                  </button>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onFocus={() => onKeyboard(true)}
                    onBlur={() => window.setTimeout(() => onKeyboard(false), 160)}
                    placeholder="Mensagem no evento"
                    aria-label="Mensagem no evento"
                  />
                  <button type="submit" aria-label="Enviar">
                    <Send size={19} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {view === "create" && (
          <div className="event-create-flow">
            <header>
              <button onClick={() => setView("index")}>
                <X size={20} />
              </button>
              <div>
                <span>CRIAR EVENTO</span>
                <strong>Etapa {createStep} de 11</strong>
              </div>
              <button onClick={() => showToast("Rascunho salvo")}>Salvar</button>
            </header>
            <div className="event-create-progress">
              <i style={{ width: `${(createStep / 11) * 100}%` }} />
            </div>
            <div className="event-create-body">
              {createStep === 1 && (
                <>
                  <span className="section-overline">TIPO</span>
                  <h2>Que experiência você quer criar?</h2>
                  <div className="event-choice-grid">
                    {[
                      "Evento online interno",
                      "Link externo",
                      "Sessão de Cinema",
                      "Encontro de Espaço",
                      "Estudo",
                      "Conversa",
                      "Transmissão",
                      "Desafio",
                      "Evento recorrente",
                    ].map((item) => (
                      <button key={item} onClick={() => setCreateStep(2)}>
                        <CalendarDays size={20} />
                        <span>{item}</span>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {createStep === 2 && (
                <>
                  <span className="section-overline">IDENTIDADE</span>
                  <h2>Título e descrição</h2>
                  <label>
                    Título
                    <input placeholder="Ex.: Conversa sobre João 8" />
                  </label>
                  <label>
                    Descrição
                    <textarea placeholder="Conte o que vai acontecer e para quem é este evento." />
                  </label>
                </>
              )}
              {createStep === 3 && (
                <>
                  <span className="section-overline">CAPA</span>
                  <h2>Escolha uma apresentação</h2>
                  <button className="cover-uploader">
                    <Plus size={22} />
                    <strong>Adicionar capa</strong>
                    <span>Imagem horizontal, sem endereço ou localização física</span>
                  </button>
                </>
              )}
              {createStep === 4 && (
                <>
                  <span className="section-overline">DATA E HORÁRIO</span>
                  <h2>Quando acontece?</h2>
                  <label>
                    Data
                    <input type="date" defaultValue="2026-07-30" />
                  </label>
                  <label>
                    Horário
                    <input type="time" defaultValue="20:00" />
                  </label>
                </>
              )}
              {createStep === 5 && (
                <>
                  <span className="section-overline">DURAÇÃO</span>
                  <h2>Quanto tempo?</h2>
                  <div className="event-chip-options">
                    {["25 min", "45 min", "60 min", "90 min", "Personalizar"].map((item) => (
                      <button key={item}>{item}</button>
                    ))}
                  </div>
                </>
              )}
              {createStep === 6 && (
                <>
                  <span className="section-overline">AUDIÊNCIA</span>
                  <h2>Quem poderá participar?</h2>
                  <div className="event-choice-grid">
                    {["Comunidade", "Amigos", "Espaço", "Somente convidados"].map((item) => (
                      <button key={item}>
                        <UsersRound size={20} />
                        <span>{item}</span>
                        <Check size={17} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {createStep === 7 && (
                <>
                  <span className="section-overline">CAPACIDADE</span>
                  <h2>Entrada livre ou limitada?</h2>
                  <div className="event-choice-grid">
                    <button>
                      <UsersRound size={20} />
                      <span>
                        Entrada livre<small>Sem limite visível</small>
                      </span>
                    </button>
                    <button>
                      <UsersRound size={20} />
                      <span>
                        Limitada<small>Vagas e lista de espera</small>
                      </span>
                    </button>
                  </div>
                </>
              )}
              {createStep === 8 && (
                <>
                  <span className="section-overline">ACESSO</span>
                  <h2>Como as pessoas entram?</h2>
                  <div className="event-choice-grid">
                    <button>
                      <Video size={20} />
                      <span>Sala da plataforma</span>
                    </button>
                    <button>
                      <Link2 size={20} />
                      <span>Link externo</span>
                    </button>
                  </div>
                </>
              )}
              {createStep === 9 && (
                <>
                  <span className="section-overline">CONVERSA</span>
                  <h2>Conversa do evento</h2>
                  <div className="event-toggle-row">
                    <span>
                      <strong>Permitir conversa</strong>
                      <small>Participantes conversam antes e até 48h depois.</small>
                    </span>
                    <button className="on">
                      <i />
                    </button>
                  </div>
                </>
              )}
              {createStep === 10 && (
                <>
                  <span className="section-overline">LEMBRETES</span>
                  <h2>Quando lembrar participantes?</h2>
                  <div className="event-chip-options">
                    {["1 hora antes", "10 minutos antes", "No início", "Desativado"].map((item) => (
                      <button key={item}>{item}</button>
                    ))}
                  </div>
                </>
              )}
              {createStep === 11 && (
                <>
                  <span className="section-overline">REVISÃO</span>
                  <h2>Pronto para publicar</h2>
                  <div className="event-review">
                    <p>
                      <strong>Evento online interno</strong>
                      <span>Comunidade · 30 jul · 20h · 60 min</span>
                    </p>
                    <p>
                      <strong>Entrada livre</strong>
                      <span>Sala da plataforma · conversa ativa</span>
                    </p>
                    <p>
                      <strong>Audiência visível</strong>
                      <span>Todos saberão quem pode participar antes de confirmar.</span>
                    </p>
                  </div>
                  <div className="event-review-warning">
                    <ShieldCheck size={18} /> Eventos públicos, recorrentes, externos ou grandes
                    podem passar por revisão.
                  </div>
                </>
              )}
            </div>
            <footer>
              <button
                disabled={createStep === 1}
                onClick={() => setCreateStep((step) => Math.max(1, step - 1))}
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  if (createStep === 11) {
                    setView("index");
                    showToast("Evento enviado para revisão");
                  } else setCreateStep((step) => Math.min(11, step + 1));
                }}
              >
                {createStep === 11 ? "Publicar evento" : "Continuar"}
              </button>
            </footer>
          </div>
        )}

        {externalOpen && (
          <div className="event-modal-backdrop" onMouseDown={() => setExternalOpen(false)}>
            <section onMouseDown={(event) => event.stopPropagation()}>
              <ExternalLink size={25} />
              <h3>Você sairá do aplicativo</h3>
              <p>
                Este evento acontece em <strong>meet.example.org</strong>. O VaiDarNamoro não
                controla o conteúdo externo.
              </p>
              <button onClick={() => setExternalOpen(false)}>Cancelar</button>
              <button
                onClick={() => {
                  setExternalOpen(false);
                  showToast("Abertura externa simulada");
                }}
              >
                Continuar
              </button>
            </section>
          </div>
        )}
        {reminderOpen && (
          <div className="event-modal-backdrop" onMouseDown={() => setReminderOpen(false)}>
            <section onMouseDown={(event) => event.stopPropagation()}>
              <Bell size={24} />
              <h3>Lembrete do evento</h3>
              {["1 hora antes", "10 minutos antes", "No início", "Desativado"].map((item) => (
                <button
                  className={reminder === item ? "selected" : ""}
                  key={item}
                  onClick={() => {
                    setReminder(item);
                    setReminderOpen(false);
                    showToast(`Lembrete: ${item}`);
                  }}
                >
                  {item}
                  {reminder === item && <Check size={17} />}
                </button>
              ))}
            </section>
          </div>
        )}
        {manageOpen && (
          <div className="event-modal-backdrop" onMouseDown={() => setManageOpen(false)}>
            <section
              className="event-manage-sheet"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <h3>Gerenciar evento</h3>
              {[
                "Editar",
                "Pausar inscrições",
                "Enviar atualização",
                "Ver participantes",
                "Promover coorganizador",
                "Moderar conversa",
                "Encerrar",
                "Cancelar evento",
                "Denunciar",
              ].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setManageOpen(false);
                    showToast(`${item} — ação simulada`);
                  }}
                >
                  {item}
                  <ChevronRight size={16} />
                </button>
              ))}
            </section>
          </div>
        )}
      </section>
    </EventsBoundary>
  );
}

export default EventsExperience;
