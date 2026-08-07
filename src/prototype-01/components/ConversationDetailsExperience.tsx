"use client";

import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  CircleUserRound,
  Crown,
  FileText,
  Image as ImageIcon,
  Link2,
  LockKeyhole,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Pin,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "../styles/ConversationDetailsExperience.css";

export type ConversationKind =
  | "person"
  | "group"
  | "space"
  | "event"
  | "purpose"
  | "request"
  | "archived";

type Mode = "create" | "details";
type DetailSection =
  | "Visão geral"
  | "Participantes"
  | "Mídia"
  | "Fixadas"
  | "Busca"
  | "Notificações"
  | "Privacidade";

const people = [
  {
    id: "ana",
    name: "Ana Clara",
    initials: "AC",
    context: "Amiga · conversou hoje",
    state: "available",
  },
  {
    id: "lucas",
    name: "Lucas Almeida",
    initials: "LA",
    context: "Amigo · Café, Bíblia & Amizade",
    state: "available",
  },
  {
    id: "marina",
    name: "Marina Souza",
    initials: "MS",
    context: "Amiga · 4 amigos em comum",
    state: "available",
  },
  {
    id: "juliana",
    name: "Juliana Prado",
    initials: "JP",
    context: "Indisponível para novos grupos",
    state: "unavailable",
  },
  { id: "marcos", name: "Marcos Vieira", initials: "MV", context: "Bloqueado", state: "blocked" },
];

const conversationMeta: Record<
  ConversationKind,
  { label: string; origin: string; description: string }
> = {
  person: {
    label: "Conversa pessoal",
    origin: "Ana Clara",
    description: "Conversa privada entre duas pessoas.",
  },
  group: {
    label: "Grupo privado",
    origin: "Trio de Peruíbe",
    description: "Grupo criado por convite, com até 30 participantes.",
  },
  space: {
    label: "Chat de Espaço",
    origin: "Café, Bíblia & Amizade",
    description: "Funções e audiência refletem o Espaço de origem.",
  },
  event: {
    label: "Chat de Evento",
    origin: "Cinema — Jornada",
    description: "Fica somente leitura 48 horas após o encerramento.",
  },
  purpose: {
    label: "Conversa de Propósito",
    origin: "Caminhada com Ana",
    description: "Registros, pausa e encerramento próprios do Propósito.",
  },
  request: {
    label: "Solicitação",
    origin: "Juliana Prado",
    description: "Aguardando aceite antes de entrar no inbox.",
  },
  archived: {
    label: "Conversa arquivada",
    origin: "Grupo de leitura",
    description: "Arquivada localmente e preservada neste dispositivo.",
  },
};

export default function ConversationDetailsExperience({
  visible,
  mode,
  kind = "group",
  title,
  source = "Conversas",
  onClose,
  onCreate,
  showToast,
}: {
  visible: boolean;
  mode: Mode;
  kind?: ConversationKind;
  title?: string;
  source?: string;
  onClose: () => void;
  onCreate: (name: string) => void;
  showToast: (message: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(["ana"]);
  const [personQuery, setPersonQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [section, setSection] = useState<DetailSection>("Visão geral");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Tudo");
  const [notificationMode, setNotificationMode] = useState("Menções");
  const [muted, setMuted] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [desktopDetailsCollapsed, setDesktopDetailsCollapsed] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "leave" | "remove" | "transfer" | "clear" | null
  >(null);
  const [demoState, setDemoState] = useState("normal");

  useEffect(() => {
    if (!visible) return;
    const initialize = window.setTimeout(() => {
      const saved = window.sessionStorage.getItem("vdn-conversation-details");
      if (!saved) return;
      try {
        const state = JSON.parse(saved) as {
          step?: number;
          selected?: string[];
          groupName?: string;
          description?: string;
          section?: DetailSection;
          searchQuery?: string;
          searchType?: string;
        };
        setStep(mode === "create" ? (state.step ?? 1) : 1);
        setSelected(state.selected ?? ["ana"]);
        setGroupName(state.groupName ?? "");
        setDescription(state.description ?? "");
        setSection(state.section ?? "Visão geral");
        setSearchQuery(state.searchQuery ?? "");
        setSearchType(state.searchType ?? "Tudo");
      } catch {
        setStep(1);
      }
      setDemoState(
        new URLSearchParams(window.location.search).get("conversationState") ?? "normal",
      );
    }, 0);
    return () => window.clearTimeout(initialize);
  }, [visible, mode]);

  useEffect(() => {
    if (!visible) return;
    window.sessionStorage.setItem(
      "vdn-conversation-details",
      JSON.stringify({
        mode,
        kind,
        step,
        selected,
        groupName,
        description,
        section,
        searchQuery,
        searchType,
        source,
      }),
    );
  }, [
    visible,
    mode,
    kind,
    step,
    selected,
    groupName,
    description,
    section,
    searchQuery,
    searchType,
    source,
  ]);

  const filteredPeople = useMemo(
    () =>
      people.filter((person) =>
        `${person.name} ${person.context}`.toLowerCase().includes(personQuery.toLowerCase()),
      ),
    [personQuery],
  );

  if (!visible) return null;

  const meta = conversationMeta[kind];
  const displayTitle = title || meta.origin;

  const togglePerson = (id: string, state: string) => {
    if (state === "blocked") {
      showToast("Pessoas bloqueadas não podem ser adicionadas");
      return;
    }
    if (state === "unavailable") {
      showToast("Esta pessoa não está disponível");
      return;
    }
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 30
          ? [...current, id]
          : current,
    );
  };

  const createGroup = () => {
    const name = groupName.trim() || "Novo grupo";
    onCreate(name);
    window.sessionStorage.removeItem("vdn-conversation-details");
    showToast(`${name} criado como demonstração local`);
  };

  if (mode === "create") {
    return (
      <section
        className="conversation-experience group-creator"
        role="dialog"
        aria-modal="true"
        aria-label="Criar novo grupo"
      >
        <header className="conversation-experience-topbar">
          <button
            aria-label="Voltar"
            onClick={() => (step > 1 ? setStep((current) => current - 1) : onClose())}
          >
            <ArrowLeft size={21} />
          </button>
          <div>
            <span>NOVO GRUPO</span>
            <h1>{step === 1 ? "Escolher pessoas" : step === 2 ? "Identidade" : "Revisar"}</h1>
            <small>Etapa {step} de 3 · máximo 30 pessoas</small>
          </div>
          <button aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="group-step-progress" aria-label={`Etapa ${step} de 3`}>
          <i className={step >= 1 ? "done" : ""} />
          <i className={step >= 2 ? "done" : ""} />
          <i className={step >= 3 ? "done" : ""} />
        </div>

        <main className="group-creator-content">
          {step === 1 && (
            <>
              <label className="conversation-search">
                <Search size={18} />
                <span className="sr-only">Buscar pessoas</span>
                <input
                  value={personQuery}
                  onChange={(event) => setPersonQuery(event.target.value)}
                  placeholder="Buscar entre Amigos"
                />
              </label>
              <div
                className="selected-people"
                aria-label={`${selected.length} pessoas selecionadas`}
              >
                {selected.map((id) => {
                  const person = people.find((item) => item.id === id);
                  if (!person) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => togglePerson(id, person.state)}
                      aria-label={`Remover ${person.name}`}
                    >
                      <span>{person.initials}</span>
                      <small>{person.name.split(" ")[0]}</small>
                      <X size={13} />
                    </button>
                  );
                })}
                {selected.length === 0 && <p>Selecione pelo menos uma pessoa.</p>}
              </div>
              <section className="people-picker">
                <span>RECENTES E AMIGOS</span>
                {filteredPeople.map((person) => {
                  const isSelected = selected.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      disabled={person.state !== "available"}
                      className={isSelected ? "selected" : ""}
                      onClick={() => togglePerson(person.id, person.state)}
                    >
                      <span className="avatar">{person.initials}</span>
                      <span>
                        <strong>{person.name}</strong>
                        <small>{person.context}</small>
                      </span>
                      {isSelected ? (
                        <Check size={18} />
                      ) : person.state === "blocked" ? (
                        <LockKeyhole size={17} />
                      ) : (
                        <UserPlus size={17} />
                      )}
                    </button>
                  );
                })}
              </section>
            </>
          )}

          {step === 2 && (
            <div className="group-identity-form">
              <button
                className="group-image-picker"
                onClick={() => showToast("Seletor de imagem aberto")}
              >
                <ImageIcon size={24} />
                <span>Adicionar imagem</span>
              </button>
              <label>
                <span>Nome do grupo</span>
                <input
                  value={groupName}
                  maxLength={60}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Ex.: Amigos de Peruíbe"
                />
                <small>{groupName.length}/60</small>
              </label>
              <label>
                <span>Descrição</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Conte brevemente o propósito do grupo"
                />
              </label>
              <label>
                <span>Mensagem inicial opcional</span>
                <textarea
                  value={initialMessage}
                  onChange={(event) => setInitialMessage(event.target.value)}
                  placeholder="Dê boas-vindas às pessoas"
                />
              </label>
              <p>
                <LockKeyhole size={15} /> Grupo privado. Cada pessoa recebe um convite interno;
                nenhum link público é criado.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="group-review">
              <div className="group-review-identity">
                <span>{groupName ? groupName.slice(0, 2).toUpperCase() : "NG"}</span>
                <div>
                  <h2>{groupName || "Novo grupo"}</h2>
                  <p>{description || "Sem descrição"}</p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Participantes convidados</dt>
                  <dd>{selected.length}</dd>
                </div>
                <div>
                  <dt>Privacidade</dt>
                  <dd>Grupo privado</dd>
                </div>
                <div>
                  <dt>Quem pode criar</dt>
                  <dd>Conta aprovada</dd>
                </div>
                <div>
                  <dt>Mensagem inicial</dt>
                  <dd>{initialMessage ? "Incluída" : "Não incluída"}</dd>
                </div>
              </dl>
              <section>
                <span>CONVIDADOS</span>
                {selected.map((id) => {
                  const person = people.find((item) => item.id === id);
                  return person ? (
                    <div key={id}>
                      <span>{person.initials}</span>
                      <strong>{person.name}</strong>
                      <small>Convite pendente</small>
                    </div>
                  ) : null;
                })}
              </section>
            </div>
          )}
        </main>
        <footer className="group-creator-footer">
          {step > 1 && <button onClick={() => setStep((current) => current - 1)}>Voltar</button>}
          <button
            className="primary"
            disabled={step === 1 ? selected.length === 0 : step === 2 ? !groupName.trim() : false}
            onClick={() => (step < 3 ? setStep((current) => current + 1) : createGroup())}
          >
            {step < 3 ? "Continuar" : "Criar grupo"}
          </button>
        </footer>
      </section>
    );
  }

  const sections: DetailSection[] =
    kind === "person"
      ? ["Visão geral", "Mídia", "Busca", "Notificações", "Privacidade"]
      : [
          "Visão geral",
          "Participantes",
          "Mídia",
          "Fixadas",
          "Busca",
          "Notificações",
          "Privacidade",
        ];

  return (
    <section
      className="conversation-experience conversation-details"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${displayTitle}`}
    >
      <header className="conversation-experience-topbar">
        <button aria-label="Voltar para a conversa" onClick={onClose}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <span>{meta.label.toUpperCase()}</span>
          <h1>Detalhes</h1>
          <small>Origem: {source}</small>
        </div>
        <button aria-label="Mais opções" onClick={() => setSection("Privacidade")}>
          <MoreHorizontal size={21} />
        </button>
      </header>

      <div
        className={`conversation-three-region-shell ${desktopDetailsCollapsed ? "details-collapsed" : ""}`}
      >
        <aside className="conversation-inbox-region" aria-label="Inbox">
          <span>INBOX</span>
          {[
            ["Ana Clara", "Também gostei daquele texto…", "AC"],
            ["Café, Bíblia & Amizade", "Hoje às 21h30", "CB"],
            ["Trio de Peruíbe", "Marina enviou uma foto", "TP"],
          ].map(([name, preview, initials]) => (
            <button
              key={name}
              className={name === displayTitle ? "active" : ""}
              onClick={() => showToast(`${name} preservado no inbox`)}
            >
              <span>{initials}</span>
              <span>
                <strong>{name}</strong>
                <small>{preview}</small>
              </span>
            </button>
          ))}
        </aside>
        <section className="conversation-thread-region" aria-label="Conversa">
          <header>
            <span className={`conversation-kind kind-${kind}`}>
              {displayTitle.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{displayTitle}</strong>
              <small>{meta.label}</small>
            </div>
            <button onClick={() => setDesktopDetailsCollapsed((current) => !current)}>
              {desktopDetailsCollapsed ? "Mostrar detalhes" : "Ocultar detalhes"}
            </button>
          </header>
          <div>
            <span>Hoje</span>
            <p>Oi, pessoal! O encontro continua confirmado?</p>
            <p className="sent">Sim. Domingo às 21h30.</p>
            <p>Perfeito, vou fixar o aviso para todos.</p>
          </div>
          <footer>
            <span>Mensagem</span>
            <button aria-label="Enviar mensagem demonstrativa">
              <MessageCircle size={18} />
            </button>
          </footer>
        </section>
        <div className="conversation-details-layout">
          <aside className="conversation-details-nav">
            <div className="conversation-identity-card">
              <span className={`conversation-kind kind-${kind}`}>
                {displayTitle.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2>{displayTitle}</h2>
                <p>{meta.label}</p>
              </div>
              {kind !== "person" && (
                <button aria-label="Editar identidade" onClick={() => setSection("Visão geral")}>
                  <MoreHorizontal size={18} />
                </button>
              )}
            </div>
            <nav aria-label="Seções dos detalhes">
              {sections.map((item) => (
                <button
                  key={item}
                  className={section === item ? "active" : ""}
                  onClick={() => setSection(item)}
                >
                  {item === "Participantes" ? (
                    <UsersRound size={18} />
                  ) : item === "Mídia" ? (
                    <ImageIcon size={18} />
                  ) : item === "Fixadas" ? (
                    <Pin size={18} />
                  ) : item === "Busca" ? (
                    <Search size={18} />
                  ) : item === "Notificações" ? (
                    <Bell size={18} />
                  ) : item === "Privacidade" ? (
                    <Shield size={18} />
                  ) : (
                    <MessageCircle size={18} />
                  )}
                  <span>{item}</span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </nav>
          </aside>

          <main className="conversation-details-content">
            {demoState === "loading" ? (
              <div className="conversation-detail-skeleton">
                <i />
                <i />
                <i />
              </div>
            ) : demoState === "offline" ? (
              <div className="conversation-detail-state">
                <WifiOff size={28} />
                <h2>Detalhes salvos neste dispositivo</h2>
                <p>Algumas ações ficarão pendentes até a conexão voltar.</p>
                <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
              </div>
            ) : (
              <>
                {section === "Visão geral" && (
                  <div className="conversation-detail-section">
                    <span>IDENTIDADE</span>
                    <h2>{displayTitle}</h2>
                    <p>{meta.description}</p>
                    {kind === "purpose" && (
                      <div className="purpose-status">
                        <Shield size={19} />
                        <span>
                          <strong>Propósito em andamento</strong>
                          <small>2 participantes · registros preservados · pausa disponível</small>
                        </span>
                      </div>
                    )}
                    {kind === "event" && (
                      <div className="read-only-notice">
                        <ClockIcon />{" "}
                        <span>
                          <strong>Conversa vinculada ao Evento</strong>
                          <small>Ficará somente leitura 48 horas após o encerramento.</small>
                        </span>
                      </div>
                    )}
                    {kind !== "person" && (
                      <div className="conversation-form">
                        <label>
                          <span>Nome</span>
                          <input defaultValue={displayTitle} />
                        </label>
                        <label>
                          <span>Descrição</span>
                          <textarea defaultValue={meta.description} />
                        </label>
                        <label>
                          <span>Regras</span>
                          <textarea defaultValue="Respeite o contexto, escute antes de responder e não compartilhe conteúdo privado." />
                        </label>
                        <label>
                          <span>Quem pode editar</span>
                          <select defaultValue="Administradores">
                            <option>Somente proprietário</option>
                            <option>Administradores</option>
                            <option>Todos os membros</option>
                          </select>
                        </label>
                        <label>
                          <span>Quem pode convidar</span>
                          <select defaultValue="Administradores">
                            <option>Somente proprietário</option>
                            <option>Administradores</option>
                            <option>Todos os membros</option>
                          </select>
                        </label>
                        <label>
                          <span>Quem pode fixar</span>
                          <select defaultValue="Administradores">
                            <option>Somente proprietário</option>
                            <option>Administradores</option>
                            <option>Todos os membros</option>
                          </select>
                        </label>
                        <button onClick={() => showToast("Alterações locais salvas")}>
                          Salvar alterações
                        </button>
                      </div>
                    )}
                    {kind === "person" && (
                      <div className="conversation-form">
                        <label>
                          <span>Apelido local opcional</span>
                          <input placeholder="Visível somente para você" />
                        </label>
                        <button onClick={() => showToast("Apelido salvo neste dispositivo")}>
                          Salvar apelido
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {section === "Participantes" && (
                  <div className="conversation-detail-section">
                    <span>PARTICIPANTES E CONVITES</span>
                    <h2>4 pessoas</h2>
                    <button
                      className="invite-button"
                      onClick={() => showToast("Convite interno aberto")}
                    >
                      <UserPlus size={17} /> Convidar pessoas
                    </button>
                    <div className="member-list">
                      {[
                        ["Antonio Rodrigues", "AR", "Proprietário", "Ativo"],
                        ["Ana Clara", "AC", "Administradora", "Ativa"],
                        ["Lucas Almeida", "LA", "Membro", "Ativo"],
                        ["Marina Souza", "MS", "Convidada", "Pendente"],
                        ["Juliana Prado", "JP", "Convidada", "Expirado"],
                      ].map(([name, initials, role, state]) => (
                        <button key={name} onClick={() => setSelectedMember(name)}>
                          <span className="avatar">{initials}</span>
                          <span>
                            <strong>{name}</strong>
                            <small>{state}</small>
                          </span>
                          <em>
                            {role === "Proprietário" ? (
                              <Crown size={13} />
                            ) : role === "Administradora" ? (
                              <Shield size={13} />
                            ) : null}
                            {role}
                          </em>
                          <MoreHorizontal size={17} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {section === "Mídia" && (
                  <div className="conversation-detail-section">
                    <span>COMPARTILHADO NESTA CONVERSA</span>
                    <h2>Mídia e arquivos</h2>
                    <div className="media-tabs">
                      {["Mídia", "Documentos", "Links", "Áudio"].map((item) => (
                        <button
                          key={item}
                          className={searchType === item ? "active" : ""}
                          onClick={() => setSearchType(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="conversation-media-grid">
                      {[
                        ["/community-peruibe.png", "Caminhada no litoral"],
                        ["/profile-coast-dusk.png", "Entardecer em Peruíbe"],
                        ["/pet-bento.png", "Bento no cantinho"],
                      ].map(([src, alt], index) => (
                        <button
                          key={src}
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent("vdn-open-media", {
                                detail: { kind: "chat", title: displayTitle, index },
                              }),
                            )
                          }
                        >
                          <img src={src} alt={alt} />
                          <span>Abrir origem</span>
                        </button>
                      ))}
                    </div>
                    <div className="file-list">
                      <button>
                        <FileText size={20} />
                        <span>
                          <strong>Roteiro do encontro.pdf</strong>
                          <small>Lucas · 1,2 MB</small>
                        </span>
                        <MoreHorizontal size={17} />
                      </button>
                      <button>
                        <Link2 size={20} />
                        <span>
                          <strong>Plano de leitura João</strong>
                          <small>verbo.app · Ana</small>
                        </span>
                        <MoreHorizontal size={17} />
                      </button>
                      <button>
                        <Mic size={20} />
                        <span>
                          <strong>Áudio · 00:42</strong>
                          <small>Marina · ontem</small>
                        </span>
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  </div>
                )}

                {section === "Fixadas" && (
                  <div className="conversation-detail-section">
                    <span>MENSAGENS E CONTEÚDOS</span>
                    <h2>Fixadas</h2>
                    <div className="pinned-list">
                      <button onClick={() => showToast("Mensagem original destacada")}>
                        <Pin size={18} />
                        <span>
                          <strong>Encontro domingo às 21h30</strong>
                          <small>Lucas · fixada por Ana · 26 jul</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={() => showToast("Evento original aberto")}>
                        <Pin size={18} />
                        <span>
                          <strong>Conversa sobre João 8</strong>
                          <small>Evento · fixado por Antonio</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>
                )}

                {section === "Busca" && (
                  <div className="conversation-detail-section conversation-search-section">
                    <span>BUSCA NA CONVERSA</span>
                    <h2>Encontrar mensagens</h2>
                    <label className="conversation-search">
                      <Search size={18} />
                      <span className="sr-only">Pesquisar na conversa</span>
                      <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Mensagem, pessoa ou arquivo"
                      />
                    </label>
                    <div className="search-filters">
                      {["Tudo", "Pessoa", "Período", "Mídia", "Links", "Documentos"].map((item) => (
                        <button
                          key={item}
                          className={searchType === item ? "active" : ""}
                          onClick={() => setSearchType(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="search-results">
                      {searchQuery ? (
                        <>
                          <button
                            onClick={() => {
                              showToast("Mensagem destacada na conversa");
                              onClose();
                            }}
                          >
                            <MessageCircle size={18} />
                            <span>
                              <strong>“A parte sobre a verdade…”</strong>
                              <small>Ana Clara · hoje, 14:32</small>
                            </span>
                            <ChevronRight size={17} />
                          </button>
                          <button
                            onClick={() => {
                              showToast("Mídia aberta na origem");
                              setSection("Mídia");
                            }}
                          >
                            <ImageIcon size={18} />
                            <span>
                              <strong>Foto do litoral</strong>
                              <small>Marina · ontem</small>
                            </span>
                            <ChevronRight size={17} />
                          </button>
                        </>
                      ) : (
                        <div>
                          <Search size={24} />
                          <p>
                            Pesquise para encontrar mensagens, pessoas e mídia sem perder sua
                            posição.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section === "Notificações" && (
                  <div className="conversation-detail-section">
                    <span>NOTIFICAÇÕES DESTA CONVERSA</span>
                    <h2>Como avisar você</h2>
                    <div className="notification-options">
                      {["Todas", "Menções", "Somente respostas", "Silenciado"].map((item) => (
                        <button
                          key={item}
                          className={notificationMode === item ? "active" : ""}
                          onClick={() => {
                            setNotificationMode(item);
                            setMuted(item === "Silenciado");
                          }}
                        >
                          {notificationMode === item && <Check size={16} />}
                          <span>
                            <strong>{item}</strong>
                            <small>
                              {item === "Todas"
                                ? "Mensagens e atividades"
                                : item === "Menções"
                                  ? "Quando citarem você"
                                  : item === "Somente respostas"
                                    ? "Respostas às suas mensagens"
                                    : "Escolha uma duração"}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                    {muted && (
                      <label>
                        <span>Duração</span>
                        <select defaultValue="8 horas">
                          <option>1 hora</option>
                          <option>8 horas</option>
                          <option>1 semana</option>
                          <option>Até eu reativar</option>
                        </select>
                      </label>
                    )}
                    <div className="notification-toggles">
                      <button onClick={() => showToast("Som alternado")}>
                        <Bell size={18} />
                        <span>Som</span>
                        <em>Ativo</em>
                      </button>
                      <button onClick={() => showToast("Vibração alternada")}>
                        <VolumeX size={18} />
                        <span>Vibração</span>
                        <em>Ativa</em>
                      </button>
                    </div>
                    <p>Preferências globais continuam em Configurações.</p>
                  </div>
                )}

                {section === "Privacidade" && (
                  <div className="conversation-detail-section">
                    <span>PRIVACIDADE E SEGURANÇA</span>
                    <h2>Ações da conversa</h2>
                    <div className="safety-actions">
                      <button onClick={() => showToast("Conversa arquivada")}>
                        <MessageCircle size={18} />
                        <span>
                          <strong>Arquivar conversa</strong>
                          <small>Remover do inbox sem excluir</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={() => showToast("Pessoa restringida localmente")}>
                        <Shield size={18} />
                        <span>
                          <strong>Restringir</strong>
                          <small>Limitar interações sem avisar</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={() => showToast("Fluxo de denúncia aberto")}>
                        <ShieldAlert size={18} />
                        <span>
                          <strong>Denunciar conversa</strong>
                          <small>Escolher motivo e conteúdo</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      <button onClick={() => setConfirmAction("clear")}>
                        <Trash2 size={18} />
                        <span>
                          <strong>Limpar histórico local</strong>
                          <small>Somente neste dispositivo</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      {kind !== "person" && (
                        <button className="danger" onClick={() => setConfirmAction("leave")}>
                          <ArrowLeft size={18} />
                          <span>
                            <strong>Sair do grupo</strong>
                            <small>
                              {kind === "group"
                                ? "Transfira a propriedade quando necessário"
                                : "Você pode voltar pela origem"}
                            </small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      )}
                    </div>
                    <p className="security-note">
                      Este protótipo não faz alegação de criptografia ponta a ponta.
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {selectedMember && (
        <div className="conversation-backdrop" onMouseDown={() => setSelectedMember(null)}>
          <section
            className="conversation-action-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2>{selectedMember}</h2>
              <button aria-label="Fechar" onClick={() => setSelectedMember(null)}>
                <X size={19} />
              </button>
            </header>
            <button onClick={() => showToast("Perfil aberto")}>
              <CircleUserRound size={18} /> Ver Perfil
            </button>
            <button
              onClick={() => {
                showToast("Convite reenviado");
                setSelectedMember(null);
              }}
            >
              <UserPlus size={18} /> Reenviar convite
            </button>
            <button
              onClick={() => {
                showToast("Função alterada localmente");
                setSelectedMember(null);
              }}
            >
              <Shield size={18} /> Promover ou remover função
            </button>
            <button onClick={() => setConfirmAction("remove")} className="danger">
              <UserMinus size={18} /> Remover membro
            </button>
          </section>
        </div>
      )}

      {confirmAction && (
        <div className="conversation-backdrop" onMouseDown={() => setConfirmAction(null)}>
          <section
            className="conversation-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirmar ação"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <ShieldAlert size={26} />
            <h2>
              {confirmAction === "leave"
                ? "Sair da conversa?"
                : confirmAction === "remove"
                  ? "Remover participante?"
                  : confirmAction === "transfer"
                    ? "Transferir propriedade?"
                    : "Limpar histórico local?"}
            </h2>
            <p>
              {confirmAction === "leave"
                ? "Como proprietário, escolha primeiro quem assumirá o grupo. O grupo não ficará sem proprietário."
                : confirmAction === "remove"
                  ? "Você pode informar um motivo e impedir a reentrada por convite."
                  : "Esta ação afeta somente a demonstração neste dispositivo."}
            </p>
            {confirmAction === "leave" && (
              <button onClick={() => setConfirmAction("transfer")}>
                <Crown size={17} /> Escolher novo proprietário
              </button>
            )}
            {confirmAction === "remove" && (
              <label>
                <span>Motivo opcional</span>
                <input placeholder="Explique brevemente" />
              </label>
            )}
            <div>
              <button onClick={() => setConfirmAction(null)}>Cancelar</button>
              <button
                className="danger"
                onClick={() => {
                  showToast(
                    confirmAction === "leave"
                      ? "Saída concluída"
                      : confirmAction === "remove"
                        ? "Participante removido"
                        : confirmAction === "transfer"
                          ? "Propriedade transferida"
                          : "Histórico local limpo",
                  );
                  setConfirmAction(null);
                  setSelectedMember(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function ClockIcon() {
  return <Bell size={19} />;
}
