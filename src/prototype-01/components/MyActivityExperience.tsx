"use client";

import {
  Archive,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleUserRound,
  Clapperboard,
  Clock3,
  Copy,
  FilePenLine,
  Filter,
  FolderPlus,
  Globe2,
  History,
  LockKeyhole,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Search,
  Share2,
  ShoppingBag,
  Trash2,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/MyActivityExperience.css";

type ActivityTab = "Atividade" | "Salvos" | "Rascunhos" | "Histórico";
type DemoState = "normal" | "loading" | "offline" | "error" | "empty";
type Item = {
  id: string;
  tab: ActivityTab;
  type: string;
  title: string;
  context: string;
  date: string;
  group: string;
  status: string;
  audience: string;
  preview: string;
  progress?: number;
  collection?: string;
};

const tabs: ActivityTab[] = ["Atividade", "Salvos", "Rascunhos", "Histórico"];

const items: Item[] = [
  {
    id: "a1",
    tab: "Atividade",
    type: "Publicação",
    title: "A fé que aparece no cotidiano",
    context: "Comunidade",
    date: "Hoje · 18:42",
    group: "Publicações",
    status: "Publicado",
    audience: "Comunidade",
    preview: "Pequenas escolhas também revelam aquilo em que acreditamos.",
  },
  {
    id: "a2",
    tab: "Atividade",
    type: "Comentário",
    title: "Resposta para Ana Clara",
    context: "Café, Bíblia & Amizade",
    date: "Hoje · 16:20",
    group: "Comentários",
    status: "Publicado",
    audience: "Espaço",
    preview: "Gostei da forma como você conectou João 8 com a vida real.",
  },
  {
    id: "a3",
    tab: "Atividade",
    type: "Momento",
    title: "Fim de tarde em Peruíbe",
    context: "Seu Momento",
    date: "Ontem · 18:07",
    group: "Momentos",
    status: "Ativo por 8h",
    audience: "Amigos",
    preview: "Foto do litoral com uma breve reflexão.",
  },
  {
    id: "a4",
    tab: "Atividade",
    type: "Evento",
    title: "Conversa sobre João 8",
    context: "Cristãos do Litoral Sul",
    date: "24 jul",
    group: "Eventos",
    status: "Agendado",
    audience: "Espaço",
    preview: "Encontro online para leitura e conversa.",
  },
  {
    id: "a5",
    tab: "Atividade",
    type: "Espaço",
    title: "Café, Bíblia & Amizade",
    context: "Você administra",
    date: "22 jul",
    group: "Espaços",
    status: "Ativo",
    audience: "Público",
    preview: "248 membros · 18 pessoas ativas agora.",
  },
  {
    id: "s1",
    tab: "Salvos",
    type: "Verbo",
    title: "João 8:32 — A verdade liberta",
    context: "Versículo salvo",
    date: "Hoje · 20:12",
    group: "Verbo",
    status: "Salvo",
    audience: "Somente eu",
    preview: "NAA · incluído em Leituras para voltar",
    collection: "Leituras para voltar",
  },
  {
    id: "s2",
    tab: "Salvos",
    type: "Cinema",
    title: "Jornada — sessão da comunidade",
    context: "Cinema",
    date: "Ontem",
    group: "Cinema",
    status: "Salvo",
    audience: "Somente eu",
    preview: "Sessão de domingo · 1h42",
    collection: "Fim de semana",
  },
  {
    id: "s3",
    tab: "Salvos",
    type: "Publicação",
    title: "Como cultivar amizades maduras",
    context: "Marina Souza",
    date: "25 jul",
    group: "Comunidade",
    status: "Salvo",
    audience: "Somente eu",
    preview: "Uma conversa honesta sobre presença e constância.",
    collection: "Amizade",
  },
  {
    id: "s4",
    tab: "Salvos",
    type: "Loja",
    title: "Moldura Costa Serena",
    context: "Loja",
    date: "23 jul",
    group: "Loja",
    status: "Salvo",
    audience: "Somente eu",
    preview: "Item visual raro · preview disponível",
  },
  {
    id: "d1",
    tab: "Rascunhos",
    type: "Publicação",
    title: "Aprendendo a recomeçar",
    context: "Central Criar · Comunidade",
    date: "Editado há 18 min",
    group: "Comunidade",
    status: "Neste dispositivo",
    audience: "Amigos",
    preview: "Recomeçar não apaga a caminhada; às vezes revela o que ela ensinou.",
  },
  {
    id: "d2",
    tab: "Rascunhos",
    type: "Momento",
    title: "Sem título",
    context: "Perfil",
    date: "Editado ontem",
    group: "Perfil",
    status: "Mídia preservada",
    audience: "Amigos",
    preview: "1 foto · texto pendente",
  },
  {
    id: "d3",
    tab: "Rascunhos",
    type: "Estudo",
    title: "Notas sobre João 8",
    context: "Verbo",
    date: "Editado em 25 jul",
    group: "Verbo",
    status: "Neste dispositivo",
    audience: "Somente eu",
    preview: "Três observações e duas referências.",
  },
  {
    id: "d4",
    tab: "Rascunhos",
    type: "Ticket",
    title: "Dúvida sobre privacidade",
    context: "Suporte",
    date: "Editado em 22 jul",
    group: "Suporte",
    status: "Não enviado",
    audience: "Somente eu",
    preview: "Quero entender quem pode ver minhas coleções.",
  },
  {
    id: "h1",
    tab: "Histórico",
    type: "Verbo",
    title: "João 8",
    context: "Leitura bíblica",
    date: "Hoje · 21:04",
    group: "Hoje",
    status: "Em andamento",
    audience: "Privado",
    preview: "Parou no versículo 32",
    progress: 64,
  },
  {
    id: "h2",
    tab: "Histórico",
    type: "Cinema",
    title: "Jornada",
    context: "Cinema da Comunidade",
    date: "Hoje · 19:12",
    group: "Hoje",
    status: "Em andamento",
    audience: "Privado",
    preview: "Restam 38 minutos",
    progress: 72,
  },
  {
    id: "h3",
    tab: "Histórico",
    type: "Personalização",
    title: "Costa Serena",
    context: "Estúdio",
    date: "Ontem · 23:18",
    group: "Ontem",
    status: "Alterações pendentes",
    audience: "Privado",
    preview: "Fundo e moldura em teste",
    progress: 35,
  },
  {
    id: "h4",
    tab: "Histórico",
    type: "Evento",
    title: "Encontro do Espaço",
    context: "Café, Bíblia & Amizade",
    date: "Esta semana",
    group: "Esta semana",
    status: "Visto",
    audience: "Privado",
    preview: "Domingo · 21h30",
  },
  {
    id: "h5",
    tab: "Histórico",
    type: "Pessoa",
    title: "Ana Clara",
    context: "Perfil permitido pela privacidade",
    date: "24 jul",
    group: "Anteriores",
    status: "Visto",
    audience: "Privado",
    preview: "3 amigos em comum",
  },
];

const iconFor = (type: string) => {
  if (type === "Verbo" || type === "Estudo") return BookOpen;
  if (type === "Cinema") return Clapperboard;
  if (type === "Loja") return ShoppingBag;
  if (type === "Comentário") return MessageCircle;
  if (type === "Pessoa") return CircleUserRound;
  if (type === "Publicação" || type === "Momento") return FilePenLine;
  return Clock3;
};

function LocalBoundary({ children }: { children: React.ReactNode }) {
  return children;
}

export default function MyActivityExperience({
  visible,
  initialTab = "Atividade",
  initialFilter = "Tudo",
  source = "Perfil",
  onClose,
  onContinue,
  showToast,
}: {
  visible: boolean;
  initialTab?: ActivityTab;
  initialFilter?: string;
  source?: string;
  onClose: () => void;
  onContinue: (item: Item) => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<ActivityTab>(initialTab);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [period, setPeriod] = useState("Todo período");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [newCollection, setNewCollection] = useState("");
  const [collections, setCollections] = useState([
    "Leituras para voltar",
    "Fim de semana",
    "Amizade",
  ]);
  const [demoState, setDemoState] = useState<DemoState>("normal");
  const [undo, setUndo] = useState<{ id: string; action: string } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const initialize = window.setTimeout(() => {
      const saved = window.sessionStorage.getItem("vdn-my-activity");
      if (saved) {
        try {
          const state = JSON.parse(saved) as {
            tab?: ActivityTab;
            query?: string;
            filter?: string;
            period?: string;
            selectedId?: string;
            scroll?: number;
          };
          setTab(state.tab ?? initialTab);
          setQuery(state.query ?? "");
          setFilter(state.filter ?? initialFilter);
          setPeriod(state.period ?? "Todo período");
          setSelectedId(state.selectedId ?? null);
          window.requestAnimationFrame(() => {
            if (listRef.current) listRef.current.scrollTop = state.scroll ?? 0;
          });
        } catch {
          setTab(initialTab);
        }
      } else {
        setTab(initialTab);
        setFilter(initialFilter);
      }
      const state = new URLSearchParams(window.location.search).get(
        "activityState",
      ) as DemoState | null;
      if (state && ["normal", "loading", "offline", "error", "empty"].includes(state))
        setDemoState(state);
    }, 0);
    return () => window.clearTimeout(initialize);
  }, [visible, initialTab, initialFilter]);

  useEffect(() => {
    if (!visible) return;
    window.sessionStorage.setItem(
      "vdn-my-activity",
      JSON.stringify({
        tab,
        query,
        filter,
        period,
        selectedId,
        scroll: listRef.current?.scrollTop ?? 0,
        source,
      }),
    );
  }, [visible, tab, query, filter, period, selectedId, source]);

  const filters =
    tab === "Atividade"
      ? ["Tudo", "Publicações", "Comentários", "Momentos", "Eventos", "Espaços"]
      : tab === "Salvos"
        ? ["Todos", "Coleções", "Recentes", "Sem coleção"]
        : tab === "Rascunhos"
          ? ["Todos", "Comunidade", "Eventos", "Verbo", "Suporte", "Perfil"]
          : ["Todos", "Verbo", "Cinema", "Loja", "Pessoas", "Eventos", "Espaços"];

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (item.tab !== tab || removedIds.includes(item.id)) return false;
        const text = `${item.title} ${item.context} ${item.type} ${item.preview}`.toLowerCase();
        if (query && !text.includes(query.toLowerCase())) return false;
        if (filter === "Tudo" || filter === "Todos" || filter === "Recentes") return true;
        if (filter === "Coleções") return Boolean(item.collection);
        if (filter === "Sem coleção") return !item.collection;
        const normalized = filter.replace(/s$/, "").toLowerCase();
        return (
          item.group.toLowerCase().includes(normalized) ||
          item.type.toLowerCase().includes(normalized)
        );
      }),
    [tab, removedIds, query, filter],
  );

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const continuing = items
    .filter((item) => item.tab === "Histórico" && item.progress && !removedIds.includes(item.id))
    .slice(0, 3);

  if (!visible) return null;

  const remove = (id: string, action: string) => {
    setRemovedIds((current) => [...current, id]);
    setSelectedId(null);
    setUndo({ id, action });
    showToast(action);
  };

  const undoAction = () => {
    if (!undo) return;
    setRemovedIds((current) => current.filter((id) => id !== undo.id));
    setArchivedIds((current) => current.filter((id) => id !== undo.id));
    setUndo(null);
    showToast("Ação desfeita");
  };

  return (
    <LocalBoundary>
      <section
        className="my-activity-experience"
        role="dialog"
        aria-modal="true"
        aria-label="Minha Atividade"
      >
        <header className="my-activity-topbar">
          <button aria-label="Voltar" onClick={onClose}>
            <ArrowLeft size={21} />
          </button>
          <div>
            <span>PRIVADO</span>
            <h1>Minha Atividade</h1>
            <small>Origem: {source}</small>
          </div>
          <button
            aria-label="Mais opções"
            onClick={() => showToast("Opções de privacidade abertas")}
          >
            <MoreHorizontal size={21} />
          </button>
        </header>

        <nav className="my-activity-tabs" aria-label="Seções de Minha Atividade">
          {tabs.map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => {
                setTab(item);
                setFilter(item === "Atividade" ? "Tudo" : "Todos");
                setSelectedId(null);
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="my-activity-toolbar">
          <label>
            <Search size={18} />
            <span className="sr-only">Pesquisar em Minha Atividade</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar título, pessoa ou referência"
            />
            {query && (
              <button aria-label="Limpar pesquisa" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            )}
          </label>
          <button className="my-activity-filter-button" onClick={() => setFilterOpen(true)}>
            <Filter size={17} /> Filtros
          </button>
        </div>

        <div className={`my-activity-layout ${selected ? "has-detail" : ""}`}>
          <aside className="my-activity-sidebar" aria-label="Filtros e categorias">
            <span>TIPO</span>
            {filters.map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
            <span>PERÍODO</span>
            {["Todo período", "Hoje", "Esta semana", "Este mês"].map((item) => (
              <button
                key={item}
                className={period === item ? "active" : ""}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
            {tab === "Salvos" && (
              <button className="create-collection" onClick={() => setCollectionOpen(true)}>
                <FolderPlus size={16} /> Nova coleção
              </button>
            )}
          </aside>

          <main className="my-activity-content" ref={listRef}>
            {tab === "Histórico" && continuing.length > 0 && (
              <section className="continue-strip">
                <div>
                  <span>CONTINUAR</span>
                  <small>No máximo três itens em andamento</small>
                </div>
                <div>
                  {continuing.map((item) => (
                    <button key={item.id} onClick={() => onContinue(item)}>
                      <span>{item.type}</span>
                      <strong>{item.title}</strong>
                      <i>
                        <em style={{ width: `${item.progress}%` }} />
                      </i>
                      <small>{item.progress}% · Continuar</small>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {demoState === "loading" ? (
              <div className="my-activity-skeleton" aria-label="Carregando">
                <i />
                <i />
                <i />
                <i />
              </div>
            ) : demoState === "offline" ? (
              <div className="my-activity-state">
                <WifiOff size={28} />
                <h2>Atividade salva neste dispositivo</h2>
                <p>
                  Você pode abrir rascunhos e itens recentes. Mudanças serão sincronizadas quando a
                  conexão voltar.
                </p>
                <button onClick={() => setDemoState("normal")}>Tentar novamente</button>
              </div>
            ) : demoState === "error" ? (
              <div className="my-activity-state">
                <History size={28} />
                <h2>Uma parte não carregou</h2>
                <p>O restante da sua atividade continua disponível.</p>
                <button onClick={() => setDemoState("normal")}>Recarregar módulo</button>
              </div>
            ) : demoState === "empty" || visibleItems.length === 0 ? (
              <div className="my-activity-state">
                <Clock3 size={28} />
                <h2>
                  {tab === "Atividade"
                    ? "Sua atividade aparecerá aqui"
                    : tab === "Salvos"
                      ? "Nada salvo por enquanto"
                      : tab === "Rascunhos"
                        ? "Nenhum rascunho"
                        : "Seu histórico está vazio"}
                </h2>
                <p>
                  {tab === "Atividade"
                    ? "Publique, participe e salve conteúdos para começar."
                    : tab === "Salvos"
                      ? "Use Salvar em conteúdos que queira encontrar depois."
                      : tab === "Rascunhos"
                        ? "Conteúdos não publicados aparecerão aqui."
                        : "Itens que você decidir continuar aparecerão aqui."}
                </p>
                {(query || (filter !== "Tudo" && filter !== "Todos")) && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setFilter(tab === "Atividade" ? "Tudo" : "Todos");
                      setDemoState("normal");
                    }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="my-activity-list">
                {visibleItems.map((item) => {
                  const Icon = iconFor(item.type);
                  return (
                    <article
                      key={item.id}
                      className={`${selectedId === item.id ? "selected" : ""} ${archivedIds.includes(item.id) ? "archived" : ""}`}
                    >
                      <button
                        className="my-activity-row-main"
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="my-activity-item-icon">
                          <Icon size={19} />
                        </span>
                        <span className="my-activity-item-copy">
                          <small>
                            {item.type} · {item.context}
                          </small>
                          <strong>{item.title}</strong>
                          <span>{item.preview}</span>
                          <em>
                            {item.date} · {item.status}
                          </em>
                        </span>
                        <span className="my-activity-audience">
                          {item.audience === "Somente eu" || item.audience === "Privado" ? (
                            <LockKeyhole size={13} />
                          ) : item.audience === "Público" ? (
                            <Globe2 size={13} />
                          ) : (
                            <UsersRound size={13} />
                          )}
                          {item.audience}
                        </span>
                        <ChevronRight size={18} />
                      </button>
                      {item.progress !== undefined && (
                        <div
                          className="history-progress"
                          aria-label={`${item.progress}% concluído`}
                        >
                          <i style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {selected && (
            <aside className="my-activity-detail" aria-label={`Detalhe de ${selected.title}`}>
              <button
                className="close-detail"
                aria-label="Fechar detalhe"
                onClick={() => setSelectedId(null)}
              >
                <X size={18} />
              </button>
              <span>{selected.type}</span>
              <h2>{selected.title}</h2>
              <p>{selected.preview}</p>
              <dl>
                <div>
                  <dt>Origem</dt>
                  <dd>{selected.context}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{selected.status}</dd>
                </div>
                <div>
                  <dt>Audiência</dt>
                  <dd>{selected.audience}</dd>
                </div>
                <div>
                  <dt>Atualização</dt>
                  <dd>{selected.date}</dd>
                </div>
              </dl>
              {selected.tab === "Rascunhos" ? (
                <>
                  <button className="primary" onClick={() => onContinue(selected)}>
                    <Pencil size={17} /> Continuar edição
                  </button>
                  <button onClick={() => showToast("Rascunho duplicado")}>
                    <Copy size={17} /> Duplicar
                  </button>
                  <button
                    className="danger"
                    onClick={() =>
                      window.confirm("Excluir este rascunho deste dispositivo?") &&
                      remove(selected.id, "Rascunho excluído")
                    }
                  >
                    <Trash2 size={17} /> Excluir
                  </button>
                </>
              ) : selected.tab === "Salvos" ? (
                <>
                  <button className="primary" onClick={() => onContinue(selected)}>
                    Abrir contexto
                  </button>
                  <button onClick={() => setCollectionOpen(true)}>
                    <FolderPlus size={17} /> Mover para coleção
                  </button>
                  <button onClick={() => showToast("Compartilhamento aberto")}>
                    <Share2 size={17} /> Compartilhar
                  </button>
                  <button
                    className="danger"
                    onClick={() => remove(selected.id, "Item removido dos Salvos")}
                  >
                    <Trash2 size={17} /> Remover
                  </button>
                </>
              ) : selected.tab === "Histórico" ? (
                <>
                  <button className="primary" onClick={() => onContinue(selected)}>
                    Continuar
                  </button>
                  <button
                    className="danger"
                    onClick={() => remove(selected.id, "Item removido do histórico")}
                  >
                    <Trash2 size={17} /> Remover do histórico
                  </button>
                </>
              ) : (
                <>
                  <button className="primary" onClick={() => onContinue(selected)}>
                    Abrir atividade
                  </button>
                  <button onClick={() => showToast("Editor correto restaurado")}>
                    <Pencil size={17} /> Editar
                  </button>
                  <button
                    onClick={() => {
                      setArchivedIds((current) => [...current, selected.id]);
                      setUndo({ id: selected.id, action: "Item arquivado" });
                      showToast("Item arquivado");
                    }}
                  >
                    <Archive size={17} /> Arquivar
                  </button>
                  <button onClick={() => showToast("Compartilhamento aberto")}>
                    <Share2 size={17} /> Compartilhar
                  </button>
                  <button
                    className="danger"
                    onClick={() =>
                      window.confirm("Excluir esta atividade?") &&
                      remove(selected.id, "Atividade excluída")
                    }
                  >
                    <Trash2 size={17} /> Excluir
                  </button>
                </>
              )}
            </aside>
          )}
        </div>

        {(filterOpen || collectionOpen) && (
          <div
            className="my-activity-backdrop"
            onMouseDown={() => {
              setFilterOpen(false);
              setCollectionOpen(false);
            }}
          >
            <section
              className="my-activity-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={collectionOpen ? "Coleções" : "Filtros"}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header>
                <h2>{collectionOpen ? "Organizar em coleção" : "Filtrar atividade"}</h2>
                <button
                  aria-label="Fechar"
                  onClick={() => {
                    setFilterOpen(false);
                    setCollectionOpen(false);
                  }}
                >
                  <X size={20} />
                </button>
              </header>
              {filterOpen && (
                <>
                  <span>TIPO</span>
                  <div className="sheet-options">
                    {filters.map((item) => (
                      <button
                        key={item}
                        className={filter === item ? "active" : ""}
                        onClick={() => {
                          setFilter(item);
                          setFilterOpen(false);
                        }}
                      >
                        {filter === item && <Check size={15} />}
                        {item}
                      </button>
                    ))}
                  </div>
                  <span>PERÍODO</span>
                  <div className="sheet-options">
                    {["Todo período", "Hoje", "Esta semana", "Este mês"].map((item) => (
                      <button
                        key={item}
                        className={period === item ? "active" : ""}
                        onClick={() => setPeriod(item)}
                      >
                        {period === item && <Check size={15} />}
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {collectionOpen && (
                <>
                  <div className="collection-list">
                    {collections.map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setCollectionOpen(false);
                          showToast(`Movido para ${item}`);
                        }}
                      >
                        <span>
                          <strong>{item}</strong>
                          <small>Somente eu</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                  <label className="new-collection">
                    <span>Nova coleção</span>
                    <input
                      value={newCollection}
                      onChange={(event) => setNewCollection(event.target.value)}
                      placeholder="Nome da coleção"
                    />
                    <button
                      disabled={!newCollection.trim()}
                      onClick={() => {
                        setCollections((current) => [...current, newCollection.trim()]);
                        showToast("Coleção criada sem publicar itens");
                        setNewCollection("");
                      }}
                    >
                      Criar
                    </button>
                  </label>
                  <p className="collection-note">
                    Excluir uma coleção não exclui os itens salvos nela.
                  </p>
                </>
              )}
            </section>
          </div>
        )}

        {undo && (
          <div className="my-activity-undo" role="status">
            <span>{undo.action}</span>
            <button onClick={undoAction}>Desfazer</button>
          </div>
        )}
      </section>
    </LocalBoundary>
  );
}

export type { ActivityTab, Item as MyActivityItem };
