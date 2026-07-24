import type { DatingRepository } from "./contracts";
import { supabaseDatingRepository } from "./repository";
import { V2DatingMode } from "./V2DatingMode";

export function V2DatingFeature({
  userId,
  repository = supabaseDatingRepository,
  onReviewPreferences,
  onMembershipExit,
  onOpenConversations,
}: {
  readonly userId: string;
  readonly repository?: DatingRepository;
  readonly onReviewPreferences: () => void;
  readonly onMembershipExit: () => Promise<void>;
  readonly onOpenConversations: () => void;
}) {
  return (
    <V2DatingMode
      userId={userId}
      repository={repository}
      onReviewPreferences={onReviewPreferences}
      onMembershipExit={onMembershipExit}
      onOpenConversations={onOpenConversations}
    />
  );
}
