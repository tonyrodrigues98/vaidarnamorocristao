import type { ConversationItem } from "@/hooks/useConversationsList";
import type { RelationshipCommitment } from "@/lib/commitments";

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
