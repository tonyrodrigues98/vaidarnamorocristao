"use client";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  Clock3,
  Globe2,
  HeartHandshake,
  History,
  Search,
  ShoppingBag,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import "../styles/GlobalSearchExperience.css";

export type SearchContext =
  | "Tudo"
  | "Pessoas"
  | "Comunidade"
  | "Espaços"
  | "Eventos"
  | "Verbo"
  | "Cinema"
  | "Loja"
  | "Configurações";

type SearchCategory =
  | "Tudo"
  | "Pessoas"
  | "Espaços"
  | "Publicações"
  | "Eventos"
  | "Verbo"
  | "Cinema"
  | "Loja";

type SearchResult = {
  id: string;
  category: Exclude<SearchCategory, "Tudo">;
  title: string;
  detail: string;
  meta: string;
  destination: string;
  action?: string;
};

const categories: SearchCategory[] = [
  "Tudo",
  "Pessoas",
  "Espaços",
  "Publicações",
  "Eventos",
  "Verbo",
  "Cinema",
  "Loja",
];

const results: SearchResult[] = [
  {
    id: "ana",
    category: "Pessoas",
    title: "Ana Clara",
    detail: "Peruíbe, SP · Café, Bíblia & Amizade",
    meta: "12 amigos e 2 Espaços em comum",
    destination: "profile",
  },
  {
    id: "lucas",
    category: "Pessoas",
    title: "Lucas Almeida",
    detail: "Santos, SP · Disponível para conversar",
    meta: "Cristãos do Litoral Sul em comum",
    destination: "people",
  },
  {
    id: "cafe",
    category: "Espaços",
    title: "Café, Bíblia & Amizade",
    detail: "Fé e amizade · Público",
    meta: "248 membros · 18 ativos agora",
    destination: "community-space",
    action: "Participar",
  },
  {
    id: "litoral",
    category: "Espaços",
    title: "Cristãos do Litoral Sul",
    detail: "Comunidade local · Solicitação necessária",
    meta: "6 novas conversas hoje",
    destination: "community",
    action: "Solicitar",
  },
  {
    id: "post-prayer",
    category: "Publicações",
    title: "Pedido de oração da Marina",
    detail: "“Essa semana começa uma etapa importante…”",
    meta: "Pedido de oração · há 18 min",
    destination: "community",
  },
  {
    id: "post-joao",
    category: "Publicações",
    title: "Uma reflexão sobre João 8",
    detail: "Lucas publicou no Café, Bíblia & Amizade",
    meta: "Texto e foto · ontem",
    destination: "community-space",
  },
  {
    id: "event-joao",
    category: "Eventos",
    title: "Conversa sobre João 8",
    detail: "Hoje · 21h30 · Online",
    meta: "Café, Bíblia & Amizade · Você demonstrou interesse",
    destination: "events",
    action: "Ver evento",
  },
  {
    id: "event-cinema",
    category: "Eventos",
    title: "Cinema em comunidade",
    detail: "Hoje · 20h · Sala Oficial",
    meta: "Ao vivo em breve · 12 amigos interessados",
    destination: "cinema",
    action: "Lembrar",
  },
  {
    id: "verse",
    category: "Verbo",
    title: "João 8:12",
    detail: "“Eu sou a luz do mundo…”",
    meta: "Bíblia NAA · capítulo 8",
    destination: "verbo",
  },
  {
    id: "note",
    category: "Verbo",
    title: "Luz em dias difíceis",
    detail: "Sua nota em Salmos 28:7",
    meta: "Nota privada · editada há 2 dias",
    destination: "verbo",
  },
  {
    id: "cinema-session",
    category: "Cinema",
    title: "Uma Jornada de Esperança",
    detail: "Sessão oficial · hoje às 20h",
    meta: "No catálogo · sessão agendada",
    destination: "cinema",
    action: "Abrir sessão",
  },
  {
    id: "cinema-history",
    category: "Cinema",
    title: "O Caminho de Volta",
    detail: "Assistido com a comunidade",
    meta: "Histórico · 21 de julho",
    destination: "cinema",
  },
  {
    id: "store-frame",
    category: "Loja",
    title: "Moldura Aurora Serena",
    detail: "Perfil · Raro",
    meta: "620 moedas · ainda não adquirido",
    destination: "store",
    action: "Abrir item",
  },
  {
    id: "store-sticker",
    category: "Loja",
    title: "Sticker Luz Amiga",
    detail: "Social · Especial",
    meta: "Adquirido · disponível no Inventário",
    destination: "store",
    action: "Abrir item",
  },
];

const contextCategory: Record<SearchContext, SearchCategory> = {
  Tudo: "Tudo",
  Pessoas: "Pessoas",
  Comunidade: "Publicações",
  Espaços: "Espaços",
  Eventos: "Eventos",
  Verbo: "Verbo",
  Cinema: "Cinema",
  Loja: "Loja",
  Configurações: "Tudo",
};

const categoryIcon = {
  Pessoas: UsersRound,
  Espaços: HeartHandshake,
  Publicações: Globe2,
  Eventos: CalendarDays,
  Verbo: BookOpen,
  Cinema: Clapperboard,
  Loja: ShoppingBag,
};

class SearchBoundary extends Component<
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
        <div className="global-search-root">
          <section className="global-search-fallback">
            <CircleAlert size={30} />
            <h2>A Busca encontrou um problema</h2>
            <p>O restante do aplicativo continua funcionando normalmente.</p>
            <button onClick={() => this.setState({ failed: false })}>Tentar novamente</button>
            <button className="secondary" onClick={this.props.onClose}>
              Fechar Busca
            </button>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}

function SearchContent({
  visible,
  context,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  context: SearchContext;
  onClose: () => void;
  onNavigate: (destination: string, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("Tudo");
  const [activeContext, setActiveContext] = useState<SearchContext>("Tudo");
  const [history, setHistory] = useState<string[]>(["Ana Clara", "Cinema hoje", "Salmos 28"]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [partialError, setPartialError] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [historyEmpty, setHistoryEmpty] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!visible) return;
    const saved = window.sessionStorage.getItem("vdn-global-search");
    const savedHistory = window.localStorage.getItem("vdn-search-history");
    const timer = window.setTimeout(() => {
      if (saved) {
        try {
          const state = JSON.parse(saved) as {
            query?: string;
            category?: SearchCategory;
            scroll?: number;
          };
          setQuery(state.query ?? "");
          setActiveCategory(state.category ?? contextCategory[context]);
          window.requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = state.scroll ?? 0;
          });
        } catch {
          setActiveCategory(contextCategory[context]);
        }
      } else {
        setActiveCategory(contextCategory[context]);
      }
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch {
          // Keep the safe demonstration defaults.
        }
      }
      setActiveContext(context);
      inputRef.current?.focus({ preventScroll: true });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [context, visible]);

  useEffect(() => {
    if (!visible) return;
    window.sessionStorage.setItem(
      "vdn-global-search",
      JSON.stringify({
        query,
        category: activeCategory,
        scroll: scrollRef.current?.scrollTop ?? 0,
      }),
    );
  }, [activeCategory, query, visible]);

  useEffect(() => {
    if (!query.trim()) {
      const idleTimer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(idleTimer);
    }
    const startTimer = window.setTimeout(() => setLoading(true), 0);
    const finishTimer = window.setTimeout(() => setLoading(false), 420);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(finishTimer);
    };
  }, [query]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const categoryFiltered =
      activeCategory === "Tudo"
        ? results
        : results.filter((item) => item.category === activeCategory);
    if (!normalized) return categoryFiltered;
    const matches = categoryFiltered.filter((item) =>
      `${item.title} ${item.detail} ${item.meta} ${item.category}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
    if (normalized === "nada" || normalized === "sem resultado") return [];
    return matches.length ? matches : categoryFiltered.slice(0, 3);
  }, [activeCategory, query]);

  const grouped = useMemo(() => {
    const entries = categories
      .filter((item): item is Exclude<SearchCategory, "Tudo"> => item !== "Tudo")
      .map(
        (category) =>
          [category, filtered.filter((item) => item.category === category).slice(0, 2)] as const,
      )
      .filter(([, items]) => items.length);
    return activeCategory === "Tudo"
      ? entries
      : entries.filter(([category]) => category === activeCategory);
  }, [activeCategory, filtered]);

  const rememberQuery = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const next = [clean, ...history.filter((item) => item !== clean)].slice(0, 6);
    setHistory(next);
    setHistoryEmpty(false);
    window.localStorage.setItem("vdn-search-history", JSON.stringify(next));
  };

  const removeHistory = (item: string) => {
    const next = history.filter((value) => value !== item);
    setHistory(next);
    setHistoryEmpty(next.length === 0);
    window.localStorage.setItem("vdn-search-history", JSON.stringify(next));
  };

  const openResult = (item: SearchResult) => {
    rememberQuery(query || item.title);
    setSelected(item);
    window.sessionStorage.setItem(
      "vdn-global-search",
      JSON.stringify({
        query,
        category: activeCategory,
        scroll: scrollRef.current?.scrollTop ?? 0,
      }),
    );
  };

  if (!visible) return null;

  if (selected) {
    const Icon = categoryIcon[selected.category];
    return (
      <div className="global-search-root">
        <section className="global-search-detail">
          <header>
            <button aria-label="Voltar aos resultados" onClick={() => setSelected(null)}>
              <ArrowLeft size={21} />
            </button>
            <strong>{selected.category}</strong>
            <button aria-label="Fechar Busca" onClick={onClose}>
              <X size={21} />
            </button>
          </header>
          <div className="global-search-detail-content">
            <span className={`global-result-symbol symbol-${selected.category.toLowerCase()}`}>
              <Icon size={27} />
            </span>
            <span className="search-detail-kicker">RESULTADO ENCONTRADO</span>
            <h1>{selected.title}</h1>
            <p>{selected.detail}</p>
            <small>{selected.meta}</small>
            <button
              className="search-open-destination"
              onClick={() => onNavigate(selected.destination, selected.title)}
            >
              {selected.action ?? `Abrir ${selected.category}`} <ChevronRight size={18} />
            </button>
            <button className="search-back-results" onClick={() => setSelected(null)}>
              Voltar aos resultados
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="global-search-root" role="dialog" aria-modal="true" aria-label="Busca Global">
      <section className="global-search-shell">
        <header className="global-search-header">
          <div className="global-search-title">
            <button aria-label="Fechar Busca" onClick={onClose}>
              <ArrowLeft size={21} />
            </button>
            <h1>Buscar</h1>
          </div>
          <div className="global-search-input">
            <Search size={20} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") rememberQuery(query);
              }}
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Pessoas, Espaços, Bíblia..."
              aria-label="Buscar em todo o VaiDarNamoro"
            />
            {loading && <span className="search-local-loader" aria-label="Buscando" />}
            {query && !loading && (
              <button aria-label="Limpar busca" onClick={() => setQuery("")}>
                <X size={18} />
              </button>
            )}
          </div>
          <button className="global-search-cancel" onClick={onClose}>
            Cancelar
          </button>
          {activeContext !== "Tudo" && (
            <button
              className="global-search-context"
              onClick={() => {
                setActiveContext("Tudo");
                setActiveCategory("Tudo");
              }}
            >
              Buscando primeiro em {activeContext} <X size={15} />
            </button>
          )}
        </header>

        <div className="global-search-body">
          <aside className="global-search-filters">
            <span>Filtros</span>
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
            <button className="search-offline-toggle" onClick={() => setOffline((value) => !value)}>
              <WifiOff size={16} /> {offline ? "Voltar online" : "Simular offline"}
            </button>
          </aside>

          <div
            ref={scrollRef}
            className="global-search-results"
            onScroll={() => {
              window.sessionStorage.setItem(
                "vdn-global-search",
                JSON.stringify({
                  query,
                  category: activeCategory,
                  scroll: scrollRef.current?.scrollTop ?? 0,
                }),
              );
            }}
          >
            {offline && (
              <div className="global-search-status">
                <WifiOff size={17} />
                <span>
                  <strong>Você está offline</strong>
                  Exibindo resultados já carregados neste dispositivo.
                </span>
              </div>
            )}
            {partialError && (
              <div className="global-search-status warning">
                <CircleAlert size={17} />
                <span>
                  <strong>Parte da busca não respondeu</strong>
                  Pessoas, Verbo e Loja continuam disponíveis.
                </span>
                <button onClick={() => setPartialError(false)}>Tentar novamente</button>
              </div>
            )}

            {!query ? (
              <div className="global-search-initial">
                <section>
                  <div className="global-search-section-title">
                    <div>
                      <History size={18} />
                      <h2>Pesquisas recentes</h2>
                    </div>
                    {history.length > 0 && (
                      <button
                        onClick={() => {
                          setHistory([]);
                          setHistoryEmpty(true);
                          window.localStorage.setItem("vdn-search-history", "[]");
                        }}
                      >
                        Limpar histórico
                      </button>
                    )}
                  </div>
                  {history.length > 0 && !historyEmpty ? (
                    <div className="global-search-history">
                      {history.map((item) => (
                        <div key={item}>
                          <button onClick={() => setQuery(item)}>
                            <Clock3 size={16} />
                            <span>{item}</span>
                          </button>
                          <button
                            aria-label={`Remover ${item}`}
                            onClick={() => removeHistory(item)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="search-history-empty">
                      <Search size={21} />
                      <span>Suas próximas pesquisas aparecerão aqui.</span>
                    </div>
                  )}
                </section>

                <section>
                  <div className="global-search-section-title">
                    <div>
                      <Check size={18} />
                      <h2>Atalhos</h2>
                    </div>
                  </div>
                  <div className="global-search-shortcuts">
                    {[
                      ["Pessoas", UsersRound],
                      ["Espaços", HeartHandshake],
                      ["Eventos", CalendarDays],
                      ["Verbo", BookOpen],
                      ["Cinema", Clapperboard],
                      ["Loja", ShoppingBag],
                      ["Comunidade", Globe2],
                    ].map(([label, Icon]) => {
                      const ShortcutIcon = Icon as typeof Search;
                      return (
                        <button
                          key={String(label)}
                          onClick={() => {
                            const next =
                              label === "Comunidade" ? "Publicações" : (label as SearchCategory);
                            setActiveCategory(next);
                            setQuery(String(label));
                          }}
                        >
                          <ShortcutIcon size={19} />
                          <span>{String(label)}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <div className="global-search-section-title">
                    <div>
                      <Globe2 size={18} />
                      <h2>Em alta agora</h2>
                    </div>
                  </div>
                  <div className="search-trending">
                    {[
                      ["Cinema em comunidade", "Sessão hoje às 20h"],
                      ["João 8", "Conversas e estudos"],
                      ["Pedidos de oração", "18 novas participações"],
                    ].map(([title, detail]) => (
                      <button key={title} onClick={() => setQuery(title)}>
                        <span>
                          <strong>{title}</strong>
                          <small>{detail}</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : loading ? (
              <div className="global-search-skeleton" aria-label="Carregando resultados">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="global-search-empty">
                <Search size={28} />
                <h2>Nenhum resultado</h2>
                <p>Tente outro nome, assunto ou categoria.</p>
                <button onClick={() => setQuery("")}>Limpar busca</button>
              </div>
            ) : (
              <div className="global-search-groups">
                <nav className="global-search-tabs" aria-label="Categorias da busca">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={activeCategory === category ? "active" : ""}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </nav>
                {grouped.map(([category, items]) => {
                  const Icon = categoryIcon[category];
                  return (
                    <section key={category}>
                      <div className="global-search-section-title">
                        <div>
                          <Icon size={18} />
                          <h2>{category}</h2>
                        </div>
                        {activeCategory === "Tudo" && (
                          <button onClick={() => setActiveCategory(category)}>Ver todos</button>
                        )}
                      </div>
                      <div className="global-result-list">
                        {items.map((item) => (
                          <button key={item.id} onClick={() => openResult(item)}>
                            <span
                              className={`global-result-symbol symbol-${category.toLowerCase()}`}
                            >
                              <Icon size={20} />
                            </span>
                            <span>
                              <strong>{item.title}</strong>
                              <small>{item.detail}</small>
                              <em>{item.meta}</em>
                            </span>
                            {item.action ? <b>{item.action}</b> : <ChevronRight size={17} />}
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
                <button className="search-partial-trigger" onClick={() => setPartialError(true)}>
                  Demonstrar erro parcial
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function GlobalSearchExperience(props: {
  visible: boolean;
  context: SearchContext;
  onClose: () => void;
  onNavigate: (destination: string, label: string) => void;
}) {
  if (!props.visible) return null;
  return (
    <SearchBoundary onClose={props.onClose}>
      <SearchContent {...props} />
    </SearchBoundary>
  );
}
