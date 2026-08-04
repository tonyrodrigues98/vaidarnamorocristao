"use client";

import {
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronLeft,
  CircleAlert,
  Clapperboard,
  Clock3,
  Ellipsis,
  Gamepad2,
  Gift,
  HeartHandshake,
  MessageCircle,
  PawPrint,
  Radio,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  UserPlus,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import "../styles/ActivityExperience.css";

type ActivityTab = "Todas" | "Comunidade" | "Convites" | "Atividades" | "Sistema";
type Priority = "critical" | "important" | "normal" | "silent";
type Destination =
  | "messages"
  | "community"
  | "profile"
  | "people"
  | "events"
  | "cinema"
  | "live"
  | "trust"
  | "verbo"
  | "pets"
  | "store"
  | "gifts"
  | "security";

type ActivityItem = {
  id: string;
  tab: Exclude<ActivityTab, "Todas">;
  section: "Agora" | "Hoje" | "Ontem" | "Esta semana" | "Anteriores";
  title: string;
  context: string;
  time: string;
  priority: Priority;
  destination: Destination;
  action?: string;
  icon: typeof Bell;
  grouped?: boolean;
};

const activityItems: ActivityItem[] = [
  {
    id: "security",
    tab: "Sistema",
    section: "Agora",
    title: "Novo acesso reconhecido no seu iPhone",
    context: "Peruíbe, SP · Se não foi você, revise a segurança da conta.",
    time: "2 min",
    priority: "critical",
    destination: "security",
    action: "Revisar",
    icon: ShieldAlert,
  },
  {
    id: "verification",
    tab: "Sistema",
    section: "Agora",
    title: "Sua verificação precisa de uma correção",
    context: "Atualize a foto principal para enviar novamente.",
    time: "5 min",
    priority: "important",
    destination: "trust",
    action: "Corrigir",
    icon: ShieldAlert,
  },
  {
    id: "friend",
    tab: "Convites",
    section: "Agora",
    title: "Marina enviou uma solicitação de amizade",
    context: "Vocês participam de Café, Bíblia & Amizade.",
    time: "8 min",
    priority: "important",
    destination: "people",
    action: "Aceitar",
    icon: UserPlus,
  },
  {
    id: "cinema",
    tab: "Atividades",
    section: "Hoje",
    title: "Cinema em comunidade começa em 20 minutos",
    context: "Sala Oficial · 32 pessoas confirmadas.",
    time: "19:40",
    priority: "important",
    destination: "cinema",
    action: "Entrar",
    icon: Clapperboard,
  },
  {
    id: "live",
    tab: "Atividades",
    section: "Agora",
    title: "A Live oficial está no ar",
    context: "Comunidade que acolhe · 186 pessoas assistindo.",
    time: "Agora",
    priority: "important",
    destination: "live",
    action: "Assistir",
    icon: Radio,
  },
  {
    id: "reactions",
    tab: "Comunidade",
    section: "Hoje",
    title: "Ana e mais 8 pessoas reagiram à sua publicação",
    context: "“Como manter a constância nos dias difíceis?”",
    time: "17:12",
    priority: "normal",
    destination: "community",
    icon: HeartHandshake,
    grouped: true,
  },
  {
    id: "mention",
    tab: "Comunidade",
    section: "Hoje",
    title: "Lucas mencionou você em um comentário",
    context: "Comunidade · Pedido de oração",
    time: "15:06",
    priority: "normal",
    destination: "community",
    action: "Ver",
    icon: MessageCircle,
  },
  {
    id: "event",
    tab: "Convites",
    section: "Ontem",
    title: "Você foi convidado para um evento online",
    context: "Conversa sobre João 8 · amanhã às 21h30.",
    time: "Ontem",
    priority: "normal",
    destination: "events",
    action: "Participar",
    icon: UsersRound,
  },
  {
    id: "verbo",
    tab: "Atividades",
    section: "Esta semana",
    title: "Seu plano do Verbo está pronto para continuar",
    context: "Evangelho de João · dia 4 de 7.",
    time: "Seg",
    priority: "silent",
    destination: "verbo",
    icon: BookOpen,
  },
  {
    id: "pet",
    tab: "Atividades",
    section: "Esta semana",
    title: "Bento encontrou uma missão leve",
    context: "Passe alguns minutos no Habitat quando quiser.",
    time: "Dom",
    priority: "silent",
    destination: "pets",
    icon: PawPrint,
  },
  {
    id: "gift",
    tab: "Convites",
    section: "Hoje",
    title: "Você recebeu um presente de Ana Clara",
    context: "Luz de Encontro · aceite ou recuse com tranquilidade.",
    time: "14:32",
    priority: "important",
    destination: "gifts",
    action: "Ver",
    icon: Gift,
  },
  {
    id: "reward",
    tab: "Atividades",
    section: "Hoje",
    title: "Uma recompensa está disponível",
    context: "Badge Acolhida · sem prazo para coletar.",
    time: "12:18",
    priority: "normal",
    destination: "gifts",
    action: "Coletar",
    icon: Gift,
  },
  {
    id: "box",
    tab: "Atividades",
    section: "Ontem",
    title: "Você recebeu uma Caixa Caminhos",
    context: "Probabilidades e garantia disponíveis antes de abrir.",
    time: "Ontem",
    priority: "normal",
    destination: "gifts",
    action: "Ver caixa",
    icon: Gift,
  },
  {
    id: "code-expiring",
    tab: "Sistema",
    section: "Esta semana",
    title: "Seu código expira em breve",
    context: "VDN-CAMINHOS · use quando fizer sentido.",
    time: "Seg",
    priority: "silent",
    destination: "gifts",
    icon: Gift,
  },
  {
    id: "arcade",
    tab: "Atividades",
    section: "Anteriores",
    title: "Seu resultado do Quiz foi registrado",
    context: "8 de 10 respostas · novo melhor resultado.",
    time: "24 jul",
    priority: "silent",
    destination: "community",
    icon: Gamepad2,
  },
  {
    id: "maintenance",
    tab: "Sistema",
    section: "Anteriores",
    title: "Manutenção concluída",
    context: "Todos os recursos voltaram a operar normalmente.",
    time: "22 jul",
    priority: "silent",
    destination: "security",
    icon: RefreshCw,
  },
];

class ActivityBoundary extends Component<
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
        <div className="activity-local-error">
          <CircleAlert />
          <h1>A Central não pôde ser carregada</h1>
          <p>As demais áreas continuam funcionando normalmente.</p>
          <button onClick={() => this.setState({ failed: false })}>Tentar novamente</button>
          <button className="ghost" onClick={this.props.onClose}>
            Voltar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ActivityContent({
  onClose,
  onNavigate,
  onOpenSettings,
  showToast,
}: {
  onClose: () => void;
  onNavigate: (destination: Destination) => void;
  onOpenSettings: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<ActivityTab>(() => {
    if (typeof window === "undefined") return "Todas";
    try {
      return (
        (
          JSON.parse(window.sessionStorage.getItem("vdn-activity-state") ?? "{}") as {
            tab?: ActivityTab;
          }
        ).tab ?? "Todas"
      );
    } catch {
      return "Todas";
    }
  });
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [period, setPeriod] = useState("Todo período");
  const [readIds, setReadIds] = useState<string[]>(["maintenance"]);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("security");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [demoState, setDemoState] = useState<"normal" | "loading" | "offline" | "error" | "empty">(
    "loading",
  );
  const [undoSnapshot, setUndoSnapshot] = useState<string[] | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("vdn-activity-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { tab?: ActivityTab; scroll?: number };
        window.setTimeout(() => listRef.current?.scrollTo({ top: parsed.scroll ?? 0 }), 0);
      } catch {}
    }
    const timer = window.setTimeout(() => setDemoState("normal"), 520);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (demoState === "empty") return [];
    return activityItems.filter((item) => {
      if (tab !== "Todas" && item.tab !== tab) return false;
      if (unreadOnly && readIds.includes(item.id)) return false;
      if (period === "Hoje" && !["Agora", "Hoje"].includes(item.section)) return false;
      if (period === "Esta semana" && item.section === "Anteriores") return false;
      if (query && !`${item.title} ${item.context}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [demoState, period, query, readIds, tab, unreadOnly]);

  const selected = activityItems.find((item) => item.id === selectedId) ?? activityItems[0];
  const unreadCount = activityItems.filter(
    (item) => !readIds.includes(item.id) && item.priority !== "silent",
  ).length;
  const sections = ["Agora", "Hoje", "Ontem", "Esta semana", "Anteriores"] as const;

  const rememberAndNavigate = (item: ActivityItem, scroll = 0) => {
    window.sessionStorage.setItem("vdn-activity-state", JSON.stringify({ tab, scroll }));
    setReadIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
    onNavigate(item.destination);
  };

  const markAll = () => {
    setUndoSnapshot(readIds);
    setReadIds(activityItems.map((item) => item.id));
    showToast("Tudo marcado como lido · Desfazer disponível");
  };

  const undo = () => {
    if (!undoSnapshot) return;
    setReadIds(undoSnapshot);
    setUndoSnapshot(null);
    showToast("Alteração desfeita");
  };

  const primaryAction = (item: ActivityItem) => {
    if (item.id === "friend") {
      setAcceptedIds((current) => [...current, item.id]);
      setReadIds((current) => [...new Set([...current, item.id])]);
      showToast("Solicitação aceita");
      return;
    }
    rememberAndNavigate(item);
  };

  return (
    <section className="activity-experience" aria-label="Central de Atividade">
      <header className="activity-topbar">
        <button aria-label="Voltar" onClick={onClose}>
          <ChevronLeft />
        </button>
        <div>
          <h1>Atividade</h1>
          {unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </div>
        <button aria-label="Mais opções" onClick={() => setFilterOpen(true)}>
          <Ellipsis />
        </button>
      </header>

      <div className="activity-tabs-shell">
        <nav aria-label="Categorias de atividade">
          {(["Todas", "Comunidade", "Convites", "Atividades", "Sistema"] as ActivityTab[]).map(
            (item) => (
              <button
                className={tab === item ? "active" : ""}
                key={item}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ),
          )}
        </nav>
      </div>

      <div className="activity-toolbar">
        <div className="activity-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou contexto"
            aria-label="Buscar atividade"
          />
          {query && (
            <button aria-label="Limpar busca" onClick={() => setQuery("")}>
              <X />
            </button>
          )}
        </div>
        <button
          className={unreadOnly ? "active" : ""}
          onClick={() => setUnreadOnly((value) => !value)}
        >
          Não lidas
        </button>
        <button onClick={() => setFilterOpen(true)}>
          <Clock3 /> {period}
        </button>
      </div>

      <div className="activity-layout">
        <div className="activity-list" ref={listRef}>
          <div className="activity-list-heading">
            <span>{filtered.length ? `${unreadCount} itens pedem atenção` : "Tudo em dia"}</span>
            <button onClick={markAll}>Marcar tudo como lido</button>
          </div>

          {demoState === "loading" ? (
            <div className="activity-skeleton" aria-label="Carregando atividade">
              {[1, 2, 3, 4].map((item) => (
                <i key={item} />
              ))}
            </div>
          ) : demoState === "offline" ? (
            <div className="activity-state">
              <WifiOff />
              <h2>Atividade salva neste dispositivo</h2>
              <p>Novos itens aparecerão quando a conexão voltar.</p>
              <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
            </div>
          ) : demoState === "error" ? (
            <div className="activity-state">
              <RefreshCw />
              <h2>Parte da atividade não carregou</h2>
              <p>Os itens já disponíveis continuam acessíveis.</p>
              <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="activity-state">
              <Check />
              <h2>Tudo em dia</h2>
              <p>Quando algo precisar da sua atenção, aparecerá aqui.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setUnreadOnly(false);
                  setPeriod("Todo período");
                  setDemoState("normal");
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            sections.map((section) => {
              const sectionItems = filtered.filter((item) => item.section === section);
              if (!sectionItems.length) return null;
              return (
                <section className="activity-section" key={section}>
                  <h2>{section}</h2>
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const read = readIds.includes(item.id);
                    const accepted = acceptedIds.includes(item.id);
                    return (
                      <article
                        className={`activity-row priority-${item.priority} ${read ? "read" : "unread"} ${selectedId === item.id ? "selected" : ""}`}
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <button
                          className="activity-row-main"
                          onClick={(event) =>
                            rememberAndNavigate(
                              item,
                              event.currentTarget.closest(".activity-list")?.scrollTop ?? 0,
                            )
                          }
                        >
                          <span className="activity-item-icon">
                            <Icon />
                          </span>
                          <span className="activity-item-copy">
                            <strong>{item.title}</strong>
                            <small>{item.context}</small>
                            <em>
                              {item.time}
                              {item.grouped ? " · agrupada" : ""}
                            </em>
                          </span>
                          {!read && <i className="unread-dot" aria-label="Não lida" />}
                        </button>
                        <div className="activity-row-actions">
                          {item.action && (
                            <button disabled={accepted} onClick={() => primaryAction(item)}>
                              {accepted ? "Aceito" : item.action}
                            </button>
                          )}
                          <button
                            aria-label={`Opções de ${item.title}`}
                            onClick={() => setMenuId(item.id)}
                          >
                            <Ellipsis />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              );
            })
          )}
        </div>

        <aside className="activity-context" aria-label="Contexto selecionado">
          <span className={`context-priority ${selected.priority}`}>
            {selected.priority === "critical" ? "ATENÇÃO À SEGURANÇA" : selected.tab.toUpperCase()}
          </span>
          <div className="context-icon">
            <selected.icon />
          </div>
          <h2>{selected.title}</h2>
          <p>{selected.context}</p>
          <small>
            {selected.section} · {selected.time}
          </small>
          <button className="context-primary" onClick={() => primaryAction(selected)}>
            {selected.action ?? "Abrir contexto"}
          </button>
          <button
            onClick={() =>
              setReadIds((current) =>
                current.includes(selected.id)
                  ? current.filter((id) => id !== selected.id)
                  : [...current, selected.id],
              )
            }
          >
            {readIds.includes(selected.id) ? "Marcar como não lida" : "Marcar como lida"}
          </button>
        </aside>
      </div>

      {undoSnapshot && (
        <div className="activity-undo" role="status">
          <span>Itens marcados como lidos</span>
          <button onClick={undo}>Desfazer</button>
        </div>
      )}

      {menuId && (
        <div className="activity-backdrop" onMouseDown={() => setMenuId(null)}>
          <section className="activity-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <span className="sheet-handle" />
            <h2>Opções da notificação</h2>
            <button
              onClick={() => {
                setReadIds((current) => [...new Set([...current, menuId])]);
                setMenuId(null);
              }}
            >
              <Check /> Marcar como lida
            </button>
            <button
              onClick={() => {
                setMutedIds((current) => [...current, menuId]);
                setMenuId(null);
                showToast("Este tipo foi silenciado");
              }}
            >
              <BellOff /> {mutedIds.includes(menuId) ? "Tipo silenciado" : "Silenciar este tipo"}
            </button>
            <button
              onClick={() => {
                setMenuId(null);
                onOpenSettings();
              }}
            >
              <Settings /> Configurar notificações
            </button>
            <button
              onClick={() => {
                setMenuId(null);
                showToast("Veremos menos atividades deste tipo");
              }}
            >
              <Bell /> Ver menos deste tipo
            </button>
          </section>
        </div>
      )}

      {filterOpen && (
        <div className="activity-backdrop" onMouseDown={() => setFilterOpen(false)}>
          <section className="activity-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <span className="sheet-handle" />
            <h2>Filtros e demonstração</h2>
            <span className="activity-sheet-label">PERÍODO</span>
            {["Todo período", "Hoje", "Esta semana"].map((item) => (
              <button
                className={period === item ? "selected" : ""}
                key={item}
                onClick={() => {
                  setPeriod(item);
                  setFilterOpen(false);
                }}
              >
                {item}
                {period === item && <Check />}
              </button>
            ))}
            <span className="activity-sheet-label">ESTADOS</span>
            <div className="demo-state-row">
              {(["normal", "loading", "offline", "error", "empty"] as const).map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setDemoState(state);
                    setFilterOpen(false);
                  }}
                >
                  {state}
                </button>
              ))}
            </div>
            <div className="daily-summary">
              <span>
                <strong>Resumo diário</strong>
                <small>Agrupa atividades não urgentes. Itens críticos chegam imediatamente.</small>
              </span>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="push-demo">
              <strong>Push neste dispositivo</strong>
              <span>Permissão não solicitada</span>
              <button
                onClick={() =>
                  showToast("A explicação contextual seria exibida antes do prompt nativo")
                }
              >
                Entender antes de permitir
              </button>
              <small>Também demonstra: negado, sem suporte, agrupado, badge e silencioso.</small>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default function ActivityExperience({
  visible,
  onClose,
  onNavigate,
  onOpenSettings,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (destination: Destination) => void;
  onOpenSettings: () => void;
  showToast: (message: string) => void;
}) {
  if (!visible) return null;
  return (
    <ActivityBoundary onClose={onClose}>
      <ActivityContent
        onClose={onClose}
        onNavigate={onNavigate}
        onOpenSettings={onOpenSettings}
        showToast={showToast}
      />
    </ActivityBoundary>
  );
}
