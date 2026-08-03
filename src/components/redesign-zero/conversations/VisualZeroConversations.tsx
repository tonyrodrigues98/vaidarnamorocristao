import { Link } from "@tanstack/react-router";
import { MessageCircle, RefreshCw, Search, UsersRound } from "lucide-react";

import type { NativeConversationsViewModel } from "@/components/conversations/native/native-conversations-model";

import {
  VisualZeroAvatar,
  VisualZeroEmpty,
  VisualZeroGroupedList,
  VisualZeroHeader,
  VisualZeroIconTile,
  VisualZeroLoading,
  VisualZeroPrimaryAction,
  VisualZeroRow,
  VisualZeroScreen,
  VisualZeroSection,
  VisualZeroStatusPill,
} from "../primitives";

export function VisualZeroConversations({ model }: { model: NativeConversationsViewModel }) {
  return (
    <VisualZeroScreen className="vz-conversations">
      <VisualZeroHeader
        eyebrow="Caixa de entrada"
        title="Conversas"
        description="Mensagens privadas e o chat da comunidade."
        action={
          <button
            type="button"
            className="vz-conversations__refresh"
            onClick={() => void model.onRefresh()}
            disabled={!model.online || model.refreshing}
            aria-label="Atualizar conversas"
          >
            <RefreshCw aria-hidden />
          </button>
        }
      />

      <label className="vz-conversations__search">
        <Search aria-hidden />
        <span className="sr-only">Buscar conversas</span>
        <input
          type="search"
          value={model.query}
          onChange={(event) => model.onQueryChange(event.target.value)}
          placeholder="Buscar conversas"
        />
      </label>

      {model.refreshing ? (
        <p className="vz-conversations__status" role="status" aria-live="polite">
          Atualizando conversas…
        </p>
      ) : null}

      <VisualZeroSection>
        <VisualZeroGroupedList className="vz-conversations__list">
          {model.showCommunity ? (
            <Link to="/conversas/comunidade" className="vz-action-row vz-conversations__community">
              <VisualZeroRow
                leading={
                  <VisualZeroIconTile tone="coral">
                    <UsersRound aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Comunidade Geral"
                description="Conversa aberta da comunidade"
                metadata={<VisualZeroStatusPill tone="coral">Fixado</VisualZeroStatusPill>}
              />
            </Link>
          ) : null}

          {model.activeCommitment ? (
            <Link
              to="/proposito/$matchId"
              params={{ matchId: model.activeCommitment.match_id }}
              className="vz-action-row"
            >
              <VisualZeroRow
                leading={
                  <VisualZeroIconTile tone="violet">
                    <MessageCircle aria-hidden />
                  </VisualZeroIconTile>
                }
                title="Propósito ativo"
                description="Suas outras conversas permanecem arquivadas durante este compromisso."
                trailing={<VisualZeroStatusPill tone="violet">Abrir</VisualZeroStatusPill>}
              />
            </Link>
          ) : model.loading ? (
            <VisualZeroLoading rows={6} label="Carregando conversas" />
          ) : model.items.length === 0 && !model.online ? (
            <VisualZeroEmpty
              icon={<MessageCircle aria-hidden />}
              title="Você está offline"
              description="Reconecte para atualizar suas conversas."
              action={
                <VisualZeroPrimaryAction onClick={() => void model.onRefresh()}>
                  Tentar novamente
                </VisualZeroPrimaryAction>
              }
            />
          ) : model.items.length === 0 ? (
            <VisualZeroEmpty
              icon={<MessageCircle aria-hidden />}
              title="Nenhuma conversa privada ainda"
              description="Quando uma conversa começar, ela aparecerá aqui."
              action={
                <VisualZeroPrimaryAction to="/pretendentes">
                  Ver pretendentes
                </VisualZeroPrimaryAction>
              }
            />
          ) : model.filteredItems.length === 0 ? (
            <VisualZeroEmpty
              icon={<Search aria-hidden />}
              title="Nada encontrado"
              description="Tente buscar por outro nome ou abra a Comunidade Geral."
            />
          ) : (
            model.filteredItems.map((item) => {
              const firstName = item.partner.full_name.split(" ")[0];
              return (
                <Link
                  key={item.matchId}
                  to="/conversas/$matchId"
                  params={{ matchId: item.matchId }}
                  className="vz-action-row vz-conversations__row"
                >
                  <VisualZeroRow
                    leading={
                      <VisualZeroAvatar
                        src={item.partner.photo_url}
                        alt={item.partner.full_name}
                        fallback={firstName.charAt(0)}
                        size="md"
                      />
                    }
                    title={firstName}
                    description={item.lastMessage || "Diga olá"}
                    metadata={new Date(item.lastAt).toLocaleDateString("pt-BR")}
                    trailing={
                      item.unread ? (
                        <span className="vz-conversations__unread">
                          <span className="sr-only">Mensagem não lida</span>
                        </span>
                      ) : undefined
                    }
                  />
                </Link>
              );
            })
          )}
        </VisualZeroGroupedList>
      </VisualZeroSection>
    </VisualZeroScreen>
  );
}
