import type { ConversationRepository } from "./contracts";
import { supabaseConversationRepository } from "./repository";
import { V2Conversations } from "./V2Conversations";

export function V2ConversationsFeature({
  userId,
  repository = supabaseConversationRepository,
}: {
  readonly userId: string;
  readonly repository?: ConversationRepository;
}) {
  return <V2Conversations userId={userId} repository={repository} />;
}
