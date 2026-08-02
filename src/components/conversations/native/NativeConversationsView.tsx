import { MessageCircle, Search } from "lucide-react";

import { CommitmentPauseCard } from "@/components/commitment/CommitmentPauseCard";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { ConversationListSkeleton } from "@/components/ui/AppSkeletons";
import { OfflineState } from "@/components/ui/OfflineState";
import type { ConversationItem } from "@/hooks/useConversationsList";
import type { RelationshipCommitment } from "@/lib/commitments";

import { NativeCommunityConversationRow } from "./NativeCommunityConversationRow";
import { NativeConversationRow } from "./NativeConversationRow";

export type NativeConversationsViewModel = {
  query: string;
  items: ConversationItem[];
  filteredItems: ConversationItem[];
  showCommunity: boolean;
  loading: boolean;
  refreshing: boolean;
  online: boolean;
  activeCommitment: RelationshipCommitment | null;
  onQueryChange(value: string): void;
  onRefresh(): Promise<void> | void;
};

export type NativeConversationsViewProps = {
  model: NativeConversationsViewModel;
};

export function NativeConversationsView({ model }: NativeConversationsViewProps) {
  return (
    <PullToRefresh onRefresh={model.onRefresh} disabled={!model.online}>
      <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-4 sm:px-6 sm:pt-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Conversas</h1>
          <p className="text-sm text-muted-foreground">Mensagens privadas e chat geral.</p>
        </div>

        <label className="relative mt-5 block">
          <span className="sr-only">Buscar conversas</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={model.query}
            onChange={(event) => model.onQueryChange(event.target.value)}
            placeholder="Buscar conversas"
            className="min-h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {model.refreshing && (
          <p className="mt-3 text-xs text-muted-foreground" role="status" aria-live="polite">
            Atualizando conversas…
          </p>
        )}

        <div className="mt-4 space-y-2">
          {model.showCommunity && <NativeCommunityConversationRow />}

          {model.activeCommitment ? (
            <CommitmentPauseCard
              matchId={model.activeCommitment.match_id}
              description="Você está em um propósito ativo. Por isso, suas outras conversas ficam arquivadas e fora de vista enquanto esse compromisso estiver firmado."
              className="mt-3"
            />
          ) : model.loading ? (
            <ConversationListSkeleton rows={6} />
          ) : model.items.length === 0 && !model.online ? (
            <OfflineState
              actionLabel="Tentar novamente"
              onAction={() => void model.onRefresh()}
              className="mt-2"
            />
          ) : model.items.length === 0 ? (
            <AppEmptyState
              icon={<MessageCircle className="h-5 w-5" />}
              title="Nenhuma conversa privada ainda"
              description="Quando você tiver um match ou iniciar uma conversa, ela aparecerá aqui."
              actionLabel="Ver pretendentes"
              actionTo="/pretendentes"
            />
          ) : model.filteredItems.length === 0 ? (
            <AppEmptyState
              compact
              icon={<Search className="h-5 w-5" />}
              title="Nada encontrado"
              description="Tente buscar por outro nome ou abra o Chat geral."
            />
          ) : (
            model.filteredItems.map((item) => (
              <NativeConversationRow key={item.matchId} item={item} />
            ))
          )}
        </div>
      </main>
    </PullToRefresh>
  );
}
