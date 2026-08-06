"use client";

import {
  ArrowLeft,
  BellOff,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserMinus,
  UserPlus,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useState } from "react";
import "../styles/PeopleExperience.css";

type PeopleTab = "Descobrir" | "Amigos" | "Solicitações";
type RequestTab = "Recebidas" | "Enviadas";
type Availability =
  | "Disponível para conversar"
  | "Prefiro apenas Amigos"
  | "Não receber novas conversas";
type DiscoveryPrivacy =
  | "qualquer pessoa aprovada"
  | "somente contexto em comum"
  | "apenas busca direta"
  | "não aparecer em descoberta";
type DemoState =
  | "normal"
  | "loading"
  | "empty"
  | "no-friends"
  | "no-requests"
  | "offline"
  | "error";

type Person = {
  id: string;
  initials: string;
  name: string;
  location: string;
  status: string;
  interests: string[];
  contexts: string[];
  available: boolean;
  tone: string;
};

const people: Person[] = [
  {
    id: "ana",
    initials: "AC",
    name: "Ana Clara",
    location: "Santos, SP",
    status: "Aprendendo a desacelerar e cultivar boas conversas.",
    interests: ["Leitura", "Música", "Cinema"],
    contexts: ["3 Amigos em comum", "Participa de Café, Bíblia & Amizade"],
    available: true,
    tone: "coral",
  },
  {
    id: "lucas",
    initials: "LA",
    name: "Lucas Almeida",
    location: "São Vicente, SP",
    status: "Tecnologia, fé prática e um café sem pressa.",
    interests: ["Tecnologia", "Bíblia", "Fotografia"],
    contexts: ["2 Amigos em comum", "Também gosta de Cinema"],
    available: true,
    tone: "violet",
  },
  {
    id: "marina",
    initials: "MS",
    name: "Marina Souza",
    location: "Itanhaém, SP",
    status: "Praia, louvor e serviço voluntário.",
    interests: ["Praia", "Louvor", "Voluntariado"],
    contexts: ["Participa de Cristãos do Litoral Sul", "Foi ao último evento local"],
    available: false,
    tone: "sage",
  },
  {
    id: "gabriel",
    initials: "GM",
    name: "Gabriel Martins",
    location: "Peruíbe, SP",
    status: "Novo por aqui. Gosto de conversas honestas e trilhas.",
    interests: ["Trilhas", "Salmos", "Esportes"],
    contexts: ["Recém-chegado", "1 Espaço em comum"],
    available: true,
    tone: "gold",
  },
];

const initialFriends: Person[] = [
  people[0],
  {
    id: "beatriz",
    initials: "BR",
    name: "Beatriz Rocha",
    location: "Peruíbe, SP",
    status: "Online agora",
    interests: ["Livros", "Culinária", "Eventos"],
    contexts: ["4 Amigos em comum"],
    available: true,
    tone: "rose",
  },
  {
    id: "rafael",
    initials: "RF",
    name: "Rafael Freitas",
    location: "Praia Grande, SP",
    status: "Voltando mais tarde",
    interests: ["Música", "Arcade", "Futebol"],
    contexts: ["2 Espaços em comum"],
    available: false,
    tone: "blue",
  },
];

class PeopleBoundary extends Component<
  { children: React.ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="people-local-error" role="alert">
          <CircleAlert size={28} />
          <strong>Pessoas encontrou um problema</strong>
          <span>Verbo e as outras áreas continuam funcionando.</span>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw size={17} /> Tentar novamente
          </button>
          <button className="secondary" onClick={this.props.onClose}>
            Voltar para Explorar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function PersonAvatar({ person, size = "normal" }: { person: Person; size?: "normal" | "large" }) {
  return (
    <span className={`people-avatar tone-${person.tone} ${size === "large" ? "large" : ""}`}>
      {person.initials}
      {person.available && <i aria-label="Disponível para conversar" />}
    </span>
  );
}

function FilterSheet({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (count: number) => void;
}) {
  const [selected, setSelected] = useState<string[]>(["Amigos em comum"]);
  const options = [
    "Interesses",
    "Espaços",
    "Cidade ou estado",
    "Disponível para conversar",
    "Amigos em comum",
    "Recém-chegados",
    "Participação em eventos",
  ];

  const toggle = (item: string) => {
    setSelected((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  return (
    <div className="people-backdrop" onMouseDown={onClose}>
      <section className="people-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="people-sheet-handle" />
        <header>
          <div>
            <strong>Filtros comunitários</strong>
            <span>Encontre contexto, não um tipo de pessoa.</span>
          </div>
          <button aria-label="Fechar filtros" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="people-filter-options">
          {options.map((option) => (
            <button
              key={option}
              className={selected.includes(option) ? "selected" : ""}
              onClick={() => toggle(option)}
            >
              <span>{option}</span>
              <i>{selected.includes(option) && <Check size={14} />}</i>
            </button>
          ))}
        </div>
        <button className="people-sheet-primary" onClick={() => onApply(selected.length)}>
          Aplicar {selected.length} filtro(s)
        </button>
        <button className="people-sheet-secondary" onClick={() => setSelected([])}>
          Limpar filtros
        </button>
      </section>
    </div>
  );
}

function FriendRequestSheet({
  person,
  onClose,
  onSent,
}: {
  person: Person;
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="people-backdrop" onMouseDown={onClose}>
      <section
        className="people-sheet request-sheet"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="people-sheet-handle" />
        {sent ? (
          <div className="request-success">
            <span>
              <UserCheck size={24} />
            </span>
            <h2>Solicitação enviada</h2>
            <p>{person.name} verá seu contexto e a mensagem quando abrir Solicitações.</p>
            <button
              onClick={() => {
                onSent();
                onClose();
              }}
            >
              Concluir
            </button>
          </div>
        ) : (
          <>
            <header>
              <div>
                <strong>Adicionar Amigo</strong>
                <span>Uma apresentação curta é opcional.</span>
              </div>
              <button aria-label="Fechar" onClick={onClose}>
                <X />
              </button>
            </header>
            <div className="request-person">
              <PersonAvatar person={person} />
              <div>
                <strong>{person.name}</strong>
                <span>{person.contexts[0]}</span>
              </div>
            </div>
            <label>
              <span>Mensagem opcional</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={180}
                placeholder="Ex.: Oi! Vi que participamos do mesmo Espaço."
              />
              <small>{message.length}/180</small>
            </label>
            <div className="request-context">
              <ShieldCheck size={17} />
              <span>Seu nome, Perfil público e o contexto em comum serão mostrados.</span>
            </div>
            <button className="people-sheet-primary" onClick={() => setSent(true)}>
              Enviar solicitação
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function PrivacySheet({
  onClose,
  availability,
  setAvailability,
  privacy,
  setPrivacy,
}: {
  onClose: () => void;
  availability: Availability;
  setAvailability: (value: Availability) => void;
  privacy: DiscoveryPrivacy;
  setPrivacy: (value: DiscoveryPrivacy) => void;
}) {
  const availabilityOptions: Availability[] = [
    "Disponível para conversar",
    "Prefiro apenas Amigos",
    "Não receber novas conversas",
  ];
  const privacyOptions: DiscoveryPrivacy[] = [
    "qualquer pessoa aprovada",
    "somente contexto em comum",
    "apenas busca direta",
    "não aparecer em descoberta",
  ];

  return (
    <div className="people-backdrop" onMouseDown={onClose}>
      <section
        className="people-sheet people-privacy-sheet"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="people-sheet-handle" />
        <header>
          <div>
            <strong>Descoberta e conversas</strong>
            <span>Você controla como novas conexões começam.</span>
          </div>
          <button aria-label="Fechar" onClick={onClose}>
            <X />
          </button>
        </header>
        <span className="people-sheet-label">DISPONIBILIDADE</span>
        <div className="people-radio-list">
          {availabilityOptions.map((item) => (
            <button key={item} onClick={() => setAvailability(item)}>
              <span>
                <strong>{item}</strong>
                <small>
                  {item === "Disponível para conversar"
                    ? "Pode expirar em 24 horas"
                    : item === "Prefiro apenas Amigos"
                      ? "Novas pessoas não iniciam conversa"
                      : "Convites e mensagens ficam fechados"}
                </small>
              </span>
              <i className={availability === item ? "selected" : ""} />
            </button>
          ))}
        </div>
        <span className="people-sheet-label">QUEM PODE ME ENCONTRAR?</span>
        <div className="people-radio-list">
          {privacyOptions.map((item) => (
            <button key={item} onClick={() => setPrivacy(item)}>
              <span>
                <strong>{item.charAt(0).toUpperCase() + item.slice(1)}</strong>
              </span>
              <i className={privacy === item ? "selected" : ""} />
            </button>
          ))}
        </div>
        <button className="people-sheet-primary" onClick={onClose}>
          Salvar preferências
        </button>
      </section>
    </div>
  );
}

function SafetySheet({
  person,
  onClose,
  onAction,
  isFriend,
}: {
  person: Person;
  onClose: () => void;
  onAction: (action: string) => void;
  isFriend: boolean;
}) {
  const actions = [
    [BellOff, "Silenciar", "Notificações, Momentos e conteúdo deixam de aparecer."],
    [
      Shield,
      "Restringir",
      "Novas mensagens voltam para Solicitações e as interações são reduzidas.",
    ],
    [
      UserMinus,
      isFriend ? "Remover Amigo" : "Cancelar solicitação",
      isFriend
        ? "A pessoa não será notificada e conversas antigas permanecem."
        : "O convite pendente será removido.",
    ],
    [
      X,
      "Bloquear",
      "Perfis deixam de se encontrar, mensagens são impedidas e a amizade é removida.",
    ],
    [Flag, "Denunciar", "Envie o contexto para a equipe de segurança analisar."],
  ] as const;

  return (
    <div className="people-backdrop" onMouseDown={onClose}>
      <section
        className="people-sheet safety-sheet"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="people-sheet-handle" />
        <header>
          <div>
            <strong>Segurança e relação</strong>
            <span>{person.name}</span>
          </div>
          <button aria-label="Fechar" onClick={onClose}>
            <X />
          </button>
        </header>
        {actions.map(([Icon, title, copy]) => (
          <button key={title} onClick={() => onAction(title)}>
            <span>
              <Icon size={19} />
            </span>
            <div>
              <strong>{title}</strong>
              <small>{copy}</small>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}
      </section>
    </div>
  );
}

function PersonCard({
  person,
  requested,
  onProfile,
  onAdd,
  onSelect,
}: {
  person: Person;
  requested: boolean;
  onProfile: () => void;
  onAdd: () => void;
  onSelect: () => void;
}) {
  return (
    <article className="person-rich-card" onClick={onSelect}>
      <header>
        <PersonAvatar person={person} />
        <div>
          <h2>{person.name}</h2>
          <span>
            <MapPin size={13} /> {person.location}
          </span>
        </div>
        <button aria-label={`Mais opções para ${person.name}`}>
          <MoreHorizontal size={20} />
        </button>
      </header>
      <p>{person.status}</p>
      <div className="person-context">
        {person.contexts.map((context) => (
          <span key={context}>
            <UsersRound size={14} /> {context}
          </span>
        ))}
        {person.available && (
          <span className="available">
            <MessageCircle size={14} /> Disponível para conversar
          </span>
        )}
      </div>
      <div className="person-interests">
        {person.interests.map((interest) => (
          <span key={interest}>{interest}</span>
        ))}
      </div>
      <footer>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onProfile();
          }}
        >
          Abrir Perfil
        </button>
        <button
          className={requested ? "sent" : ""}
          disabled={requested}
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
        >
          {requested ? <Check size={17} /> : <UserPlus size={17} />}
          {requested ? "Solicitação enviada" : "Adicionar Amigo"}
        </button>
      </footer>
    </article>
  );
}

function PeopleContent({
  onClose,
  onOpenProfile,
  showToast,
}: {
  onClose: () => void;
  onOpenProfile: (name: string) => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<PeopleTab>("Descobrir");
  const [requestTab, setRequestTab] = useState<RequestTab>("Recebidas");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability>("Disponível para conversar");
  const [privacy, setPrivacy] = useState<DiscoveryPrivacy>("somente contexto em comum");
  const [requesting, setRequesting] = useState<Person | null>(null);
  const [requested, setRequested] = useState<string[]>(["lucas"]);
  const [friends, setFriends] = useState<Person[]>(initialFriends);
  const [favorites, setFavorites] = useState<string[]>(["ana"]);
  const [safetyPerson, setSafetyPerson] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(people[0]);
  const [received, setReceived] = useState([
    {
      person: people[2],
      message: "Oi! Vi que participamos do mesmo Espaço e gostei das suas publicações.",
      context: "Cristãos do Litoral Sul",
    },
    {
      person: people[3],
      message: "",
      context: "1 Espaço em comum",
    },
  ]);
  const [demoState, setDemoState] = useState<DemoState>("normal");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const requestedTab = window.sessionStorage.getItem("vdn-people-tab");
    const state = new URLSearchParams(window.location.search).get("peopleState");
    const initialize = window.setTimeout(() => {
      if (
        requestedTab === "Descobrir" ||
        requestedTab === "Amigos" ||
        requestedTab === "Solicitações"
      ) {
        setTab(requestedTab);
      }
      if (
        state === "loading" ||
        state === "empty" ||
        state === "no-friends" ||
        state === "no-requests" ||
        state === "offline" ||
        state === "error"
      ) {
        setDemoState(state);
      }
    }, 0);
    return () => window.clearTimeout(initialize);
  }, []);

  const changeTab = (next: PeopleTab) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("vdn-people-tab", next);
    }
  };

  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        `${person.name} ${person.location} ${person.interests.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  );

  const filteredFriends = useMemo(
    () =>
      friends.filter((person) =>
        `${person.name} ${person.status}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [friends, search],
  );

  const accept = (person: Person) => {
    setReceived((current) => current.filter((request) => request.person.id !== person.id));
    setFriends((current) =>
      current.some((friend) => friend.id === person.id) ? current : [...current, person],
    );
    setSelectedPerson(person);
    showToast(`Você e ${person.name} agora são Amigos`);
  };

  const decline = (person: Person) => {
    setReceived((current) => current.filter((request) => request.person.id !== person.id));
    showToast("Solicitação recusada sem notificar a pessoa");
  };

  const safetyAction = (action: string) => {
    if (!safetyPerson) return;
    if (action === "Remover Amigo") {
      setFriends((current) => current.filter((friend) => friend.id !== safetyPerson.id));
    }
    if (action === "Cancelar solicitação") {
      setRequested((current) => current.filter((id) => id !== safetyPerson.id));
    }
    setSafetyPerson(null);
    showToast(
      action === "Bloquear"
        ? `${safetyPerson.name} foi bloqueado neste protótipo`
        : action === "Restringir"
          ? `${safetyPerson.name} foi restringido`
          : `${action} aplicado sem notificação`,
    );
  };

  if (demoState === "error") {
    return (
      <div className="people-experience">
        <div className="people-inline-error">
          <CircleAlert size={28} />
          <h2>Pessoas não carregou por completo</h2>
          <p>O erro ficou contido nesta área.</p>
          <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
          <button className="secondary" onClick={onClose}>
            Voltar para Explorar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="people-experience" data-action-context="profile" data-action-title="Pessoas">
      <header className="people-topbar">
        <button aria-label="Voltar para Explorar" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <h1>Pessoas</h1>
        <div>
          <button aria-label="Filtros" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={20} />
            {activeFilters > 0 && <i>{activeFilters}</i>}
          </button>
          <button aria-label="Privacidade da descoberta" onClick={() => setPrivacyOpen(true)}>
            <ShieldCheck size={20} />
          </button>
        </div>
      </header>
      <nav className="people-primary-tabs" aria-label="Áreas de Pessoas">
        {(["Descobrir", "Amigos", "Solicitações"] as PeopleTab[]).map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => changeTab(item)}
          >
            {item}
            {item === "Solicitações" && received.length > 0 && <i>{received.length}</i>}
          </button>
        ))}
      </nav>

      <div className="people-layout">
        <main className="people-main">
          {demoState === "offline" && (
            <div className="people-offline">
              <WifiOff size={17} />
              Você está offline. Mostrando conexões já carregadas.
            </div>
          )}
          {demoState === "loading" ? (
            <div className="people-loading">
              <span />
              <span />
              <span />
            </div>
          ) : tab === "Descobrir" ? (
            <div className="people-discover">
              <label className="people-search">
                <Search size={18} />
                <input
                  aria-label="Buscar pessoas"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() =>
                    window.dispatchEvent(
                      new CustomEvent("vdn-open-global-search", { detail: "Pessoas" }),
                    )
                  }
                  placeholder="Buscar por nome, cidade ou interesse"
                />
              </label>
              <button className="availability-banner" onClick={() => setPrivacyOpen(true)}>
                <span className="availability-dot" />
                <span>
                  <strong>{availability}</strong>
                  <small>
                    {privacy === "somente contexto em comum"
                      ? "Visível para pessoas com contexto em comum"
                      : `Descoberta: ${privacy}`}
                  </small>
                </span>
                <ChevronRight size={18} />
              </button>
              {demoState === "empty" || filteredPeople.length === 0 ? (
                <div className="people-empty">
                  <UsersRound size={29} />
                  <h2>Nenhuma nova pessoa agora</h2>
                  <p>Participe de Espaços e eventos para criar mais conexões.</p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setDemoState("normal");
                    }}
                  >
                    Ver Espaços
                  </button>
                </div>
              ) : (
                <div className="people-card-list">
                  {filteredPeople.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      requested={requested.includes(person.id)}
                      onProfile={() => onOpenProfile(person.name)}
                      onAdd={() => setRequesting(person)}
                      onSelect={() => setSelectedPerson(person)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : tab === "Amigos" ? (
            <div className="friends-view">
              <label className="people-search">
                <Search size={18} />
                <input
                  aria-label="Buscar Amigos"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() =>
                    window.dispatchEvent(
                      new CustomEvent("vdn-open-global-search", { detail: "Pessoas" }),
                    )
                  }
                  placeholder="Buscar Amigos"
                />
              </label>
              <div className="friend-filter-row">
                {["Todos", "Favoritos", "Online", "Recentes"].map((item) => (
                  <button key={item}>
                    {item === "Favoritos" && <Heart size={14} />}
                    {item}
                  </button>
                ))}
              </div>
              {demoState === "no-friends" || filteredFriends.length === 0 ? (
                <div className="people-empty">
                  <UserPlus size={29} />
                  <h2>Sua lista de Amigos começa aqui</h2>
                  <p>Descubra pessoas com interesses em comum.</p>
                  <button
                    onClick={() => {
                      setDemoState("normal");
                      changeTab("Descobrir");
                    }}
                  >
                    Descobrir Pessoas
                  </button>
                </div>
              ) : (
                <div className="friend-list">
                  {filteredFriends.map((friend) => (
                    <article key={friend.id} onClick={() => setSelectedPerson(friend)}>
                      <PersonAvatar person={friend} />
                      <div>
                        <strong>{friend.name}</strong>
                        <span>{friend.status}</span>
                        <small>{friend.contexts[0]}</small>
                      </div>
                      <button
                        className={favorites.includes(friend.id) ? "favorite" : ""}
                        aria-label={`Favoritar ${friend.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setFavorites((current) =>
                            current.includes(friend.id)
                              ? current.filter((id) => id !== friend.id)
                              : [...current, friend.id],
                          );
                        }}
                      >
                        <Heart
                          size={18}
                          fill={favorites.includes(friend.id) ? "currentColor" : "none"}
                        />
                      </button>
                      <button
                        aria-label={`Mais opções para ${friend.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSafetyPerson(friend);
                        }}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      <button
                        className="friend-message"
                        onClick={(event) => {
                          event.stopPropagation();
                          showToast(`Conversa com ${friend.name} aberta`);
                        }}
                      >
                        <MessageCircle size={17} /> Mensagem
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="requests-view">
              <nav>
                {(["Recebidas", "Enviadas"] as RequestTab[]).map((item) => (
                  <button
                    key={item}
                    className={requestTab === item ? "active" : ""}
                    onClick={() => setRequestTab(item)}
                  >
                    {item}
                    {item === "Recebidas" && received.length > 0 && <span>{received.length}</span>}
                  </button>
                ))}
              </nav>
              {requestTab === "Recebidas" ? (
                demoState === "no-requests" || received.length === 0 ? (
                  <div className="people-empty compact">
                    <UserCheck size={28} />
                    <h2>Nenhuma solicitação pendente</h2>
                  </div>
                ) : (
                  <div className="request-list">
                    {received.map((request) => (
                      <article key={request.person.id}>
                        <header>
                          <PersonAvatar person={request.person} />
                          <div>
                            <strong>{request.person.name}</strong>
                            <span>{request.context}</span>
                          </div>
                          <button
                            aria-label="Opções"
                            onClick={() => setSafetyPerson(request.person)}
                          >
                            <MoreHorizontal />
                          </button>
                        </header>
                        {request.message && <blockquote>“{request.message}”</blockquote>}
                        <div>
                          <button className="accept" onClick={() => accept(request.person)}>
                            Aceitar
                          </button>
                          <button onClick={() => decline(request.person)}>Recusar</button>
                        </div>
                        <footer>
                          <button onClick={() => setSafetyPerson(request.person)}>
                            <Shield size={15} /> Bloquear ou denunciar
                          </button>
                        </footer>
                      </article>
                    ))}
                  </div>
                )
              ) : requested.length === 0 ? (
                <div className="people-empty compact">
                  <Clock3 size={28} />
                  <h2>Nenhuma solicitação enviada</h2>
                </div>
              ) : (
                <div className="sent-request-list">
                  {people
                    .filter((person) => requested.includes(person.id))
                    .map((person) => (
                      <article key={person.id}>
                        <PersonAvatar person={person} />
                        <div>
                          <strong>{person.name}</strong>
                          <span>Pendente · enviada hoje</span>
                          <small>{person.contexts[0]}</small>
                        </div>
                        <button
                          onClick={() => {
                            setRequested((current) => current.filter((id) => id !== person.id));
                            showToast("Solicitação cancelada");
                          }}
                        >
                          Cancelar
                        </button>
                      </article>
                    ))}
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="people-context-panel">
          {selectedPerson ? (
            <>
              <PersonAvatar person={selectedPerson} size="large" />
              <h2>{selectedPerson.name}</h2>
              <span>
                <MapPin size={13} /> {selectedPerson.location}
              </span>
              <p>{selectedPerson.status}</p>
              <div className="context-interest-list">
                {selectedPerson.interests.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div className="context-relations">
                {selectedPerson.contexts.map((item) => (
                  <span key={item}>
                    <UsersRound size={14} />
                    {item}
                  </span>
                ))}
              </div>
              <button onClick={() => onOpenProfile(selectedPerson.name)}>Abrir Perfil</button>
              <button className="secondary" onClick={() => setRequesting(selectedPerson)}>
                <UserPlus size={17} /> Adicionar Amigo
              </button>
            </>
          ) : (
            <div className="people-context-empty">
              <UsersRound />
              <p>Selecione uma pessoa para ver contexto e ações.</p>
            </div>
          )}
        </aside>
      </div>

      {filtersOpen && (
        <FilterSheet
          onClose={() => setFiltersOpen(false)}
          onApply={(count) => {
            setActiveFilters(count);
            setFiltersOpen(false);
            showToast(`${count} filtros aplicados`);
          }}
        />
      )}
      {privacyOpen && (
        <PrivacySheet
          onClose={() => setPrivacyOpen(false)}
          availability={availability}
          setAvailability={setAvailability}
          privacy={privacy}
          setPrivacy={setPrivacy}
        />
      )}
      {requesting && (
        <FriendRequestSheet
          person={requesting}
          onClose={() => setRequesting(null)}
          onSent={() => {
            setRequested((current) =>
              current.includes(requesting.id) ? current : [...current, requesting.id],
            );
            showToast("Solicitação enviada");
          }}
        />
      )}
      {safetyPerson && (
        <SafetySheet
          person={safetyPerson}
          onClose={() => setSafetyPerson(null)}
          onAction={safetyAction}
          isFriend={friends.some((friend) => friend.id === safetyPerson.id)}
        />
      )}
    </div>
  );
}

export default function PeopleExperience(props: {
  visible: boolean;
  onClose: () => void;
  onOpenProfile: (name: string) => void;
  showToast: (message: string) => void;
}) {
  if (!props.visible) {
    return <div className="people-experience is-hidden" aria-hidden="true" />;
  }

  return (
    <PeopleBoundary onClose={props.onClose}>
      <PeopleContent
        onClose={props.onClose}
        onOpenProfile={props.onOpenProfile}
        showToast={props.showToast}
      />
    </PeopleBoundary>
  );
}
