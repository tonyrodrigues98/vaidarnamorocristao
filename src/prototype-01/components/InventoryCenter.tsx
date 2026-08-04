"use client";

import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Eye,
  Gift,
  Grid2X2,
  Heart,
  List,
  PackageOpen,
  Palette,
  PawPrint,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  Undo2,
  X,
} from "lucide-react";
import React, { Component, useMemo, useState } from "react";
import "../styles/InventoryCenter.css";

type Category = "Todos" | "Equipados" | "Perfil" | "Pets" | "Arcade" | "Social" | "Coleções";
type ViewMode = "grade" | "lista" | "coleção";
type InventoryItem = {
  id: string;
  name: string;
  category: Exclude<Category, "Todos" | "Equipados" | "Coleções">;
  type: string;
  slot: string;
  rarity: "Comum" | "Especial" | "Raro" | "Épico" | "Evento";
  collection: string;
  origin: string;
  acquired: string;
  compatibility: string;
  description: string;
  quantity?: number;
  limited?: boolean;
  giftable?: boolean;
  tradeable?: boolean;
  new?: boolean;
  tone: string;
};

const categories: Category[] = [
  "Todos",
  "Equipados",
  "Perfil",
  "Pets",
  "Arcade",
  "Social",
  "Coleções",
];
const items: InventoryItem[] = [
  {
    id: "costa-bg",
    name: "Costa Serena",
    category: "Perfil",
    type: "Fundo",
    slot: "fundo",
    rarity: "Raro",
    collection: "Costa Serena",
    origin: "Loja",
    acquired: "18 jul. 2026",
    compatibility: "Perfil",
    description: "Mar, areia e fim de tarde para contar sua fase atual.",
    limited: true,
    giftable: true,
    tone: "coast",
  },
  {
    id: "horizonte",
    name: "Horizonte Coral",
    category: "Perfil",
    type: "Moldura",
    slot: "moldura",
    rarity: "Especial",
    collection: "Costa Serena",
    origin: "Evento",
    acquired: "20 jul. 2026",
    compatibility: "Avatar do Perfil",
    description: "Moldura circular que preserva o rosto e o enquadramento.",
    new: true,
    tone: "coral",
  },
  {
    id: "aura",
    name: "Brilho Sereno",
    category: "Perfil",
    type: "Aura",
    slot: "aura",
    rarity: "Épico",
    collection: "Luz Interior",
    origin: "Conquista",
    acquired: "21 jul. 2026",
    compatibility: "Avatar do Perfil",
    description: "Uma luz adaptativa e discreta atrás do avatar.",
    new: true,
    tone: "aura",
  },
  {
    id: "titulo",
    name: "Construtor de caminhos",
    category: "Perfil",
    type: "Título",
    slot: "título",
    rarity: "Raro",
    collection: "Comunidade",
    origin: "Missão",
    acquired: "12 jul. 2026",
    compatibility: "Identidade do Perfil",
    description: "Título conquistado por criar e cuidar de espaços.",
    tone: "title",
  },
  {
    id: "badge-reader",
    name: "Leitor constante",
    category: "Perfil",
    type: "Badge",
    slot: "badge",
    rarity: "Especial",
    collection: "Verbo",
    origin: "Verbo",
    acquired: "9 jul. 2026",
    compatibility: "Até três badges",
    description: "Conquista por manter uma rotina de leitura.",
    tone: "verbo",
  },
  {
    id: "track",
    name: "Mar calmo",
    category: "Perfil",
    type: "Trilha",
    slot: "trilha",
    rarity: "Evento",
    collection: "Costa Serena",
    origin: "Cinema",
    acquired: "22 jul. 2026",
    compatibility: "Perfil",
    description: "Trilha leve, reproduzida somente sob toque.",
    limited: true,
    tone: "track",
  },
  {
    id: "hoodie",
    name: "Moletom Coral",
    category: "Pets",
    type: "Roupa",
    slot: "corpo",
    rarity: "Especial",
    collection: "Casa do Bento",
    origin: "Loja",
    acquired: "14 jul. 2026",
    compatibility: "Bento",
    description: "Roupa confortável para o Pet ativo.",
    giftable: true,
    tone: "pet",
  },
  {
    id: "toy",
    name: "Bola de corda",
    category: "Pets",
    type: "Brinquedo",
    slot: "brinquedo",
    rarity: "Comum",
    collection: "Casa do Bento",
    origin: "Missão",
    acquired: "10 jul. 2026",
    compatibility: "Pets caninos",
    description: "Brinquedo para o habitat e momentos de cuidado.",
    quantity: 2,
    giftable: true,
    tradeable: true,
    tone: "toy",
  },
  {
    id: "neon",
    name: "Rastro Violeta",
    category: "Arcade",
    type: "Efeito",
    slot: "fly-bird:efeito",
    rarity: "Raro",
    collection: "Neon Arcade",
    origin: "Arcade",
    acquired: "19 jul. 2026",
    compatibility: "Fly Bird",
    description: "Rastro visual específico para Fly Bird.",
    new: true,
    tone: "neon",
  },
  {
    id: "skin",
    name: "Peregrino Solar",
    category: "Arcade",
    type: "Skin",
    slot: "riftfall:personagem",
    rarity: "Épico",
    collection: "Riftfall",
    origin: "Caixa",
    acquired: "24 jul. 2026",
    compatibility: "Riftfall Duel",
    description: "Skin de personagem para o jogo Riftfall.",
    limited: true,
    tone: "solar",
  },
  {
    id: "gift",
    name: "Luz de Encontro",
    category: "Social",
    type: "Presente",
    slot: "social:presente",
    rarity: "Evento",
    collection: "Encontro de Julho",
    origin: "Evento",
    acquired: "23 jul. 2026",
    compatibility: "Amigos e conversas",
    description: "Presente luminoso para celebrar uma boa conversa.",
    quantity: 3,
    giftable: true,
    tone: "gift",
  },
  {
    id: "sticker",
    name: "Paz por aqui",
    category: "Social",
    type: "Sticker",
    slot: "social:sticker",
    rarity: "Comum",
    collection: "Conversas leves",
    origin: "Código",
    acquired: "8 jul. 2026",
    compatibility: "Conversas e Espaços",
    description: "Sticker disponível no compositor.",
    quantity: 2,
    giftable: true,
    tradeable: true,
    tone: "sticker",
  },
];

const exclusiveSlots = new Set([
  "fundo",
  "moldura",
  "aura",
  "efeito",
  "título",
  "trilha",
  "corpo",
  "brinquedo",
  "fly-bird:efeito",
  "riftfall:personagem",
]);

class InventoryBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="inventory-local-error" role="alert">
        <CircleAlert />
        <h2>O Inventário encontrou um problema</h2>
        <p>Loja, Perfil, Pets e Arcade continuam disponíveis.</p>
        <button onClick={() => this.setState({ failed: false })}>
          <RefreshCw />
          Tentar novamente
        </button>
      </div>
    );
  }
}

function ItemArt({ item, large = false }: { item: InventoryItem; large?: boolean }) {
  const Icon =
    item.category === "Pets"
      ? PawPrint
      : item.category === "Arcade"
        ? Sparkles
        : item.category === "Social"
          ? Gift
          : Palette;
  return (
    <span className={`inventory-art tone-${item.tone} ${large ? "large" : ""}`}>
      <Icon />
      <small>{item.type}</small>
      <strong>{item.name}</strong>
    </span>
  );
}

function InventoryContent({ showToast }: { showToast: (message: string) => void }) {
  const [category, setCategory] = useState<Category>("Todos");
  const [view, setView] = useState<ViewMode>("grade");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(["costa-bg", "hoodie"]);
  const [seen, setSeen] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({
    fundo: "costa-bg",
    moldura: "horizonte",
    aura: "aura",
    título: "titulo",
    badge1: "badge-reader",
    trilha: "track",
    corpo: "hoodie",
    "fly-bird:efeito": "neon",
  });
  const [replacement, setReplacement] = useState<{
    item: InventoryItem;
    previous?: InventoryItem;
  } | null>(null);
  const [undo, setUndo] = useState<{ slot: string; previous?: string; next: string } | null>(null);
  const [giftItem, setGiftItem] = useState<InventoryItem | null>(null);
  const [recipient, setRecipient] = useState("Ana Clara");
  const [giftDone, setGiftDone] = useState(false);
  const [collection, setCollection] = useState<string | null>(null);
  const [offline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  const equippedIds = Object.values(equipped);
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (category === "Equipados" && !equippedIds.includes(item.id)) return false;
        if (
          category !== "Todos" &&
          category !== "Equipados" &&
          category !== "Coleções" &&
          item.category !== category
        )
          return false;
        const needle = query.trim().toLowerCase();
        if (
          needle &&
          !`${item.name} ${item.collection} ${item.category} ${item.origin} ${item.type}`
            .toLowerCase()
            .includes(needle)
        )
          return false;
        if (filters.includes("Equipado") && !equippedIds.includes(item.id)) return false;
        if (filters.includes("Não equipado") && equippedIds.includes(item.id)) return false;
        if (filters.includes("Favorito") && !favorites.includes(item.id)) return false;
        if (filters.includes("Novo") && (!item.new || seen.includes(item.id))) return false;
        if (filters.includes("Evento") && item.rarity !== "Evento") return false;
        if (filters.includes("Limitado") && !item.limited) return false;
        if (filters.includes("Negociável") && !item.tradeable) return false;
        if (filters.includes("Presenteável") && !item.giftable) return false;
        if (filters.includes("Duplicado") && !(item.quantity && item.quantity > 1)) return false;
        return true;
      }),
    [category, equippedIds, favorites, filters, query, seen],
  );
  const collections = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.collection))).map((name) => ({
        name,
        owned: items.filter((item) => item.collection === name).length,
        total:
          items.filter((item) => item.collection === name).length +
          (name === "Costa Serena" ? 2 : 1),
      })),
    [],
  );

  const requestEquip = (item: InventoryItem) => {
    if (offline) {
      showToast("Offline: ação preservada apenas no preview");
      return;
    }
    let slot = item.slot;
    if (item.type === "Badge") {
      const badgeSlot =
        ["badge1", "badge2", "badge3"].find((value) => !equipped[value]) ?? "badge3";
      slot = badgeSlot;
    }
    const previousId = equipped[slot];
    const previous = items.find((candidate) => candidate.id === previousId);
    if (exclusiveSlots.has(item.slot) && previousId && previousId !== item.id) {
      setReplacement({ item, previous });
      return;
    }
    setEquipped((current) => ({ ...current, [slot]: item.id }));
    setUndo({ slot, previous: previousId, next: item.id });
    showToast(`${item.name} equipado`);
  };
  const confirmReplace = () => {
    if (!replacement) return;
    const slot = replacement.item.slot;
    const previous = equipped[slot];
    setEquipped((current) => ({ ...current, [slot]: replacement.item.id }));
    setUndo({ slot, previous, next: replacement.item.id });
    showToast(
      `${replacement.item.name} substituiu ${replacement.previous?.name ?? "o item atual"}`,
    );
    setReplacement(null);
  };
  const undoEquip = () => {
    if (!undo) return;
    setEquipped((current) => {
      const next = { ...current };
      if (undo.previous) next[undo.slot] = undo.previous;
      else delete next[undo.slot];
      return next;
    });
    showToast("Equipamento anterior restaurado");
    setUndo(null);
  };
  const removeItem = (item: InventoryItem) => {
    const slot = Object.entries(equipped).find(([, id]) => id === item.id)?.[0];
    if (!slot) return;
    setEquipped((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });
    setUndo({ slot, previous: item.id, next: "" });
    showToast(`${item.name} removido`);
  };
  const toggleFilter = (filter: string) =>
    setFilters((current) =>
      current.includes(filter) ? current.filter((value) => value !== filter) : [...current, filter],
    );
  const summary = [
    ["Itens", items.length],
    ["Equipados", equippedIds.length],
    ["Favoritos", favorites.length],
    ["Coleções completas", collections.filter((value) => value.owned === value.total).length],
  ];

  return (
    <div
      className="inventory-center"
      data-view={view}
      data-immersive-surface="inventario"
      data-state-preserved="true"
    >
      <header className="inventory-intro">
        <div>
          <span>SEU INVENTÁRIO</span>
          <h2>Tudo que conta a sua história.</h2>
          <p>Itens possuídos, equipamentos, recompensas e coleções em uma fonte central.</p>
        </div>
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("vdn-open-profile-studio", {
                detail: { tab: "Visual", source: "Inventário" },
              }),
            )
          }
        >
          <Palette />
          Abrir Estúdio
        </button>
      </header>
      <div className="inventory-summary">
        {summary.map(([label, value]) => (
          <span key={String(label)}>
            <strong>{value}</strong>
            <small>{label}</small>
          </span>
        ))}
      </div>
      {offline && (
        <div className="inventory-banner">
          <CircleAlert />
          Offline · mostrando itens já carregados
        </div>
      )}
      <div className="inventory-toolbar">
        <label>
          <Search />
          <input
            value={query}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Buscar por item, coleção ou origem"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button aria-label="Limpar busca" onClick={() => setQuery("")}>
              <X />
            </button>
          )}
        </label>
        <button
          aria-label="Abrir filtros"
          className={filters.length ? "active" : ""}
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal />
          {filters.length > 0 && <small>{filters.length}</small>}
        </button>
        <div className="inventory-view-switch" aria-label="Visualização">
          <button aria-pressed={view === "grade"} onClick={() => setView("grade")}>
            <Grid2X2 />
          </button>
          <button aria-pressed={view === "lista"} onClick={() => setView("lista")}>
            <List />
          </button>
          <button aria-pressed={view === "coleção"} onClick={() => setView("coleção")}>
            <PackageOpen />
          </button>
        </div>
      </div>
      <nav className="inventory-categories">
        {categories.map((value) => (
          <button
            key={value}
            className={category === value ? "active" : ""}
            aria-current={category === value ? "page" : undefined}
            onClick={() => {
              setCategory(value);
              if (value === "Coleções") setView("coleção");
            }}
          >
            {value}
          </button>
        ))}
      </nav>
      {filters.length > 0 && (
        <div className="inventory-active-filters">
          {filters.map((filter) => (
            <button key={filter} onClick={() => toggleFilter(filter)}>
              {filter}
              <X />
            </button>
          ))}
          <button onClick={() => setFilters([])}>Limpar</button>
        </div>
      )}

      <div className="inventory-main">
        <main className="inventory-items">
          {view === "coleção" || category === "Coleções" ? (
            <div className="inventory-collections">
              {collections.map((value) => (
                <button key={value.name} onClick={() => setCollection(value.name)}>
                  <span>
                    <PackageOpen />
                  </span>
                  <div>
                    <strong>{value.name}</strong>
                    <small>
                      {value.owned} de {value.total} itens ·{" "}
                      {value.owned === value.total ? "Completa" : "Em andamento"}
                    </small>
                    <div
                      className="collection-progress"
                      aria-label={`${value.owned} de ${value.total} itens`}
                    >
                      <i style={{ width: `${(value.owned / value.total) * 100}%` }} />
                    </div>
                    <em>
                      {value.name === "Costa Serena"
                        ? "Recompensa: paleta exclusiva"
                        : "Origem: múltiplas experiências"}
                    </em>
                  </div>
                  <ChevronRight />
                </button>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="inventory-empty">
              <PackageOpen />
              <h2>{items.length ? "Nenhum item encontrado" : "Seu inventário está começando"}</h2>
              <p>
                {items.length
                  ? "Remova filtros ou tente outra busca."
                  : "Itens adquiridos e recompensas aparecerão aqui."}
              </p>
              <div>
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("vdn-open-experience", { detail: "loja" }))
                  }
                >
                  <Store />
                  Explorar Loja
                </button>
                <button onClick={() => showToast("Eventos abertos")}>Ver eventos</button>
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("vdn-open-experience", { detail: "arcade" }),
                    )
                  }
                >
                  Abrir Arcade
                </button>
              </div>
            </div>
          ) : (
            <div className={`inventory-${view}`}>
              {filtered.map((item) => {
                const isEquipped = equippedIds.includes(item.id);
                const isNew = item.new && !seen.includes(item.id);
                return (
                  <button
                    key={item.id}
                    className="inventory-item"
                    onClick={() => {
                      setSelected(item);
                      if (isNew) setSeen((current) => [...current, item.id]);
                    }}
                  >
                    <ItemArt item={item} />
                    <div>
                      <span className={`inventory-rarity rarity-${item.rarity.toLowerCase()}`}>
                        {item.rarity}
                      </span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.type} · {item.collection}
                      </small>
                      <em>
                        {isEquipped
                          ? "Equipado"
                          : item.quantity && item.quantity > 1
                            ? `${item.quantity} unidades`
                            : "Disponível"}
                      </em>
                    </div>
                    <span className="inventory-item-flags">
                      {isNew && <i>Novo</i>}
                      {favorites.includes(item.id) && <Heart />}
                      {item.limited && <small>Limitado</small>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </main>
        {selected && (
          <aside className="inventory-detail">
            <header>
              <button aria-label="Fechar detalhe" onClick={() => setSelected(null)}>
                <ArrowLeft />
              </button>
              <strong>Detalhe do item</strong>
              <button
                aria-label={favorites.includes(selected.id) ? "Remover dos favoritos" : "Favoritar"}
                onClick={() =>
                  setFavorites((current) =>
                    current.includes(selected.id)
                      ? current.filter((id) => id !== selected.id)
                      : [...current, selected.id],
                  )
                }
              >
                <Heart className={favorites.includes(selected.id) ? "filled" : ""} />
              </button>
            </header>
            <ItemArt item={selected} large />
            <div className="inventory-detail-copy">
              <span className={`inventory-rarity rarity-${selected.rarity.toLowerCase()}`}>
                {selected.rarity}
              </span>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              <dl>
                <div>
                  <dt>Categoria</dt>
                  <dd>
                    {selected.category} · {selected.type}
                  </dd>
                </div>
                <div>
                  <dt>Coleção</dt>
                  <dd>{selected.collection}</dd>
                </div>
                <div>
                  <dt>Origem</dt>
                  <dd>{selected.origin}</dd>
                </div>
                <div>
                  <dt>Adquirido em</dt>
                  <dd>{selected.acquired}</dd>
                </div>
                <div>
                  <dt>Equipado em</dt>
                  <dd>{equippedIds.includes(selected.id) ? selected.slot : "Não equipado"}</dd>
                </div>
                <div>
                  <dt>Compatibilidade</dt>
                  <dd>{selected.compatibility}</dd>
                </div>
                <div>
                  <dt>Quantidade</dt>
                  <dd>{selected.quantity ?? 1}</dd>
                </div>
                <div>
                  <dt>Presenteável</dt>
                  <dd>{selected.giftable ? "Sim" : "Não"}</dd>
                </div>
                <div>
                  <dt>Negociável</dt>
                  <dd>{selected.tradeable ? "Sim" : "Não nesta versão"}</dd>
                </div>
              </dl>
              <div className="inventory-detail-actions">
                <button
                  className="primary"
                  onClick={() =>
                    equippedIds.includes(selected.id)
                      ? removeItem(selected)
                      : requestEquip(selected)
                  }
                >
                  {equippedIds.includes(selected.id) ? (
                    <>
                      <X />
                      Remover
                    </>
                  ) : (
                    <>
                      <Check />
                      Equipar
                    </>
                  )}
                </button>
                <button
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("vdn-open-profile-studio", {
                        detail: {
                          tab: selected.category === "Perfil" ? "Visual" : "Vitrine",
                          source: "Inventário",
                        },
                      }),
                    )
                  }
                >
                  <Eye />
                  Experimentar
                </button>
                <button onClick={() => showToast("Compartilhamento aberto")}>
                  <Share2 />
                  Compartilhar
                </button>
                {selected.giftable && (
                  <button
                    onClick={() => {
                      setGiftItem(selected);
                      setGiftDone(false);
                    }}
                  >
                    <Gift />
                    Presentear
                  </button>
                )}
                <button onClick={() => setCollection(selected.collection)}>
                  <PackageOpen />
                  Ver coleção
                </button>
                <button onClick={() => showToast(`${selected.name} aberto na Loja`)}>
                  <Store />
                  Ver na Loja
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {filtersOpen && (
        <div className="inventory-overlay">
          <section className="inventory-filter-sheet" role="dialog" aria-modal="true">
            <header>
              <div>
                <span>FILTROS</span>
                <h2>Refinar Inventário</h2>
              </div>
              <button aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)}>
                <X />
              </button>
            </header>
            <div>
              {[
                "Equipado",
                "Não equipado",
                "Favorito",
                "Novo",
                "Evento",
                "Limitado",
                "Negociável",
                "Presenteável",
                "Duplicado",
              ].map((filter) => (
                <button
                  key={filter}
                  aria-pressed={filters.includes(filter)}
                  onClick={() => toggleFilter(filter)}
                >
                  <span className="inventory-check">{filters.includes(filter) && <Check />}</span>
                  {filter}
                </button>
              ))}
            </div>
            <label>
              Raridade
              <select>
                <option>Todas</option>
                <option>Comum</option>
                <option>Especial</option>
                <option>Raro</option>
                <option>Épico</option>
                <option>Evento</option>
              </select>
            </label>
            <footer>
              <button onClick={() => setFilters([])}>Limpar</button>
              <button onClick={() => setFiltersOpen(false)}>Ver {filtered.length} itens</button>
            </footer>
          </section>
        </div>
      )}
      {replacement && (
        <div className="inventory-overlay">
          <section className="inventory-confirm">
            <CircleAlert />
            <span>SUBSTITUIÇÃO</span>
            <h2>Trocar {replacement.previous?.name}?</h2>
            <p>
              A categoria {replacement.item.type} aceita apenas um item. Você poderá desfazer em
              seguida.
            </p>
            <div>
              <button onClick={() => setReplacement(null)}>Cancelar</button>
              <button onClick={confirmReplace}>Substituir</button>
            </div>
          </section>
        </div>
      )}
      {undo && (
        <div className="inventory-undo" role="status">
          <Check />
          <span>
            <strong>Equipamento atualizado</strong>
            <small>O item anterior continua no Inventário.</small>
          </span>
          <button onClick={undoEquip}>
            <Undo2 />
            Desfazer
          </button>
          <button aria-label="Fechar" onClick={() => setUndo(null)}>
            <X />
          </button>
        </div>
      )}
      {giftItem && (
        <div className="inventory-overlay">
          <section className="inventory-gift">
            {giftDone ? (
              <>
                <span className="gift-success">
                  <Send />
                </span>
                <h2>Presente preparado</h2>
                <p>
                  {giftItem.name} será enviado para {recipient} apenas nesta demonstração.
                </p>
                <button onClick={() => setGiftItem(null)}>Concluir</button>
              </>
            ) : (
              <>
                <header>
                  <div>
                    <span>PRESENTEAR</span>
                    <h2>{giftItem.name}</h2>
                  </div>
                  <button aria-label="Fechar" onClick={() => setGiftItem(null)}>
                    <X />
                  </button>
                </header>
                <label>
                  Amigo
                  <select value={recipient} onChange={(event) => setRecipient(event.target.value)}>
                    <option>Ana Clara</option>
                    <option>Lucas Almeida</option>
                    <option>Marina Souza</option>
                  </select>
                </label>
                <label>
                  Mensagem opcional
                  <textarea defaultValue="Vi isso e lembrei de você." />
                </label>
                <div className="gift-safety">
                  <ShieldCheck />
                  Este item é presenteável. Nenhum saldo real será alterado.
                </div>
                <button onClick={() => setGiftDone(true)}>
                  <Gift />
                  Confirmar presente
                </button>
              </>
            )}
          </section>
        </div>
      )}
      {collection && (
        <div className="inventory-overlay">
          <section className="inventory-collection-detail">
            <header>
              <button aria-label="Voltar" onClick={() => setCollection(null)}>
                <ArrowLeft />
              </button>
              <div>
                <span>COLEÇÃO</span>
                <h2>{collection}</h2>
              </div>
              <button aria-label="Fechar" onClick={() => setCollection(null)}>
                <X />
              </button>
            </header>
            <div className="collection-editorial">
              <Sparkles />
              <strong>
                {items.filter((item) => item.collection === collection).length} itens possuídos
              </strong>
              <span>Recompensa visual ao completar</span>
            </div>
            <div>
              {items
                .filter((item) => item.collection === collection)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCollection(null);
                      setSelected(item);
                    }}
                  >
                    <ItemArt item={item} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.type} · possuído</small>
                    </span>
                    <ChevronRight />
                  </button>
                ))}
              <button className="missing">
                <span className="missing-art">?</span>
                <span>
                  <strong>Item ainda não possuído</strong>
                  <small>Origem: Loja ou evento</small>
                </span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function InventoryCenter({ showToast }: { showToast: (message: string) => void }) {
  return (
    <InventoryBoundary>
      <InventoryContent showToast={showToast} />
    </InventoryBoundary>
  );
}
