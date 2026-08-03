import { Link } from "@tanstack/react-router";
import { MessageCircle, Search, UsersRound } from "lucide-react";

import { CommitmentPauseCard } from "@/components/commitment/CommitmentPauseCard";
import { DecoratedAvatar } from "@/components/DecoratedAvatar";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { OfflineState } from "@/components/ui/OfflineState";
import type { NativeConversationsViewModel } from "@/components/conversations/native/NativeConversationsView";

import { RedesignBadge, RedesignEmptyState, RedesignPage, RedesignSkeleton } from "../primitives";

export function RedesignConversationsView({ model }: { model: NativeConversationsViewModel }) {
  return (
    <PullToRefresh onRefresh={model.onRefresh} disabled={!model.online}>
      <RedesignPage className="rd-conversations">
        <header className="rd-page-heading rd-conversations__heading">
          <RedesignBadge>Mensagens e comunidade</RedesignBadge>
          <h1>Conversas</h1>
          <p>Retome suas conversas privadas ou entre no chat geral.</p>
        </header>

        <label className="rd-conversations__search">
          <span className="sr-only">Buscar conversas</span>
          <Search aria-hidden />
          <input
            type="search"
            value={model.query}
            onChange={(event) => model.onQueryChange(event.target.value)}
            placeholder="Buscar conversas"
          />
        </label>

        {model.refreshing ? (
          <p className="rd-refresh-status" role="status">
            Atualizando conversas…
          </p>
        ) : null}

        <div className="rd-conversations__list">
          {model.showCommunity ? (
            <Link
              to="/conversas/comunidade"
              className="rd-conversation-row rd-conversation-row--community"
            >
              <span className="rd-conversation-row__community-icon">
                <UsersRound aria-hidden />
              </span>
              <span className="rd-conversation-row__content">
                <strong>Chat geral</strong>
                <small>Conversa coletiva da comunidade</small>
              </span>
              <RedesignBadge>Fixado</RedesignBadge>
            </Link>
          ) : null}

          {model.activeCommitment ? (
            <CommitmentPauseCard
              matchId={model.activeCommitment.match_id}
              description="Você está em um propósito ativo. Suas outras conversas ficam arquivadas enquanto esse compromisso estiver firmado."
            />
          ) : model.loading ? (
            <div className="rd-conversations__skeletons">
              {Array.from({ length: 6 }, (_, index) => (
                <RedesignSkeleton key={index} />
              ))}
            </div>
          ) : model.items.length === 0 && !model.online ? (
            <OfflineState actionLabel="Tentar novamente" onAction={() => void model.onRefresh()} />
          ) : model.items.length === 0 ? (
            <RedesignEmptyState
              title="Nenhuma conversa privada ainda"
              description="Quando você tiver um match ou iniciar uma conversa, ela aparecerá aqui."
              action={<Link to="/pretendentes">Ver pretendentes</Link>}
            />
          ) : model.filteredItems.length === 0 ? (
            <RedesignEmptyState
              title="Nada encontrado"
              description="Tente buscar por outro nome ou abra o Chat geral."
            />
          ) : (
            model.filteredItems.map((item) => {
              const firstName = item.partner.full_name.split(" ")[0];
              return (
                <Link
                  key={item.matchId}
                  to="/conversas/$matchId"
                  params={{ matchId: item.matchId }}
                  className="rd-conversation-row"
                  aria-label={`${item.unread ? "Não lida: " : ""}Conversa com ${firstName}`}
                >
                  <DecoratedAvatar
                    photoUrl={item.partner.photo_url}
                    fallback={item.partner.full_name.charAt(0)}
                    size={48}
                    frameId={item.partner.equipped_frame_id ?? null}
                    auraId={item.partner.equipped_aura_id ?? null}
                    isCommitted={item.partner.committed}
                    className="rd-conversation-avatar"
                  />
                  <span className="rd-conversation-row__content">
                    <span>
                      <strong>{firstName}</strong>
                      <time dateTime={item.lastAt}>
                        {new Date(item.lastAt).toLocaleDateString("pt-BR")}
                      </time>
                    </span>
                    <small data-unread={String(item.unread)}>
                      {item.lastMessage ?? "Diga olá"}
                    </small>
                  </span>
                  {item.unread ? (
                    <span className="rd-conversation-row__unread">
                      <span className="sr-only">Mensagem não lida</span>
                    </span>
                  ) : null}
                </Link>
              );
            })
          )}
        </div>
      </RedesignPage>
    </PullToRefresh>
  );
}
