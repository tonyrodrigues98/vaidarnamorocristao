import { MessageCircle, RefreshCw, Search, UsersRound, WifiOff } from "lucide-react";

import type { NativeConversationsViewModel } from "@/components/conversations/native/NativeConversationsView";

export type Prototype01ConversasScreenProps = {
  model: NativeConversationsViewModel;
  onOpenCommunity(): void;
  onOpenConversation(matchId: string): void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function Prototype01ConversasScreen({
  model,
  onOpenCommunity,
  onOpenConversation,
}: Prototype01ConversasScreenProps) {
  return (
    <section
      className="screen messages-screen"
      aria-label="Conversas"
      data-action-context="conversation"
      data-action-title="Conversas"
    >
      <div className="page-scroll messages-page-scroll">
        <header className="topbar contextual-topbar">
          <div>
            <span className="section-overline">SUAS CONEXÕES</span>
            <h1>Conversas</h1>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button pressable"
              aria-label="Atualizar conversas"
              onClick={() => void model.onRefresh()}
              disabled={!model.online}
            >
              <RefreshCw size={20} className={model.refreshing ? "spin" : ""} />
            </button>
          </div>
        </header>

        <div className="message-sections tab-strip" role="tablist">
          <button type="button" role="tab" aria-selected className="active">
            Conversas
          </button>
          <button type="button" role="tab" aria-selected={false} disabled>
            Solicitações
          </button>
        </div>

        <div className="filter-scroller">
          <label className="community-search-button">
            <Search size={18} />
            <span className="sr-only">Buscar conversas</span>
            <input
              type="search"
              value={model.query}
              onChange={(event) => model.onQueryChange(event.target.value)}
              placeholder="Buscar conversas"
            />
          </label>
        </div>

        {!model.online ? (
          <div className="community-status-banner" role="status">
            <WifiOff size={15} /> Você está offline. Exibindo conversas já carregadas.
          </div>
        ) : null}

        <div className="chat-list">
          {model.showCommunity ? (
            <button type="button" className="chat-row pressable" onClick={onOpenCommunity}>
              <span className="avatar avatar-md chat-avatar chat-space">
                <UsersRound size={20} />
              </span>
              <span className="chat-copy">
                <strong>Chat geral</strong>
                <small>Conversa em tempo real da comunidade.</small>
              </span>
              <span className="chat-status">
                <time>Agora</time>
              </span>
            </button>
          ) : null}

          {model.loading ? (
            <div className="conversation-list-skeleton" aria-label="Carregando conversas">
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
          ) : null}

          {!model.loading && model.items.length === 0 ? (
            <div className="community-empty-state">
              <MessageCircle size={30} />
              <h2>Nenhuma conversa privada ainda</h2>
              <p>Quando houver um match ou uma conversa, ela aparecerá aqui.</p>
            </div>
          ) : null}

          {!model.loading && model.items.length > 0 && model.filteredItems.length === 0 ? (
            <div className="community-empty-state">
              <Search size={30} />
              <h2>Nada encontrado</h2>
              <p>Tente buscar por outro nome ou abra o Chat geral.</p>
            </div>
          ) : null}

          {model.filteredItems.map((item) => (
            <button
              key={item.matchId}
              type="button"
              className="chat-row pressable"
              onClick={() => onOpenConversation(item.matchId)}
            >
              <span className="avatar avatar-md chat-avatar chat-person">
                {item.partner.photo_url ? (
                  <img src={item.partner.photo_url} alt="" />
                ) : (
                  initials(item.partner.full_name)
                )}
              </span>
              <span className="chat-copy">
                <strong>{item.partner.full_name}</strong>
                <small>{item.lastMessage ?? "Conversa iniciada"}</small>
              </span>
              <span className="chat-status">
                <time>{formatTime(item.lastAt)}</time>
                {item.unread ? <small aria-label="Mensagem não lida">1</small> : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
