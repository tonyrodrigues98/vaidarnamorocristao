"use client";

import {
  ArrowLeft,
  Box,
  Check,
  ChevronRight,
  CircleAlert,
  Gift,
  Grid2X2,
  Heart,
  Palette,
  PawPrint,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import React, { Component, useMemo, useState } from "react";
import InventoryCenter from "./InventoryCenter";

type StoreTab = "Loja" | "Inventário";
type Category = "Tudo" | "Perfil" | "Pets" | "Arcade" | "Social";
type Item = {
  id: string;
  name: string;
  category: Exclude<Category, "Tudo">;
  type: string;
  rarity: "comum" | "especial" | "raro" | "épico" | "evento";
  price: number;
  tone: string;
  description: string;
  limited?: boolean;
  owned?: boolean;
};

const items: Item[] = [
  {
    id: "aurora",
    name: "Aurora Serena",
    category: "Perfil",
    type: "Fundo animado",
    rarity: "épico",
    price: 920,
    tone: "aurora",
    description: "Luzes suaves e movimento calmo para a página do seu perfil.",
    limited: true,
  },
  {
    id: "costa",
    name: "Costa Serena",
    category: "Perfil",
    type: "Moldura",
    rarity: "raro",
    price: 480,
    tone: "coast",
    description: "Uma moldura inspirada no encontro entre mar, areia e fim de tarde.",
  },
  {
    id: "bento",
    name: "Moletom Coral",
    category: "Pets",
    type: "Roupa",
    rarity: "especial",
    price: 260,
    tone: "pet",
    description: "Conforto leve para Bento usar no habitat e nas visitas.",
  },
  {
    id: "neon",
    name: "Rastro Violeta",
    category: "Arcade",
    type: "Efeito",
    rarity: "raro",
    price: 390,
    tone: "neon",
    description: "Um rastro visual para acompanhar suas partidas no Fly Bird.",
  },
  {
    id: "luz",
    name: "Luz de Encontro",
    category: "Social",
    type: "Presente",
    rarity: "evento",
    price: 180,
    tone: "gift",
    description: "Um presente luminoso para celebrar uma conversa que fez bem.",
  },
  {
    id: "jardim",
    name: "Jardim Suspenso",
    category: "Pets",
    type: "Habitat",
    rarity: "épico",
    price: 760,
    tone: "garden",
    description: "Folhagens, pequenos pontos de luz e uma rede confortável.",
    owned: true,
  },
];

class StoreBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="store-local-error">
          <CircleAlert />
          <strong>A Loja encontrou um problema</strong>
          <span>As outras áreas continuam funcionando.</span>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw /> Tentar novamente
          </button>
        </div>
      );
    return this.props.children;
  }
}

function ItemArt({ item, large = false }: { item: Item; large?: boolean }) {
  return (
    <div className={`store-item-art tone-${item.tone} ${large ? "large" : ""}`}>
      <span>{item.type}</span>
      {item.category === "Pets" ? (
        <PawPrint />
      ) : item.category === "Arcade" ? (
        <Sparkles />
      ) : item.category === "Social" ? (
        <Gift />
      ) : (
        <Palette />
      )}
      <strong>{item.name}</strong>
    </div>
  );
}

function ItemDetail({
  item,
  owned,
  onClose,
  onBuy,
  onEquip,
  onGift,
}: {
  item: Item;
  owned: boolean;
  onClose: () => void;
  onBuy: () => void;
  onEquip: () => void;
  onGift: () => void;
}) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="store-detail" role="dialog" aria-modal="true">
      <header>
        <button aria-label="Voltar" onClick={onClose}>
          <ArrowLeft />
        </button>
        <strong>Detalhe do item</strong>
        <button aria-label="Favoritar">
          <Heart />
        </button>
      </header>
      <div className={`context-preview ${preview ? "active" : ""}`}>
        <ItemArt item={item} large />
        <div>
          <span>PREVIEW CONTEXTUAL</span>
          <strong>
            {item.type} aplicado ao{" "}
            {item.category === "Pets"
              ? "Bento"
              : item.category === "Arcade"
                ? "Fly Bird"
                : "Perfil"}
          </strong>
        </div>
      </div>
      <main>
        <div className="rarity-row">
          <span className={`rarity ${item.rarity}`}>{item.rarity}</span>
          {item.limited && <span className="limited">Limitado · 2 dias</span>}
        </div>
        <h1>{item.name}</h1>
        <p>{item.description}</p>
        <dl>
          <div>
            <dt>Coleção</dt>
            <dd>Expressões de Julho</dd>
          </div>
          <div>
            <dt>Disponibilidade</dt>
            <dd>{item.limited ? "Até 30 de julho" : "Permanente"}</dd>
          </div>
          <div>
            <dt>Negociável</dt>
            <dd>Não nesta versão</dd>
          </div>
        </dl>
        <button className="preview-action" onClick={() => setPreview((value) => !value)}>
          <Palette /> {preview ? "Remover preview" : "Ver aplicado"}
        </button>
      </main>
      <footer>
        <div>
          <span>{owned ? "Você já possui" : "Preço"}</span>
          <strong>{owned ? "Na coleção" : `${item.price} moedas`}</strong>
        </div>
        {owned ? (
          <button onClick={onEquip}>
            <Check /> Equipar
          </button>
        ) : (
          <button onClick={onBuy}>
            <ShoppingBag /> Comprar
          </button>
        )}
        <button onClick={onGift} aria-label="Presentear">
          <Gift />
        </button>
      </footer>
    </div>
  );
}

function PurchaseFlow({
  item,
  onClose,
  onComplete,
}: {
  item: Item;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [done, setDone] = useState(false);
  return (
    <div className="store-modal" role="dialog" aria-modal="true">
      <button className="modal-close" aria-label="Fechar" onClick={onClose}>
        <X />
      </button>
      {done ? (
        <>
          <span className="purchase-success">
            <Check />
          </span>
          <h2>Item adquirido</h2>
          <p>{item.name} foi adicionado ao seu inventário.</p>
          <button onClick={onComplete}>Equipar agora</button>
          <button className="secondary" onClick={onClose}>
            Ver no inventário
          </button>
        </>
      ) : (
        <>
          <ItemArt item={item} />
          <span>CONFIRMAR COMPRA</span>
          <h2>{item.name}</h2>
          <p>Esta compra é apenas uma simulação visual. Nenhum saldo real será alterado.</p>
          <div className="purchase-total">
            <span>Total</span>
            <strong>{item.price} moedas</strong>
          </div>
          <button onClick={() => setDone(true)}>Confirmar compra</button>
          <button className="secondary" onClick={onClose}>
            Cancelar
          </button>
        </>
      )}
    </div>
  );
}

function StoreContent({
  onClose,
  showToast,
}: {
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [tab, setTab] = useState<StoreTab>("Loja");
  const [category, setCategory] = useState<Category>("Tudo");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [buying, setBuying] = useState<Item | null>(null);
  const [owned, setOwned] = useState<string[]>(
    items.filter((item) => item.owned).map((item) => item.id),
  );
  const [, setEquipped] = useState<string[]>(["jardim"]);
  const [rarity, setRarity] = useState("Todas");
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (category === "Tudo" || item.category === category) &&
          (rarity === "Todas" || item.rarity === rarity.toLowerCase()) &&
          item.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [category, rarity, search],
  );

  const equip = (item: Item) => {
    setEquipped((current) => [
      ...current.filter(
        (id) => items.find((candidate) => candidate.id === id)?.category !== item.category,
      ),
      item.id,
    ]);
    showToast(`${item.name} equipado`);
  };

  return (
    <div
      className="store-experience"
      data-action-context="store"
      data-action-title="Loja"
      data-immersive-surface="loja"
      data-state-preserved="true"
    >
      <header className="store-topbar">
        <button aria-label="Voltar para Explorar" onClick={onClose}>
          <ArrowLeft />
        </button>
        <div>
          <Store />
          <h1>Loja</h1>
        </div>
        <button
          aria-label="Abrir caixas e recompensas"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("vdn-open-gifts", { detail: { tab: "Caixas", source: "Loja" } }),
            )
          }
        >
          <Box />
        </button>
      </header>
      <nav className="store-primary-tabs">
        {(["Loja", "Inventário"] as StoreTab[]).map((value) => (
          <button
            key={value}
            aria-current={tab === value ? "page" : undefined}
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </nav>
      {tab === "Loja" ? (
        <main className="store-content">
          <section className="store-hero">
            <span>COLEÇÃO LIMITADA</span>
            <h2>Expresse a fase que você está vivendo.</h2>
            <p>Fundos, detalhes e pequenas histórias para o seu perfil, Pet e Arcade.</p>
            <button onClick={() => setSelected(items[0])}>
              Conhecer Aurora Serena <ChevronRight />
            </button>
            <div className="hero-orbit">
              <Sparkles />
            </div>
          </section>
          <div className="store-search">
            <label>
              <Search />
              <input
                aria-label="Buscar itens e coleções"
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={() =>
                  window.dispatchEvent(
                    new CustomEvent("vdn-open-global-search", { detail: "Loja" }),
                  )
                }
                placeholder="Buscar itens e coleções"
              />
            </label>
            <button aria-label="Filtros" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal />
            </button>
          </div>
          <nav className="store-categories">
            {(["Tudo", "Perfil", "Pets", "Arcade", "Social"] as Category[]).map((value) => (
              <button
                key={value}
                aria-pressed={category === value}
                className={category === value ? "active" : ""}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </nav>
          {!search && category === "Tudo" && (
            <section className="store-collections">
              <div className="store-heading">
                <div>
                  <span>COLEÇÕES</span>
                  <h2>Histórias que combinam</h2>
                </div>
                <button onClick={() => showToast("Todas as coleções abertas")}>Ver todas</button>
              </div>
              <div>
                <button onClick={() => setSelected(items[1])}>
                  <span>COSTA SERENA</span>
                  <strong>Leveza, mar e fim de tarde</strong>
                  <small>8 itens · Perfil</small>
                </button>
                <button onClick={() => setSelected(items[5])}>
                  <span>CASA DO BENTO</span>
                  <strong>Um habitat com a sua cara</strong>
                  <small>12 itens · Pets</small>
                </button>
              </div>
            </section>
          )}
          <section className="store-products">
            <div className="store-heading">
              <div>
                <span>{search ? "RESULTADOS" : "RECOMENDADOS"}</span>
                <h2>{search ? `${filtered.length} itens encontrados` : "Escolhidos para você"}</h2>
              </div>
            </div>
            <div className="store-grid">
              {filtered.map((item) => (
                <button key={item.id} onClick={() => setSelected(item)}>
                  <ItemArt item={item} />
                  <span className={`rarity ${item.rarity}`}>{item.rarity}</span>
                  <strong>{item.name}</strong>
                  <small>{owned.includes(item.id) ? "Adquirido" : `${item.price} moedas`}</small>
                </button>
              ))}
            </div>
          </section>
          <button
            className="market-placeholder"
            onClick={() => showToast("Mercado chega em uma etapa futura")}
          >
            <Grid2X2 />
            <div>
              <span>MERCADO</span>
              <strong>Trocas entre pessoas, em breve</strong>
              <small>Nenhuma negociação real nesta versão.</small>
            </div>
            <ChevronRight />
          </button>
        </main>
      ) : (
        <main className="inventory-content">
          <InventoryCenter showToast={showToast} />
        </main>
      )}
      {filtersOpen && (
        <div className="store-filter-sheet">
          <header>
            <strong>Filtros</strong>
            <button aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)}>
              <X />
            </button>
          </header>
          <label>
            Raridade
            <select value={rarity} onChange={(event) => setRarity(event.target.value)}>
              <option>Todas</option>
              <option>Comum</option>
              <option>Especial</option>
              <option>Raro</option>
              <option>Épico</option>
              <option>Evento</option>
            </select>
          </label>
          <label>
            <input type="checkbox" /> Somente adquiridos
          </label>
          <label>
            <input type="checkbox" /> Itens limitados
          </label>
          <label>
            <input type="checkbox" /> Negociáveis
          </label>
          <button onClick={() => setFiltersOpen(false)}>Aplicar filtros</button>
        </div>
      )}
      {selected && (
        <ItemDetail
          item={selected}
          owned={owned.includes(selected.id)}
          onClose={() => setSelected(null)}
          onBuy={() => setBuying(selected)}
          onEquip={() => equip(selected)}
          onGift={() =>
            window.dispatchEvent(
              new CustomEvent("vdn-open-gifts", {
                detail: { tab: "Enviados", action: "send", item: selected.name, source: "Loja" },
              }),
            )
          }
        />
      )}
      {buying && (
        <div className="store-overlay">
          <PurchaseFlow
            item={buying}
            onClose={() => setBuying(null)}
            onComplete={() => {
              setOwned((current) => [...current, buying.id]);
              if (buying.category === "Perfil") {
                window.dispatchEvent(
                  new CustomEvent("vdn-open-profile-studio", {
                    detail: { tab: "Visual", source: "Loja" },
                  }),
                );
                showToast(`${buying.name} aberto no preview do Estúdio`);
              } else {
                equip(buying);
              }
              setBuying(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function StoreExperience(props: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  if (!props.visible) return <div className="store-experience is-hidden" aria-hidden="true" />;
  return (
    <StoreBoundary>
      <StoreContent onClose={props.onClose} showToast={props.showToast} />
    </StoreBoundary>
  );
}
