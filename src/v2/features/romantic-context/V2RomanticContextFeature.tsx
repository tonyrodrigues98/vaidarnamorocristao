import type { RomanticContextRepository } from "./contracts";
import { supabaseRomanticContextRepository } from "./repository";
import { V2AnonymousNotes } from "./V2AnonymousNotes";
import { V2PurposeCenter } from "./V2PurposeCenter";

export function V2RomanticContextFeature({
  area,
  userId,
  repository = supabaseRomanticContextRepository,
  onOpenConversations,
}: {
  readonly area: "purpose" | "anonymous";
  readonly userId: string;
  readonly repository?: RomanticContextRepository;
  readonly onOpenConversations: () => void;
}) {
  return area === "purpose" ? (
    <V2PurposeCenter
      userId={userId}
      repository={repository}
      onOpenConversations={onOpenConversations}
    />
  ) : (
    <V2AnonymousNotes
      userId={userId}
      repository={repository}
      onOpenConversations={onOpenConversations}
    />
  );
}
